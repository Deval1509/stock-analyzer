import React, { useState } from "react";
import axios from "axios";
import Select from "react-select";
import { Line } from "react-chartjs-2";
import "./StockViewer.css";
import BASE_URL from "../config";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";

// Register necessary components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const StockViewer = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [symbol, setSymbol] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [historicalData, setHistoricalData] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [predictedData, setPredictedData] = useState("");
  const [reasoning, setReasoning] = useState("");
  const [historicalPrices, setHistoricalPrices] = useState([]);
  const [showPredictions, setShowPredictions] = useState(false);

  // Fetch search results based on query
  const handleSearch = async (query) => {
    try {
      setSearchTerm(query);
      if (query.length < 2) {
        setSearchResults([]);
        return;
      }

      // Make the API call using BASE_URL
      const response = await axios.get(`${BASE_URL}/stock/search`, {
        params: { query, _: new Date().getTime() },
      });

      console.log("API Response:", response.data);

      const results = response.data.map((stock) => ({
        value: stock.symbol,
        label: `${stock.name} (${stock.symbol})`,
      }));
      setSearchResults(results);
    } catch (err) {
      setSearchResults([]);
      setError("Failed to fetch search results.");
      console.error(err);
    }
  };


  // Fetch historical data based on selected stock and date range
  const fetchHistoricalData = async () => {
    try {
      if (!symbol || !fromDate || !toDate) {
        setError("Please select a stock and a valid date range.");
        return;
      }
  
      setLoading(true);
      const response = await axios.get(`${BASE_URL}/historical`, {
        params: { symbol, from: fromDate, to: toDate },
      });
      
      console.log("API Call Params:", { symbol, from: fromDate, to: toDate }); 
      console.log("Historical Data Response:", response.data);

      const rawHistoricalData = response.data.data || [];
      const rawHistoricalPrices = rawHistoricalData.map((entry) => entry.price);
      const validPrices = rawHistoricalPrices.filter((price) => price != null && !isNaN(price));
  
      if (validPrices.length < 30) {
        setError("Insufficient valid historical data. At least 30 valid data points are required.");
        setHistoricalData([]);
        return;
      }
  
      setHistoricalData(rawHistoricalData);
      setHistoricalPrices(validPrices);
      setError("");
    } catch (err) {
      setError("Failed to fetch historical data.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  
  // Fetch Prediction data/chart
  const handlePrediction = async () => {
    try {
      if (!historicalPrices || historicalPrices.length < 30) {
        setError("Please fetch historical data before requesting predictions.");
        return;
      }
  
      setLoading(true);
      const response = await axios.post(`${BASE_URL}/predict`, { data: historicalPrices });
  
      setPredictedData(response.data.predicted_prices);
      setReasoning(response.data.reasoning);
      setError("");
    } catch (error) {
      console.error("Error:", error);
      setError(error.response?.data?.error || "Failed to fetch Predictions");
    } finally {
      setLoading(false);
    }
  };
  
    // Extract time and price data for the historical chart
    const historicalTimes = historicalData.map((entry) => entry.time);
    // const historicalPrices = historicalData.map((entry) => entry.price);
    // const validHistoricalPrices = historicalPrices.filter((price) => price != null && !isNaN(price));

  return (
    <div className="stock-viewer-container">
      {/* Header */}
      <h1 className="stock-viewer-header">Stock Price Analyzer</h1>

      {/* Stock Search Input */}
      <div className="stock-input-container">
        <Select
          inputValue={searchTerm}
          onInputChange={(value) => handleSearch(value)}
          options={searchResults}
          onChange={(selectedOption) => setSymbol(selectedOption.value)}
          placeholder="Search for a stock (e.g., AAPL)"
          styles={customSelectStyles}
        />
      </div>

      {/* Date Range Inputs */}
      <div className="date-input-container">
        <label>
          From:
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
          />
        </label>
        <label>
          To:
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
          />
        </label>
      </div>

      {/* Fetch Button */}
      <div className="fetch-button-container">
        <button onClick={fetchHistoricalData} disabled={loading}>
          {loading ? "Fetching..." : "Fetch Data"}
        </button>
      </div>

      {/* Fetch Prediction*/}
      <div className="fetch-button-container">
      <button
        onClick={() => {
          handlePrediction();
          setShowPredictions(true);
        }}
      >
        Check Future Predictions
       </button>
      </div>

      {/* Error Message */}
      {error && <p className="error-message">{error}</p>}

      {/* Chart Container */}
      {historicalData.length > 0 && (
        <div className="chart-container">
          <h2>
            Historical Data ({fromDate} to {toDate})
          </h2>
          <Line
            data={{
              labels: historicalTimes,
              datasets: [
                {
                  label: `${symbol} Historical Stock Price`,
                  data: historicalPrices,
                  borderColor: "#3498db",
                  backgroundColor: "rgba(52, 152, 219, 0.5)",
                  pointRadius: 5,
                  pointHoverRadius: 8,
                  fill: true,
                },
              ],
            }}
            options={{
              responsive: true,
              maintainAspectRatio: true,
              aspectRatio: 2,
              plugins: {
                tooltip: {
                  callbacks: {
                    label: (context) => `Price: $${context.raw.toFixed(2)}`,
                  },
                },
                legend: {
                  display: true,
                  position: "top",
                },
              },
              scales: {
                x: {
                  title: {
                    display: true,
                    text: "Date",
                    font: {
                      size: 14,
                    },
                  },
                  ticks: {
                    autoSkip: true,
                    maxTicksLimit: 10,
                    font: {
                      size: 12,
                    },
                  },
                  grid: {
                    display: true,
                  },
                },
                y: {
                  title: {
                    display: true,
                    text: "Price (USD)",
                  },
                  ticks: {
                    beginAtZero: false,
                  },
                  grid: {
                    drawBorder: true,
                  },
                },
              },
            }}
          />
        </div>
      )}
      {showPredictions && predictedData && predictedData.length > 0 && (
        <div className="chart-container">
          <h2>Predicted Data</h2>
          <Line
            data={{
              labels: Array.from({ length: predictedData.length }, (_, i) => `Day ${i + 1}`),
              datasets: [
                {
                  label: "Predicted Stock Prices",
                  data: predictedData,
                  borderColor: "#e74c3c",
                  backgroundColor: "rgba(231, 76, 60, 0.5)",
                  pointRadius: 5,
                  pointHoverRadius: 8,
                  fill: true,
                },
              ],
            }}
            options={{
              responsive: true,
              maintainAspectRatio: true,
              plugins: {
                tooltip: {
                  callbacks: {
                    label: (context) => `Price: $${context.raw?.toFixed(2)}`,
                  },
                },
                legend: {
                  display: true,
                  position: "top",
                },
              },
              scales: {
                x: {
                  title: {
                    display: true,
                    text: "Future Days",
                  },
                },
                y: {
                  title: {
                    display: true,
                    text: "Price (USD)",
                  },
                },
              },
            }}
          />
        </div>
      )}
    </div>
  );
};

export default StockViewer;

const customSelectStyles = {
  container: (provided) => ({
    ...provided,
    width: "300px",
  }),
  control: (provided) => ({
    ...provided,
    padding: "5px",
    borderRadius: "8px",
    border: "1px solid #ccc",
  }),
};


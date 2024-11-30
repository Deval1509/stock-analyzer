import React, { useState } from "react";
import axios from "axios";
import Select from "react-select";
import { Line } from "react-chartjs-2";
import { Chart as ChartJS } from "chart.js/auto";
import "./StockViewer.css";

const StockViewer = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [symbol, setSymbol] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [historicalData, setHistoricalData] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [isChartMaximized, setIsChartMaximized] = useState(false);

  // Toggle chart size
  const toggleChartSize = () => {
    setIsChartMaximized((prev) => !prev);
  };

  // Fetch search results based on query
  const handleSearch = async (query) => {
    try {
      setSearchTerm(query);
      if (query.length < 2) {
        setSearchResults([]);
        return;
      }

      const response = await axios.get(
        "https://stock-analyzer-db.onrender.com/search",
        {
          params: { query, _: new Date().getTime() },
        }
      );

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

      if (new Date(fromDate) > new Date(toDate)) {
        setError("The 'From' date cannot be later than the 'To' date.");
        return;
      }

      setLoading(true);
      const response = await axios.get(
        "https://stock-analyzer-db.onrender.com/historical",
        {
          params: { symbol, from: fromDate, to: toDate },
        }
      );

      const { data: prices } = response.data;

      if (prices && prices.length > 0) {
        setHistoricalData(prices);
        setError("");
      } else {
        setError("No historical data available for the selected range.");
        setHistoricalData([]);
      }
    } catch (err) {
      setError("Failed to fetch historical data.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Extract time and price data for the historical chart
  const historicalTimes = historicalData.map((entry) => entry.time);
  const historicalPrices = historicalData.map((entry) => entry.price);

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
  
      {/* Error Message */}
      {error && <p className="error-message">{error}</p>}
  
      {/* Chart Container */}
      {historicalData.length > 0 && (
        <div
          className={`chart-container ${
            isChartMaximized ? "maximized" : "minimized"
          }`}
        >
          <button className="chart-toggle-button" onClick={toggleChartSize}>
            {isChartMaximized ? "Minimize" : "Maximize"}
          </button>
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
              maintainAspectRatio: false,
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
                  },
                  ticks: {
                    autoSkip: true,
                    maxTicksLimit: 10,
                  },
                },
                y: {
                  title: {
                    display: true,
                    text: "Price (USD)",
                  },
                  suggestedMin: Math.min(...historicalPrices) - 10,
                  suggestedMax: Math.max(...historicalPrices) + 10,
                  ticks: {
                    stepSize: Math.max(
                      Math.ceil((Math.max(...historicalPrices) - Math.min(...historicalPrices)) / 5),
                      1
                    ), // Calculate dynamic step size based on the range
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
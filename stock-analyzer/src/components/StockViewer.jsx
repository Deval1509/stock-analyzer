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
  const [fromDate, setFromDate] = useState(""); // New state for FROM date
  const [toDate, setToDate] = useState(""); // New state for TO date
  const [historicalData, setHistoricalData] = useState([]);
  const [error, setError] = useState("");

  // Fetch search results based on query
  const handleSearch = async (query) => {
    try {
      setSearchTerm(query); // Update search term
      if (query.length < 2) {
        setSearchResults([]);
        return;
      }
      const response = await axios.get("http://127.0.0.1:5000/search", {
        params: { query, _: new Date().getTime() },
      });
      const results = response.data.map((stock) => ({
        value: stock.symbol,
        label: `${stock.name} (${stock.symbol})`,
      }));
      setSearchResults(results);
    } catch (err) {
      setSearchResults([]);
      setError("Failed to fetch search results.");
    }
  };

  // Fetch historical data based on selected stock and date range
  const fetchHistoricalData = async () => {
    try {
      console.log("Symbol:", symbol, "From:", fromDate, "To:", toDate); // Debug log
  
      if (!symbol || !fromDate || !toDate) {
        setError("Please select a stock and a valid date range.");
        return;
      }
  
      const response = await axios.get("http://127.0.0.1:5000/historical", {
        params: { symbol, from: fromDate, to: toDate },
      });
      setHistoricalData(response.data.prices);
    } catch (err) {
      setError("Failed to fetch historical data.");
      console.error(err); 
    }
  };
  
  // Extract time and price data for historical chart
  const historicalTimes = historicalData.map((entry) => entry.time);
  const historicalPrices = historicalData.map((entry) => entry.price);

  return (
    <div className="stock-viewer-container">
      <h1 className="stock-viewer-header">Stock Price Analyzer</h1>

      <div className="stock-input-container">
        {/* Stock Search Input */}
        <Select
          inputValue={searchTerm}
          onInputChange={(value) => handleSearch(value)}
          options={searchResults}
          onChange={(selectedOption) => setSymbol(selectedOption.value)} // Set selected stock
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
        <button onClick={fetchHistoricalData}>Fetch Data</button>
      </div>

      {error && <p className="error-message">{error}</p>}

      {/* Display Chart */}
      {historicalData.length > 0 && (
        <div className="chart-container">
          <h2>Historical Data ({fromDate} to {toDate})</h2>
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

// Custom styles for Select
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

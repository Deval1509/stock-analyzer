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
  const [historicalData, setHistoricalData] = useState([]);
  const [error, setError] = useState("");

  // Fetch search results based on query
  const handleSearch = async (query) => {
    try {
      // Update the state to reflect what the user types
      setSearchTerm(query); 
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

  // Fetch 6-month historical data after stock is selected
  const handleStockSelection = async (selectedOption) => {
    try {
      // Set the selected stock symbol
      setSymbol(selectedOption.value);
      // Clear previous errors
      setError(""); 

      const response = await axios.get("http://127.0.0.1:5000/historical", {
        params: { symbol: selectedOption.value },
      });
      setHistoricalData(response.data.prices); 
    } catch (err) {
      setError("Failed to fetch historical data. Please check the symbol.");
    }
  };

  // Extract time and price data for historical chart
  const historicalTimes = historicalData.map((entry) => entry.time);
  const historicalPrices = historicalData.map((entry) => entry.price);

  return (
    <div className="stock-viewer-container">
      <h1 className="stock-viewer-header">Stock Price Analyzer</h1>
      <div className="stock-input-container">
        <Select
          inputValue={searchTerm}
          onInputChange={(value) => handleSearch(value)}
          options={searchResults}
          onChange={handleStockSelection} 
          placeholder="Search for a stock (e.g., AAPL)"
          styles={customSelectStyles}
        />
      </div>

      {error && <p className="error-message">{error}</p>}

      {historicalData.length > 0 && (
        <div className="chart-container">
          <h2>Historical Data (Last 6 Months)</h2>
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
                    // Customize tooltip content
                    label: function (context) {
                      return `Price: $${context.raw.toFixed(2)}`;
                    },
                  },
                },
                legend: {
                  display: true,
                  position: "top", 
                },
              },
              interaction: {
                mode: "index", 
                intersect: false,              },
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

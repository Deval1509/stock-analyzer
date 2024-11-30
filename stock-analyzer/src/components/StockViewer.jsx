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

  const toggleChartSize = () => {
    setIsChartMaximized((prev) => !prev);
  };

  // Fetch search results and historical data logic remains the same

  return (
    <div className="stock-viewer-container">
      <h1 className="stock-viewer-header">Stock Price Analyzer</h1>

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
        <button onClick={fetchHistoricalData} disabled={loading}>
          {loading ? "Fetching..." : "Fetch Data"}
        </button>
      </div>

      {error && <p className="error-message">{error}</p>}

      {historicalData.length > 0 && (
        <div
          className={`chart-container ${
            isChartMaximized ? "maximized" : "minimized"
          }`}
        >
          <button
            className="chart-toggle-button"
            onClick={toggleChartSize}
          >
            {isChartMaximized ? "Minimize" : "Maximize"}
          </button>
          <h2>
            Historical Data ({fromDate} to {toDate})
          </h2>
          <Line
            data={{
              labels: historicalData.map((entry) => entry.time),
              datasets: [
                {
                  label: `${symbol} Historical Stock Price`,
                  data: historicalData.map((entry) => entry.price),
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
                    label: (context) =>
                      `Price: $${context.raw.toFixed(2)}`,
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

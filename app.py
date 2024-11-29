from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
from datetime import datetime
import os

app = Flask(__name__)
# Enabling CORS to allow requests from React frontend
CORS(app, resources={r"/*": {"origins": "https://deval1509.github.io/stock-analyzer/"}})

API_KEY = os.getenv("API_KEY")
BASE_URL = "https://financialmodelingprep.com/api/v3"

## health check for backend
@app.route("/health", methods=["GET"])
def health_check():
    return jsonify({"status": "ok"}), 200

@app.route("/search", methods=["GET"])
def search_stocks():
    query = request.args.get("query")
    if not query:
        return jsonify({"error": "Search query is required"}), 400

    try:
        # Fetch search results from Financial Modeling Prep
        response = requests.get(f"{BASE_URL}/search", params={"query": query, "apikey": API_KEY})
        data = response.json()

        # Check if data is empty
        if not data:
            return jsonify({"error": "No matching stocks found."}), 404

        # Return the search results
        return jsonify(data)

    except requests.exceptions.RequestException as e:
        # Handle network errors
        return jsonify({"error": f"Failed to fetch data: {str(e)}"}), 500
    except Exception as e:
        # Handle other unexpected errors
        return jsonify({"error": f"An unexpected error occurred: {str(e)}"}), 500

## Searches Stocks
@app.route("/stock", methods=["GET"])
def get_stock_data():
    symbol = request.args.get("symbol")
    if not symbol:
        return jsonify({"error": "Stock symbol is required"}), 400

    try:
        response = requests.get(f"{BASE_URL}/quote/{symbol}?apikey={API_KEY}")
        data = response.json()
        if not data or "Error Message" in data:
            return jsonify({"error": "Failed to fetch stock data."}), 400

        prices = [{"time": "Now", "price": data[0]["price"]}]
        return jsonify({"symbol": symbol, "prices": prices})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

## Show historical charts for SEARCHED stocks
@app.route("/historical", methods=["GET"])
def get_historical_data():
    symbol = request.args.get("symbol")
    from_date = request.args.get("from")
    to_date = request.args.get("to")
    page = int(request.args.get("page", 1))  # Default to page 1
    page_size = int(request.args.get("page_size", 50))  # Default to 50 records per page

    if not symbol or not from_date or not to_date:
        return jsonify({"error": "Stock symbol and date range are required."}), 400

    try:
        # Fetch historical data from Financial Modeling Prep
        response = requests.get(
            f"{BASE_URL}/historical-price-full/{symbol}?apikey={API_KEY}"
        )
        data = response.json()

        # Check for errors in the response
        if "historical" not in data:
            return jsonify({"error": "Failed to fetch historical data."}), 400

        historical_data = data["historical"]

        # Parse and filter the data based on the date range
        from_date = datetime.strptime(from_date, "%Y-%m-%d")
        to_date = datetime.strptime(to_date, "%Y-%m-%d")

        filtered_data = [
            {"time": item["date"], "price": item["close"]}
            for item in historical_data
            if from_date <= datetime.strptime(item["date"], "%Y-%m-%d") <= to_date
        ]

        # Paginate the filtered data
        total_records = len(filtered_data)
        start_index = (page - 1) * page_size
        end_index = start_index + page_size
        paginated_data = filtered_data[start_index:end_index]

        # Return paginated results with metadata
        return jsonify({
            "symbol": symbol,
            "total_records": total_records,
            "page": page,
            "page_size": page_size,
            "total_pages": (total_records + page_size - 1) // page_size,  
            "data": paginated_data
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500
if __name__ == "__main__":
    app.run(debug=False)

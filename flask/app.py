from flask import Flask, request, jsonify
from flask_cors import CORS
import requests

app = Flask(__name__)
# Enabling CORS to allow requests from React frontend
CORS(app)  

API_KEY = "FUBR1JfW34uaqrFUTKQ82EpOH9z8JrvF"
BASE_URL = "https://financialmodelingprep.com/api/v3"

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
    if not symbol:
        return jsonify({"error": "Stock symbol is required"}), 400

    try:
        # Fetch historical data for the past 6 months
        response = requests.get(f"{BASE_URL}/historical-price-full/{symbol}?apikey={API_KEY}")
        data = response.json()
        if not data or "Error Message" in data:
            return jsonify({"error": "Failed to fetch historical data."}), 400

        # Filter the last 6 months of data
        historical_prices = data["historical"][:180] 
        prices = [
            {"time": item["date"], "price": item["close"]}
            for item in historical_prices
        ]
        return jsonify({"symbol": symbol, "prices": prices})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    app.run(debug=True)

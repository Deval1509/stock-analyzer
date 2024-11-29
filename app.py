from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
from datetime import datetime

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
    """
    Fetches historical stock data for a given stock symbol and date range.
    """
    symbol = request.args.get("symbol")
    from_date = request.args.get("from")
    to_date = request.args.get("to")

    # Validate inputs
    if not symbol or not from_date or not to_date:
        return jsonify({"error": "Stock symbol and date range are required."}), 400

    try:
        # Validate date format
        from_date_obj = datetime.strptime(from_date, "%Y-%m-%d")
        to_date_obj = datetime.strptime(to_date, "%Y-%m-%d")

        # Fetch historical data from Financial Modeling Prep API
        response = requests.get(
            f"{BASE_URL}/historical-price-full/{symbol}",
            params={"apikey": API_KEY}
        )
        data = response.json()

        # Check if historical data exists
        if "historical" not in data or not data["historical"]:
            return jsonify({"error": "No historical data available."}), 404

        historical_data = data["historical"]

        # Filter data within the date range
        filtered_data = [
            {"time": item["date"], "price": item["close"]}
            for item in historical_data
            if from_date_obj <= datetime.strptime(item["date"], "%Y-%m-%d") <= to_date_obj
        ]

        # If no data is available for the given range
        if not filtered_data:
            return jsonify({"error": "No data available for the given date range."}), 404

        # Return filtered historical data
        return jsonify({"symbol": symbol, "prices": filtered_data})
    except ValueError:
        return jsonify({"error": "Invalid date format. Use YYYY-MM-DD."}), 400
    except requests.exceptions.RequestException as e:
        return jsonify({"error": f"External API request failed: {str(e)}"}), 500
    except Exception as e:
        print("Error occurred:", e)
        return jsonify({"error": f"An unexpected error occurred: {str(e)}"}), 500

if __name__ == "__main__":
    app.run(debug=True)
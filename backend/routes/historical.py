from flask import Blueprint, request, jsonify
from datetime import datetime
import requests
from utils.constants import BASE_URL, API_KEY

historical_blueprint = Blueprint("historical", __name__)

@historical_blueprint.route("/", methods=["GET"])
def get_historical_data():
    symbol = request.args.get("symbol")
    from_date = request.args.get("from")
    to_date = request.args.get("to")

    # Log received parameters
    print(f"Received parameters - Symbol: {symbol}, From: {from_date}, To: {to_date}")

    if not symbol or not from_date or not to_date:
        return jsonify({"error": "Stock symbol and date range are required."}), 400

    try:
        # Validate dates
        try:
            from_date = datetime.strptime(from_date, "%Y-%m-%d")
            to_date = datetime.strptime(to_date, "%Y-%m-%d")
        except ValueError:
            return jsonify({"error": "Invalid date format. Use YYYY-MM-DD."}), 400

        # Fetch data from Financial Modeling Prep API
        response = requests.get(
            f"{BASE_URL}/historical-price-full/{symbol}?apikey={API_KEY}"
        )
        data = response.json()

        # Log API response
        if "historical" not in data:
            print(f"Unexpected response format: {data}")
            return jsonify({"error": "Failed to fetch historical data."}), 400

        historical_data = data["historical"]

        # Filter and validate data
        filtered_data = [
            {"time": item["date"], "price": item["close"]}
            for item in historical_data
            if from_date <= datetime.strptime(item["date"], "%Y-%m-%d") <= to_date
            and item.get("close") is not None  # Ensure valid prices
        ]

        # Pagination support
        page = int(request.args.get("page", 1))
        page_size = int(request.args.get("page_size", 50))
        total_records = len(filtered_data)
        start_index = (page - 1) * page_size
        end_index = start_index + page_size
        paginated_data = filtered_data[start_index:end_index]

        return jsonify({
            "symbol": symbol,
            "total_records": total_records,
            "page": page,
            "page_size": page_size,
            "total_pages": (total_records + page_size - 1) // page_size,
            "data": paginated_data
        })
    except Exception as e:
        print("Error in /historical:", str(e))
        return jsonify({"error": str(e)}), 500

@historical_blueprint.route("/health", methods=["GET"])
def health_check():
    return jsonify({"status": "ok"}), 200

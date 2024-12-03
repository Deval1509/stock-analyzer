# from flask import Flask, request, jsonify
# from flask_cors import CORS
# import requests
# from datetime import datetime
# import os
# from dotenv import load_dotenv
# import os
# from routes.prediction import prediction_blueprint
# from routes.historical import historical_blueprint

# load_dotenv()
# API_KEY = os.getenv("API_KEY")
# app = Flask(__name__)
# # Enabling CORS to allow requests from React frontend
# # CHeck if running loaccally or in production
# FLASK_ENV = os.getenv("FLASK_ENV", "development")
# if FLASK_ENV == "production":
#     CORS(app, resources={r"/*": {"origins": "https://deval1509.github.io"}})
#     API_KEY = os.getenv("API_KEY")
# else: 
#     CORS(app, resources={r"/*": {"origins": "http://localhost:5173"}})
#     API_KEY = "FUBR1JfW34uaqrFUTKQ82EpOH9z8JrvF";
#     BASE_URL = "https://financialmodelingprep.com/api/v3"

# # Register routes
# app.register_blueprint(prediction_blueprint, url_prefix="/predict")
# app.register_blueprint(historical_blueprint, url_prefix="/historical")

# ## health check for backend
# @app.route("/health", methods=["GET"])
# def health_check():
#     return jsonify({"status": "ok"}), 200

# @app.route("/search", methods=["GET"])
# def search_stocks():
#     query = request.args.get("query")
#     if not query:
#         return jsonify({"error": "Search query is required"}), 400

#     try:
#         # Fetch search results from Financial Modeling Prep
#         response = requests.get(f"{BASE_URL}/search", params={"query": query, "apikey": API_KEY})
#         data = response.json()

#         # Check if data is empty
#         if not data:
#             return jsonify({"error": "No matching stocks found."}), 404

#         # Return the search results
#         return jsonify(data)

#     except requests.exceptions.RequestException as e:
#         # Handle network errors
#         return jsonify({"error": f"Failed to fetch data: {str(e)}"}), 500
#     except Exception as e:
#         # Handle other unexpected errors
#         return jsonify({"error": f"An unexpected error occurred: {str(e)}"}), 500

# ## Searches Stocks
# @app.route("/stock", methods=["GET"])
# def get_stock_data():
#     symbol = request.args.get("symbol")
#     if not symbol:
#         return jsonify({"error": "Stock symbol is required"}), 400

#     try:
#         response = requests.get(f"{BASE_URL}/quote/{symbol}?apikey={API_KEY}")
#         data = response.json()
#         if not data or "Error Message" in data:
#             return jsonify({"error": "Failed to fetch stock data."}), 400

#         prices = [{"time": "Now", "price": data[0]["price"]}]
#         return jsonify({"symbol": symbol, "prices": prices})
#     except Exception as e:
#         return jsonify({"error": str(e)}), 500

# ## Show historical charts for SEARCHED stocks
# @app.route("/historical", methods=["GET"])
# def get_historical_data():
#     symbol = request.args.get("symbol")
#     from_date = request.args.get("from")
#     to_date = request.args.get("to")
#     page = int(request.args.get("page", 1))  # Default to page 1
#     page_size = int(request.args.get("page_size", 50))  # Default to 50 records per page

#     if not symbol or not from_date or not to_date:
#         return jsonify({"error": "Stock symbol and date range are required."}), 400

#     try:
#         # Fetch historical data from Financial Modeling Prep
#         response = requests.get(
#             f"{BASE_URL}/historical-price-full/{symbol}?apikey={API_KEY}"
#         )
#         data = response.json()

#         # Check for errors in the response
#         if "historical" not in data:
#             return jsonify({"error": "Failed to fetch historical data."}), 400

#         historical_data = data["historical"]

#         # Parse and filter the data based on the date range
#         from_date = datetime.strptime(from_date, "%Y-%m-%d")
#         to_date = datetime.strptime(to_date, "%Y-%m-%d")

#         filtered_data = [
#             {"time": item["date"], "price": item["close"]}
#             for item in historical_data
#             if from_date <= datetime.strptime(item["date"], "%Y-%m-%d") <= to_date
#         ]

#         # Paginate the filtered data
#         total_records = len(filtered_data)
#         start_index = (page - 1) * page_size
#         end_index = start_index + page_size
#         paginated_data = filtered_data[start_index:end_index]

#         # Return paginated results with metadata
#         return jsonify({
#             "symbol": symbol,
#             "total_records": total_records,
#             "page": page,
#             "page_size": page_size,
#             "total_pages": (total_records + page_size - 1) // page_size,  
#             "data": paginated_data
#         })
#     except Exception as e:
#         return jsonify({"error": str(e)}), 500
# if __name__ == "__main__":
#     app.run(debug=False)

from flask import Flask, request, jsonify
from flask_cors import CORS
from tensorflow.keras.models import load_model
from sklearn.preprocessing import MinMaxScaler
import numpy as np
from dotenv import load_dotenv
import os
import os
os.environ["TF_CPP_MIN_LOG_LEVEL"] = os.getenv("TF_CPP_MIN_LOG_LEVEL", "2")
from routes.stock import stock_blueprint
from routes.historical import historical_blueprint


load_dotenv()
app = Flask(__name__)
# Enable CORS
# # CHeck if running loaccally or in production
# FLASK_ENV = os.getenv("FLASK_ENV", "development")
# if FLASK_ENV == "production":
#     CORS(app, resources={r"/*": {"origins": "https://deval1509.github.io"}})
#     API_KEY = os.getenv("API_KEY")
# else: 
FLASK_ENV = os.getenv("FLASK_ENV", "development")

if FLASK_ENV == "production":
    CORS(app, resources={r"/*": {"origins": "https://deval1509.github.io"}})
    BASE_URL = "https://stock-analyzer-db.onrender.com"  # Replace with your actual Render backend URL
else:
    CORS(app, resources={r"/*": {"origins": ["http://localhost:5173"]}})
    BASE_URL = "http://127.0.0.1:5000"
    
app.register_blueprint(stock_blueprint, url_prefix="/stock")
app.register_blueprint(historical_blueprint, url_prefix="/historical")


# Load the pre-trained model
model = load_model("models/stock_prediction_model.h5")
model.compile(optimizer="adam", loss="mean_squared_error")


@app.route("/predict", methods=["POST"])
def predict():
    try:
        # Retrieve historical price data from the request
        historical_prices = request.json.get("data")
        if not historical_prices or len(historical_prices) < 30:
            return jsonify({"error": "Insufficient historical data. At least 30 data points are required."}), 400

        # Filter out invalid data
        historical_prices = [price for price in historical_prices if price is not None and not np.isnan(price)]
        if len(historical_prices) < 30:
            return jsonify({"error": "Insufficient valid historical data after filtering. At least 30 valid data points are required."}), 400

        # Preprocess the data
        scaler = MinMaxScaler(feature_range=(0, 1))
        scaled_data = scaler.fit_transform(np.array(historical_prices).reshape(-1, 1))
        X_test = np.array([scaled_data[-30:]])  # Use the last 30 data points
        X_test = X_test.reshape((1, 30, 1))

        # Make prediction
        predictions = model.predict(X_test)
        predicted_prices = scaler.inverse_transform(predictions).flatten().tolist()

        # Generate reasoning
        reasoning = (
            "The prediction is based on recent price trends analyzed by the LSTM model. "
            "The model identifies patterns in historical data to project future prices."
        )

        return jsonify({"predicted_prices": predicted_prices, "reasoning": reasoning})
    except Exception as e:
        return jsonify({"error": f"An error occurred during prediction: {str(e)}"}), 500

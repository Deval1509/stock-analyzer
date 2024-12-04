from flask import Blueprint, request, jsonify
import requests
from backend.utils.constants import BASE_URL, API_KEY

stock_blueprint = Blueprint("stock", __name__)

@stock_blueprint.route("/search", methods=["GET"])
def search_stocks():
    query = request.args.get("query")
    if not query:
        return jsonify({"error": "Search query is required"}), 400

    try:
        response = requests.get(f"{BASE_URL}/search", params={"query": query, "apikey": API_KEY})
        data = response.json()

        if not data:
            return jsonify({"error": "No matching stocks found."}), 404

        return jsonify(data)
    except requests.exceptions.RequestException as e:
        return jsonify({"error": f"Failed to fetch data: {str(e)}"}), 500

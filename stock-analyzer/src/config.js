const BASE_URL =
  process.env.NODE_ENV === "production"
    ? "https://stock-analyzer-db.onrender.com" // Live backend URL
    : "http://127.0.0.1:5000"; // Local backend URL

export default BASE_URL;

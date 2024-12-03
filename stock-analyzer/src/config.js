const BASE_URL =
  process.env.NODE_ENV === "production"
    ? "https://stock-analyzer-db.onrender.com"
    : "http://127.0.0.1:5000";

export default BASE_URL;

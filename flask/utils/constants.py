import os
from dotenv import load_dotenv

load_dotenv()

BASE_URL = "https://financialmodelingprep.com/api/v3"
API_KEY = os.getenv("API_KEY", "FUBR1JfW34uaqrFUTKQ82EpOH9z8JrvF")

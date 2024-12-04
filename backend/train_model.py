import numpy as np
import pandas as pd
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import LSTM, Dense, Dropout
from sklearn.preprocessing import MinMaxScaler

# Generate mock historical data for training
dates = pd.date_range(start="2023-01-01", periods=500)
prices = 100 + np.cumsum(np.random.randn(500))  # Simulated price data

# Preprocess the data
scaler = MinMaxScaler(feature_range=(0, 1))
scaled_data = scaler.fit_transform(prices.reshape(-1, 1))

# Create dataset
def create_dataset(data, window_size=30):
    X, y = [], []
    for i in range(len(data) - window_size):
        X.append(data[i:i+window_size])
        y.append(data[i+window_size])
    return np.array(X), np.array(y)

X, y = create_dataset(scaled_data, window_size=30)

# Build the LSTM model
model = Sequential([
    LSTM(50, return_sequences=True, input_shape=(X.shape[1], 1)),
    Dropout(0.2),
    LSTM(50, return_sequences=False),
    Dropout(0.2),
    Dense(1)
])
model.compile(optimizer="adam", loss="mean_squared_error")

# Train the model
model.fit(X, y, epochs=20, batch_size=32)

# Save the model
model.save("models/stock_prediction_model.h5")
print("Model saved to models/stock_prediction_model.h5")

from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd
import joblib
import os

app = Flask(__name__)
CORS(app)

# Configuration
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, 'model.pkl')

# Global variable to store the pipeline
pipeline = None

def load_pipeline():
    global pipeline
    if os.path.exists(MODEL_PATH):
        try:
            pipeline = joblib.load(MODEL_PATH)
            print("ML Pipeline loaded successfully (Joblib).")
        except Exception as e:
            print(f"Error loading pipeline: {e}")
    else:
        print(f"Pipeline file not found at {MODEL_PATH}")

# Initial load
load_pipeline()

@app.route('/predict', methods=['POST'])
def predict():
    if pipeline is None:
        return jsonify({'error': 'ML Pipeline not loaded on server.'}), 500
    
    try:
        data = request.get_json()
        
        # Map user-friendly inputs to model feature names
        # Features expected by pipeline: 
        # ['yr', 'temp', 'atemp', 'hum', 'windspeed', 'season', 'mnth', 'hr', 'holiday', 'weekday', 'workingday', 'weathersit']
        
        # Helper to get year index (0: 2011, 1: 2012)
        year_val = data.get('year', 2012)
        yr = 1 if int(year_val) >= 2012 else 0
        
        input_dict = {
            'yr': yr,
            'temp': float(data.get('temperature', 20)),     # °C
            'atemp': float(data.get('atemp', 20)),          # °C
            'hum': float(data.get('humidity', 50)),         # %
            'windspeed': float(data.get('windspeed', 10)),  # km/h
            'season': int(data.get('season', 1)),
            'mnth': int(data.get('month', 1)),
            'hr': int(data.get('hour', 12)),
            'holiday': int(data.get('holiday', 0)),
            'weekday': int(data.get('weekday', 1)),
            'workingday': int(data.get('workingday', 1)),
            'weathersit': int(data.get('weather_situation', 1))
        }
        
        # Create DataFrame for prediction
        df = pd.DataFrame([input_dict])
        
        # Prediction using the complete pipeline (handles scaling and encoding internally)
        prediction = pipeline.predict(df)[0]
        
        return jsonify({
            'prediction': float(max(0, round(prediction))),
            'status': 'success'
        })

    except Exception as e:
        return jsonify({'error': str(e)}), 400

@app.route('/status', methods=['GET'])
def status():
    return jsonify({
        'model_loaded': pipeline is not None,
        'status': 'healthy'
    })

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)

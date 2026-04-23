import pandas as pd
import numpy as np
import os
import pickle
import joblib
from sklearn.model_selection import train_test_split, cross_val_score, GridSearchCV
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.ensemble import RandomForestRegressor
from xgboost import XGBRegressor
from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score

# Configuration
DATA_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(DATA_DIR, 'model.pkl')
RESULTS_PATH = os.path.join(DATA_DIR, 'results.txt')

def load_data():
    """Load the dataset from the backend folder."""
    file_path = os.path.join(DATA_DIR, 'bike_sharing.csv')
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"Data file not found at {file_path}")
    print(f"Loading data from: {file_path}")
    return pd.read_csv(file_path)

def preprocess_data(df):
    """Un-normalize data and return features and target."""
    print("--- Preprocessing Data (Un-normalizing) ---")
    
    # 1. Un-normalize the dataset to use real-world values
    # These factors are from the UCI Bike Sharing Dataset description
    df['temp'] = df['temp'] * (39 - (-8)) + (-8)        # t_max=39, t_min=-8
    df['atemp'] = df['atemp'] * (50 - (-16)) + (-16)    # t_max=50, t_min=-16
    df['hum'] = df['hum'] * 100
    df['windspeed'] = df['windspeed'] * 67
    
    # 2. Feature Selection: Remove target-leakage and irrelevant columns
    drop_cols = ['instant', 'dteday', 'casual', 'registered']
    X = df.drop(columns=[c for c in drop_cols if c in df.columns] + ['cnt'])
    y = df['cnt']
    
    # 3. Define feature types for ColumnTransformer
    categorical_features = ['season', 'mnth', 'hr', 'holiday', 'weekday', 'workingday', 'weathersit']
    numerical_features = ['yr', 'temp', 'atemp', 'hum', 'windspeed']
    
    # Filter columns to ensure they exist
    categorical_features = [f for f in categorical_features if f in X.columns]
    numerical_features = [f for f in numerical_features if f in X.columns]
    
    print(f"Numerical Features: {numerical_features}")
    print(f"Categorical Features: {categorical_features}")
    
    # 4. Create Preprocessing Pipeline
    preprocessor = ColumnTransformer(
        transformers=[
            ('num', StandardScaler(), numerical_features),
            ('cat', OneHotEncoder(handle_unknown='ignore', sparse_output=False), categorical_features)
        ])
    
    return X, y, preprocessor

def build_and_evaluate(X, y, preprocessor):
    """Train multiple models and select the best one using complete pipelines."""
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    # Pruned models to stay under 50MB
    models = {
        'Random Forest': RandomForestRegressor(n_estimators=50, max_depth=15, random_state=42),
        'XGBoost': XGBRegressor(n_estimators=100, max_depth=6, learning_rate=0.1, random_state=42)
    }
    
    best_pipeline = None
    best_r2 = -1
    results = []

    for name, model in models.items():
        # Create full pipeline: Preprocessing -> Model
        pipeline = Pipeline(steps=[
            ('preprocessor', preprocessor),
            ('regressor', model)
        ])
        
        # Fit on training data (preprocessor fits only on training statistics)
        pipeline.fit(X_train, y_train)
        
        # Predict & Evaluate
        y_pred = pipeline.predict(X_test)
        r2 = r2_score(y_test, y_pred)
        mae = mean_absolute_error(y_test, y_pred)
        rmse = np.sqrt(mean_squared_error(y_test, y_pred))
        
        res_str = f"{name}: R2={r2:.4f}, MAE={mae:.2f}, RMSE={rmse:.2f}"
        print(res_str)
        results.append(res_str + "\n")
        
        if r2 > best_r2:
            best_r2 = r2
            best_pipeline = pipeline

    # Hyperparameter tuning for the best pipeline
    print(f"Tuning best model...")
    param_grid = {
        'regressor__n_estimators': [100, 200],
        'regressor__max_depth': [None, 10, 20],
    }
    grid_search = GridSearchCV(best_pipeline, param_grid, cv=3, scoring='r2', n_jobs=-1)
    grid_search.fit(X_train, y_train)
    best_pipeline = grid_search.best_estimator_
    
    final_score = r2_score(y_test, best_pipeline.predict(X_test))
    results.append(f"Final Tuned Model R2: {final_score:.4f}\n")
    print(f"Final Tuned R2 Score: {final_score:.4f}")

    return best_pipeline, results

def save_outputs(pipeline, results):
    """Save the final pipeline using joblib with compression and evaluation results."""
    # Using joblib with compression (level 3) to keep size minimal
    joblib.dump(pipeline, MODEL_PATH, compress=3)
    print(f"Complete pipeline saved to {MODEL_PATH}")
    
    with open(RESULTS_PATH, 'w') as f:
        f.write("--- Model Evaluation Results ---\n")
        f.writelines(results)
    print(f"Results saved to {RESULTS_PATH}")

if __name__ == "__main__":
    try:
        data = load_data()
        X, y, preprocessor = preprocess_data(data)
        best_pipeline, evaluation_results = build_and_evaluate(X, y, preprocessor)
        save_outputs(best_pipeline, evaluation_results)
        print("\nPipeline training complete and saved.")
    except Exception as e:
        print(f"Error during training: {e}")

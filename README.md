Sign Price Predictor
Overview

This project builds a machine learning model that estimates the price of a custom sign based on its characteristics such as dimensions, material, type, complexity, lighting, installation, and quantity.

The goal was to simulate a real-world pricing system using engineered synthetic data and demonstrate an end-to-end ML pipeline from data generation to deployment-ready prediction API and UI.

Problem Statement

Given a set of sign attributes, predict the final cost of producing the sign.

This is similar to real-world pricing systems used in signage and manufacturing industries where multiple factors influence cost.

Features Used

The model uses the following inputs:

Width (ft)
Height (ft)
Area (derived feature)
Sign Type (banner, vinyl, channel_letter, monument)
Material (PVC, Aluminum, Acrylic)
Complexity (low, medium, high)
Lighting Included (0/1)
Installation Included (0/1)
Quantity
Dataset

Since real pricing data was not available, a synthetic dataset was generated using realistic business rules:

Base price calculated using area × base rate
Multipliers applied for:
Material type
Sign type
Complexity level
Additional costs for:
Lighting
Installation
Random noise added to simulate real-world variability

This ensures the dataset behaves like real-world pricing logic while still being controlled and interpretable.

Models Tried

The following regression models were evaluated:

Linear Regression
Decision Tree Regressor
Random Forest Regressor
Model Selection

Models were evaluated using cross-validation and GridSearchCV.

Results:
Linear Regression → ~0.76 R²
Decision Tree → ~0.86 R²
Random Forest → ~0.92 R² (Best Model)
Final Model:

Random Forest Regressor

n_estimators = 50
max_depth = 10
Test R² ≈ 0.87
Why Random Forest?

Random Forest performed best because:

Captures non-linear relationships
Handles categorical interactions well
More robust to noise than a single decision tree
Better generalization on unseen data
Project Structure
backend/
  ├── model.py (training script)
  ├── sign_price_model.pickle
  ├── columns.json
  ├── main.py (FastAPI backend)

frontend/
  ├── UI (React / HTML form)
  ├── API integration to backend
API Usage

Example prediction input:

predict_price(
    width=10,
    height=5,
    sign_type="channel_letter",
    material="Aluminum",
    complexity="high",
    lighting=1,
    installation=1,
    quantity=2
)

Example output:

Estimated Price: $11562.94
How to Run Locally
Backend
pip install fastapi uvicorn scikit-learn pandas numpy
uvicorn main:app --reload
Frontend

Open UI in browser or run frontend server (React/HTML depending on setup).

Deployment
Backend can be deployed on Render / Railway
Frontend can be deployed on Vercel
Model file (pickle) and columns.json are loaded at runtime for predictions
Render backend settings (repo root service):
- Root Directory: leave empty (repo root)
- Build Command: pip install --upgrade pip setuptools wheel && pip install --only-binary=:all: -r requirements.txt
- Start Command: uvicorn app:app --app-dir backend --host 0.0.0.0 --port 10000
- Python version is pinned via root runtime.txt to python-3.11.8
Key Takeaways
Built full ML pipeline from data generation → model training → deployment
Performed feature engineering and encoding
Compared multiple regression models
Built working prediction API and UI
Created production-style structure for real-world usage
Author

Vinny Ch
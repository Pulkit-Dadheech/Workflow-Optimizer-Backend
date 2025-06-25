# ML Backend for Jira Bottleneck Analyzer

This folder contains a lightweight Python backend for generating recommendations from Jira CSV data using a DecisionTreeClassifier.

## Files
- `train_model.py`: Train a model on labeled CSV data and save it.
- `predict.py`: Load the trained model and generate recommendations for new CSVs.

## Setup
1. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

## Usage
- **Train the model:**
  ```bash
  python train_model.py --csv_path path/to/labeled_data.csv --model_path model.joblib
  ```
- **Predict recommendations:**
  ```bash
  python predict.py --csv_path path/to/new_data.csv --model_path model.joblib
  ```

## Integration
You can expose this backend as a REST API (e.g., using Flask or FastAPI) for integration with the frontend or a Node.js backend.

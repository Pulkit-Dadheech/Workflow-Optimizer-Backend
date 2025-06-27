import pandas as pd
import joblib
import argparse
from train_model import feature_engineering

parser = argparse.ArgumentParser(description='Make model-based predictions using trained classifier.')
parser.add_argument('--agg_csv', type=str, required=True, help='Path to aggregated input CSV')
parser.add_argument('--model_path', type=str, default='ml_backend/model.joblib', help='Path to trained model file')
parser.add_argument('--output_csv', type=str, default='model_recommendations.csv', help='Path to save output CSV with predictions')
args = parser.parse_args()

def main():
    df = pd.read_csv(args.agg_csv)
    
    # Load model and feature list
    model_bundle = joblib.load(args.model_path)
    model = model_bundle['model']
    feature_names = model_bundle['features']
    
    # Feature engineering
    df_features = feature_engineering(df)

    # Match features exactly
    if not all(f in df_features.columns for f in feature_names):
        raise ValueError("Mismatch between expected model features and CSV columns")

    X = df_features[feature_names]

    # Predict using the model
    preds = model.predict(X)
    df['model_recommendation'] = preds

    # Save the output CSV
    df.to_csv(args.output_csv, index=False)
    print(f"Model-based recommendations saved to {args.output_csv}")

if __name__ == '__main__':
    main()

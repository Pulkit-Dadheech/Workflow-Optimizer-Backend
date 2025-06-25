import pandas as pd
import numpy as np
import joblib
import argparse
from sklearn.preprocessing import LabelEncoder

def feature_engineering(df, feature_names=None):
    df = df.copy()
    # Example: parse durations if present
    if 'Created' in df.columns and 'Resolved' in df.columns:
        df['Created'] = pd.to_datetime(df['Created'], errors='coerce')
        df['Resolved'] = pd.to_datetime(df['Resolved'], errors='coerce')
        df['ResolutionTime'] = (df['Resolved'] - df['Created']).dt.total_seconds() / 3600.0
        df['ResolutionTime'] = df['ResolutionTime'].fillna(-1)
    if 'Comments' in df.columns:
        df['NumComments'] = df['Comments'].apply(lambda x: len(str(x).split(';')) if pd.notnull(x) else 0)
    for col in df.select_dtypes(include=['object']).columns:
        if col != 'recommendation_label':
            df[col] = LabelEncoder().fit_transform(df[col].astype(str))
    df = df.fillna(-1)
    if feature_names:
        # Ensure columns match training features
        for col in feature_names:
            if col not in df.columns:
                df[col] = -1
        df = df[feature_names]
    return df

parser = argparse.ArgumentParser(description='Predict recommendations using a trained model with feature engineering.')
parser.add_argument('--csv_path', type=str, required=True, help='Path to new Jira CSV file')
parser.add_argument('--model_path', type=str, default='model.joblib', help='Path to trained model')
args = parser.parse_args()

def main():
    df = pd.read_csv(args.csv_path)
    model_bundle = joblib.load(args.model_path)
    clf = model_bundle['model']
    features = model_bundle['features']
    df_fe = feature_engineering(df, feature_names=features)
    preds = clf.predict(df_fe)
    df['predicted_recommendation'] = preds
    print(df[['predicted_recommendation']])
    df.to_csv('predictions_with_recommendations.csv', index=False)
    print("Predictions saved to predictions_with_recommendations.csv")

if __name__ == '__main__':
    main()
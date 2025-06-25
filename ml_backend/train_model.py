import pandas as pd
import numpy as np
from sklearn.tree import DecisionTreeClassifier
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report
from sklearn.preprocessing import LabelEncoder
import joblib
import argparse

parser = argparse.ArgumentParser(description='Train a classifier on labeled Jira CSV data with feature engineering.')
parser.add_argument('--csv_path', type=str, required=True, help='Path to labeled CSV file')
parser.add_argument('--model_path', type=str, default='model.joblib', help='Path to save the trained model')
parser.add_argument('--model_type', type=str, default='decision_tree', choices=['decision_tree', 'random_forest'], help='Type of model to train')
args = parser.parse_args()

def feature_engineering(df):
    df = df.copy()
    # Example: parse durations if present
    if 'Created' in df.columns and 'Resolved' in df.columns:
        df['Created'] = pd.to_datetime(df['Created'], errors='coerce')
        df['Resolved'] = pd.to_datetime(df['Resolved'], errors='coerce')
        df['ResolutionTime'] = (df['Resolved'] - df['Created']).dt.total_seconds() / 3600.0
        df['ResolutionTime'] = df['ResolutionTime'].fillna(-1)
    # Count number of comments if present
    if 'Comments' in df.columns:
        df['NumComments'] = df['Comments'].apply(lambda x: len(str(x).split(';')) if pd.notnull(x) else 0)
    # Encode categorical columns
    for col in df.select_dtypes(include=['object']).columns:
        if col != 'recommendation_label':
            df[col] = LabelEncoder().fit_transform(df[col].astype(str))
    # Fill missing values
    df = df.fillna(-1)
    return df

def main():
    df = pd.read_csv(args.csv_path)
    if 'recommendation_label' not in df.columns:
        raise ValueError("CSV must contain a 'recommendation_label' column.")
    df = feature_engineering(df)
    X = df.drop('recommendation_label', axis=1)
    y = df['recommendation_label']
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    if args.model_type == 'random_forest':
        clf = RandomForestClassifier(n_estimators=100, max_depth=7, random_state=42)
    else:
        clf = DecisionTreeClassifier(max_depth=5, random_state=42)
    clf.fit(X_train, y_train)
    y_pred = clf.predict(X_test)
    print(classification_report(y_test, y_pred))
    joblib.dump({'model': clf, 'features': list(X.columns)}, args.model_path)
    print(f"Model saved to {args.model_path}")

if __name__ == '__main__':
    main()

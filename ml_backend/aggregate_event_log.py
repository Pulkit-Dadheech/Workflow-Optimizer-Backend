import pandas as pd
import argparse

parser = argparse.ArgumentParser(description='Aggregate Jira event log CSV into one row per case_id with engineered features.')
parser.add_argument('--csv_path', type=str, required=True, help='Path to event log CSV file')
parser.add_argument('--output_path', type=str, default='aggregated_data.csv', help='Path to save the aggregated CSV')
args = parser.parse_args()

def aggregate_event_log(df):
    # Parse timestamps
    df['timestamp'] = pd.to_datetime(df['timestamp'], errors='coerce')
    # Sort for each case
    df = df.sort_values(['case_id', 'timestamp'])
    # Feature engineering per case_id
    features = df.groupby('case_id').agg(
        start_time=('timestamp', 'min'),
        end_time=('timestamp', 'max'),
        total_steps=('activity', 'count'),
        unique_users=('user', 'nunique'),
        unique_roles=('role', 'nunique'),
        total_story_points=('story_points', 'max'),
        num_reopens=('activity', lambda x: (x == 'Reopened').sum()),
        num_qareviews=('activity', lambda x: (x == 'QA Review').sum()),
        num_resolved=('activity', lambda x: (x == 'Resolved').sum()),
        num_closed=('activity', lambda x: (x == 'Closed').sum()),
    ).reset_index()
    features['total_duration_hours'] = (features['end_time'] - features['start_time']).dt.total_seconds() / 3600.0
    # Drop raw times, keep only engineered features
    features = features.drop(['start_time', 'end_time'], axis=1)
    return features

def main():
    df = pd.read_csv(args.csv_path)
    agg = aggregate_event_log(df)
    agg.to_csv(args.output_path, index=False)
    print(f"Aggregated data saved to {args.output_path}")

if __name__ == '__main__':
    main()

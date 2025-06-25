import argparse
import os
import subprocess
import sys

parser = argparse.ArgumentParser(description='End-to-end pipeline: aggregate, train, and predict recommendations from Jira event log CSV.')
parser.add_argument('--event_log', type=str, required=True, help='Path to Jira event log CSV (one row per activity)')
parser.add_argument('--output_dir', type=str, default='ml_backend/auto_output', help='Directory to store intermediate and output files')
parser.add_argument('--model_type', type=str, default='random_forest', choices=['random_forest', 'decision_tree'], help='Model type for training')
args = parser.parse_args()

os.makedirs(args.output_dir, exist_ok=True)

agg_csv = os.path.join(args.output_dir, 'aggregated_data.csv')
model_path = os.path.join(args.output_dir, 'model.joblib')
pred_csv = os.path.join(args.output_dir, 'predictions_with_recommendations.csv')

# 1. Aggregate event log
echo = lambda msg: print(f"[pipeline] {msg}")
echo("Aggregating event log...")
subprocess.run([sys.executable, 'ml_backend/aggregate_event_log.py', '--csv_path', args.event_log, '--output_path', agg_csv], check=True)

echo("\nPlease add a 'recommendation_label' column to the aggregated CSV for supervised training.")
echo(f"Open {agg_csv} in Excel or a text editor, add the column, and save.")
echo("Once done, re-run this script with --skip_labeling to continue.")

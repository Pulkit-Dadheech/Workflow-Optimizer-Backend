import pandas as pd
import argparse
import os

def heuristic_recommend(df):
    recs = []
    rec_texts = []
    for _, row in df.iterrows():
        reasons = []
        texts = []
        if row.get('total_duration_hours', 0) > 24:
            reasons.append('Long cycle time')
            texts.append('This ticket took significantly longer than average to complete. Consider investigating process delays.')
        if row.get('num_reopens', 0) > 1:
            reasons.append('Multiple reopens')
            texts.append('This ticket was reopened multiple times, suggesting recurring issues or incomplete resolutions.')
        if row.get('total_steps', 0) > 8:
            reasons.append('Too many steps')
            texts.append('This ticket required an unusually high number of workflow steps, which may indicate process complexity.')
        if row.get('unique_users', 0) > 4:
            reasons.append('Too many users involved')
            texts.append('This ticket involved many different users, which could slow down progress or cause miscommunication.')
        if row.get('num_qareviews', 0) == 0:
            reasons.append('No QA review')
            texts.append('This ticket did not go through a QA review, which may impact quality assurance.')
        if not reasons:
            reasons.append('No major bottleneck detected')
            texts.append('No major bottlenecks or issues detected for this ticket.')
        recs.append('; '.join(reasons))
        rec_texts.append(' '.join(texts))
    df['heuristic_recommendation'] = recs
    df['recommendation_text'] = rec_texts
    return df

parser = argparse.ArgumentParser(description='Generate heuristic recommendations from aggregated Jira data.')
parser.add_argument('--agg_csv', type=str, required=True, help='Path to aggregated CSV (from aggregate_event_log.py)')
parser.add_argument('--output_csv', type=str, default='heuristic_recommendations.csv', help='Path to save recommendations CSV')
args = parser.parse_args()

def main():
    df = pd.read_csv(args.agg_csv)
    df = heuristic_recommend(df)
    df.to_csv(args.output_csv, index=False)
    print(f"Heuristic recommendations saved to {args.output_csv}")

if __name__ == '__main__':
    main()

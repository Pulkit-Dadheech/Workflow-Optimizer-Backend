import pandas as pd
import argparse
from collections import Counter
import numpy as np
from datetime import datetime

def process_level_insights(df):
    insights = []
    # Average, median, and variance of cycle time
    avg_duration = df['total_duration_hours'].mean()
    median_duration = df['total_duration_hours'].median()
    std_duration = df['total_duration_hours'].std()
    if avg_duration > 48:
        insights.append(f"The average ticket cycle time is high ({avg_duration:.1f} hours). Consider reviewing process efficiency.")
    else:
        insights.append(f"The average ticket cycle time is {avg_duration:.1f} hours.")
    insights.append(f"The median ticket cycle time is {median_duration:.1f} hours.")
    insights.append(f"The standard deviation of ticket cycle time is {std_duration:.1f} hours.")
    # QA review frequency
    no_qa = (df['num_qareviews'] == 0).sum()
    if no_qa > 0:
        insights.append(f"{no_qa} tickets did not go through QA review. Ensure QA is part of the workflow.")
    # Reopen frequency
    many_reopens = (df['num_reopens'] > 1).sum()
    if many_reopens > 0:
        insights.append(f"{many_reopens} tickets were reopened multiple times. Investigate recurring issues.")
    # Steps
    too_many_steps = (df['total_steps'] > 8).sum()
    if too_many_steps > 0:
        insights.append(f"{too_many_steps} tickets required more than 8 workflow steps. Simplify processes if possible.")
    # Tickets never closed
    never_closed = (df['num_closed'] == 0).sum() if 'num_closed' in df.columns else 0
    if never_closed > 0:
        insights.append(f"{never_closed} tickets were never closed. Review these for completion.")
    # Trend: is cycle time increasing over time?
    if 'case_id' in df.columns and 'total_duration_hours' in df.columns:
        try:
            df_sorted = df.copy()
            df_sorted['case_num'] = df_sorted['case_id'].str.extract(r'(\d+)').astype(float)
            df_sorted = df_sorted.sort_values('case_num')
            if len(df_sorted) > 3:
                trend = np.polyfit(df_sorted['case_num'], df_sorted['total_duration_hours'], 1)[0]
                if trend > 0:
                    insights.append("Average cycle time is increasing over time. Investigate recent process changes.")
                elif trend < 0:
                    insights.append("Average cycle time is decreasing over time. Recent improvements may be working.")
        except Exception:
            pass
    return insights

def user_level_insights(event_log):
    insights = []
    # Most active users
    user_counts = Counter(event_log['user'])
    top_users = user_counts.most_common(3)
    for user, count in top_users:
        insights.append(f"User {user} participated in {count} activities.")
    # Users with most reopens
    reopens = event_log[event_log['activity'] == 'Reopened']
    if not reopens.empty:
        reopen_counts = Counter(reopens['user'])
        for user, count in reopen_counts.most_common(2):
            insights.append(f"User {user} was involved in {count} ticket reopens.")
    # User with most delays (longest avg time between their actions)
    event_log['timestamp'] = pd.to_datetime(event_log['timestamp'], errors='coerce')
    user_delays = {}
    for user, group in event_log.groupby('user'):
        times = group['timestamp'].sort_values().tolist()
        if len(times) > 1:
            delays = [(times[i] - times[i-1]).total_seconds() / 3600.0 for i in range(1, len(times))]
            user_delays[user] = np.mean(delays)
    if user_delays:
        slowest_user = max(user_delays, key=user_delays.get)
        insights.append(f"User {slowest_user} has the longest average delay between actions ({user_delays[slowest_user]:.1f} hours). Consider workload balancing.")
    return insights

def activity_level_insights(event_log):
    insights = []
    # Most common activity
    activity_counts = Counter(event_log['activity'])
    most_common = activity_counts.most_common(1)
    if most_common:
        act, count = most_common[0]
        insights.append(f"The most common activity is '{act}' ({count} occurrences).")
    # Activity with most delays (longest avg time between steps)
    event_log = event_log.sort_values(['case_id', 'timestamp'])
    event_log['timestamp'] = pd.to_datetime(event_log['timestamp'], errors='coerce')
    delays = []
    for case_id, group in event_log.groupby('case_id'):
        times = group['timestamp'].tolist()
        acts = group['activity'].tolist()
        for i in range(1, len(times)):
            delay = (times[i] - times[i-1]).total_seconds() / 3600.0
            delays.append((acts[i], delay))
    if delays:
        delay_df = pd.DataFrame(delays, columns=['activity', 'delay_hours'])
        avg_delays = delay_df.groupby('activity')['delay_hours'].mean().sort_values(ascending=False)
        top_delay = avg_delays.head(1)
        for act, delay in top_delay.items():
            insights.append(f"The activity with the longest average delay is '{act}' ({delay:.1f} hours between steps).")
    # Busiest day of week
    if 'timestamp' in event_log.columns:
        event_log['weekday'] = event_log['timestamp'].dt.day_name()
        weekday_counts = event_log['weekday'].value_counts()
        if not weekday_counts.empty:
            busiest = weekday_counts.idxmax()
            insights.append(f"The busiest day of the week is {busiest}.")
    return insights

def main():
    parser = argparse.ArgumentParser(description='Generate process/user/activity-level insights from Jira event log and aggregated data.')
    parser.add_argument('--agg_csv', type=str, required=True, help='Path to aggregated CSV')
    parser.add_argument('--event_log', type=str, required=True, help='Path to event log CSV')
    parser.add_argument('--output_txt', type=str, default='process_insights.txt', help='Path to save insights text file')
    args = parser.parse_args()

    agg = pd.read_csv(args.agg_csv)
    event_log = pd.read_csv(args.event_log)

    insights = []
    insights.append('--- Process-level Insights ---')
    insights.extend(process_level_insights(agg))
    insights.append('\n--- User-level Insights ---')
    insights.extend(user_level_insights(event_log))
    insights.append('\n--- Activity-level Insights ---')
    insights.extend(activity_level_insights(event_log))

    with open(args.output_txt, 'w') as f:
        for line in insights:
            f.write(line + '\n')
    print(f"Process/user/activity insights saved to {args.output_txt}")

if __name__ == '__main__':
    main()

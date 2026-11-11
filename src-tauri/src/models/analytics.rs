use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HeatmapDay {
    pub date: String,
    pub count: i64,
    pub level: i64,
    pub tasks_completed: i64,
    pub habits_completed: i64,
    pub study_minutes: i64,
    pub dsa_solved: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DsaTopicMastery {
    pub topic_id: String,
    pub topic_name: String,
    pub solved: i64,
    pub total: i64,
    pub percentage: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DailyVelocity {
    pub day_name: String,
    pub date: String,
    pub study_hours: f64,
    pub tasks_completed: i64,
    pub habits_completed: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AnalyticsOverview {
    pub total_study_minutes: i64,
    pub weekly_study_minutes: i64,
    pub total_tasks_completed: i64,
    pub total_habits_completed: i64,
    pub total_dsa_solved: i64,
    pub current_streak_days: i64,
    pub heatmap_days: Vec<HeatmapDay>,
    pub dsa_topics: Vec<DsaTopicMastery>,
    pub weekly_velocity: Vec<DailyVelocity>,
}

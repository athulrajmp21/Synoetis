use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DsaTopicItem {
    pub id: String,
    pub name: String,
    pub slug: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DsaProblemItem {
    pub id: String,
    pub topic_id: String,
    pub topic_name: String,
    pub title: String,
    pub difficulty: String,
    pub platform: String,
    pub url: Option<String>,
    pub independent_solve: bool,
    pub confidence_score: i32,
    pub revision_due: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct AddDsaProblemInput {
    pub topic_name: String,
    pub title: String,
    pub difficulty: String,
    pub platform: Option<String>,
    pub url: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateDsaStatusInput {
    pub id: String,
    pub independent_solve: bool,
    pub confidence_score: i32,
}

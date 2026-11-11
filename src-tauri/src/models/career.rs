use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CompanyItem {
    pub id: String,
    pub name: String,
    pub website: Option<String>,
    pub tier: Option<String>,
    pub notes: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ApplicationItem {
    pub id: String,
    pub company_id: String,
    pub company_name: String,
    pub company_tier: Option<String>,
    pub company_website: Option<String>,
    pub role: String,
    pub job_url: Option<String>,
    pub salary_range: Option<String>,
    pub status: String, // 'wishlist', 'applied', 'oa_round', 'interview', 'offer', 'rejected'
    pub applied_date: Option<String>,
    pub deadline: Option<String>,
    pub notes: Option<String>,
    pub interviews_count: i32,
    pub updated_at: String,
}

#[derive(Debug, Clone, Deserialize)]
pub struct CreateApplicationInput {
    pub company_name: String,
    pub company_tier: Option<String>,
    pub company_website: Option<String>,
    pub role: String,
    pub job_url: Option<String>,
    pub salary_range: Option<String>,
    pub status: Option<String>,
    pub applied_date: Option<String>,
    pub deadline: Option<String>,
    pub notes: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct InterviewItem {
    pub id: String,
    pub application_id: String,
    pub company_name: Option<String>,
    pub role: Option<String>,
    pub round_name: String,
    pub interview_date: Option<String>,
    pub interviewer_info: Option<String>,
    pub questions_asked: Option<String>,
    pub notes: Option<String>,
    pub result: String, // 'pending', 'passed', 'failed'
    pub created_at: String,
}

#[derive(Debug, Clone, Deserialize)]
pub struct CreateInterviewInput {
    pub application_id: String,
    pub round_name: String,
    pub interview_date: Option<String>,
    pub interviewer_info: Option<String>,
    pub questions_asked: Option<String>,
    pub notes: Option<String>,
    pub result: Option<String>,
}

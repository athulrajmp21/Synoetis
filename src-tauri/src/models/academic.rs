use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SemesterItem {
    pub id: String,
    pub number: i32,
    pub name: String,
    pub status: String,
    pub target_gpa: Option<f64>,
    pub actual_gpa: Option<f64>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CourseItem {
    pub id: String,
    pub semester_id: String,
    pub code: String,
    pub title: String,
    pub credits: i32,
    pub instructor: Option<String>,
    pub target_grade: Option<String>,
    pub final_grade: Option<String>,
    pub status: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AssessmentItem {
    pub id: String,
    pub course_id: String,
    pub course_title: String,
    pub title: String,
    pub assessment_type: String,
    pub due_date: Option<String>,
    pub status: String,
    pub weightage: Option<f64>,
}

#[derive(Debug, Deserialize)]
pub struct CreateCourseInput {
    pub semester_id: String,
    pub code: String,
    pub title: String,
    pub credits: i32,
    pub instructor: Option<String>,
    pub target_grade: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct CreateAssessmentInput {
    pub course_id: String,
    pub title: String,
    pub assessment_type: String,
    pub due_date: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ClassScheduleItem {
    pub id: String,
    pub course_id: String,
    pub course_code: String,
    pub course_title: String,
    pub day_of_week: i64,
    pub start_time: String,
    pub end_time: String,
    pub room: Option<String>,
    pub building: Option<String>,
    pub class_type: String,
}

#[derive(Debug, Clone, Deserialize)]
pub struct CreateClassScheduleInput {
    pub course_id: String,
    pub day_of_week: i64,
    pub start_time: String,
    pub end_time: String,
    pub room: Option<String>,
    pub building: Option<String>,
    pub class_type: Option<String>,
}

#[derive(Debug, Clone, Deserialize)]
pub struct SimulatedCourseGrade {
    pub course_id: String,
    pub credits: f64,
    pub simulated_grade: String,
}

#[derive(Debug, Clone, Deserialize)]
pub struct GpaSimulationInput {
    pub current_completed_credits: f64,
    pub current_cumulative_gpa: f64,
    pub simulated_courses: Vec<SimulatedCourseGrade>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GpaSimulationResult {
    pub semester_credits: f64,
    pub semester_gpa: f64,
    pub cumulative_credits: f64,
    pub projected_cumulative_gpa: f64,
    pub gpa_change: f64,
}

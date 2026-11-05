pub const INITIAL_SCHEMA: &str = r#"
-- Life OS Schema - Migration 001

-- 1. App Settings (Key-Value Store)
CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 2. Semesters (Academic OS)
CREATE TABLE IF NOT EXISTS semesters (
    id TEXT PRIMARY KEY,
    number INTEGER NOT NULL UNIQUE,
    name TEXT NOT NULL,
    start_date TEXT,
    end_date TEXT,
    target_gpa REAL,
    actual_gpa REAL,
    status TEXT NOT NULL DEFAULT 'upcoming', -- 'completed', 'active', 'upcoming'
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 3. Courses
CREATE TABLE IF NOT EXISTS courses (
    id TEXT PRIMARY KEY,
    semester_id TEXT NOT NULL,
    code TEXT NOT NULL,
    title TEXT NOT NULL,
    credits INTEGER NOT NULL DEFAULT 3,
    instructor TEXT,
    syllabus_url TEXT,
    target_grade TEXT,
    final_grade TEXT,
    status TEXT NOT NULL DEFAULT 'enrolled', -- 'enrolled', 'completed', 'dropped'
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (semester_id) REFERENCES semesters(id) ON DELETE CASCADE
);

-- 4. Course Assessments (Exams, Assignments, Labs, Quizzes)
CREATE TABLE IF NOT EXISTS assessments (
    id TEXT PRIMARY KEY,
    course_id TEXT NOT NULL,
    title TEXT NOT NULL,
    assessment_type TEXT NOT NULL, -- 'assignment', 'midterm', 'final', 'quiz', 'lab'
    due_date TEXT,
    weightage REAL,
    max_marks REAL,
    obtained_marks REAL,
    status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'submitted', 'graded'
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
);

-- 5. Goals
CREATE TABLE IF NOT EXISTS goals (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL DEFAULT 'career', -- 'academic', 'career', 'technical', 'personal'
    timeframe TEXT NOT NULL DEFAULT 'short_term', -- 'short_term', 'long_term'
    target_date TEXT,
    progress REAL NOT NULL DEFAULT 0.0,
    status TEXT NOT NULL DEFAULT 'in_progress', -- 'in_progress', 'completed', 'archived'
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 6. Projects
CREATE TABLE IF NOT EXISTS projects (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    tech_stack TEXT, -- JSON array of strings or comma-separated
    repo_url TEXT,
    live_url TEXT,
    status TEXT NOT NULL DEFAULT 'active', -- 'planning', 'active', 'paused', 'completed'
    priority TEXT NOT NULL DEFAULT 'medium', -- 'low', 'medium', 'high', 'urgent'
    start_date TEXT,
    end_date TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 7. Milestones
CREATE TABLE IF NOT EXISTS milestones (
    id TEXT PRIMARY KEY,
    goal_id TEXT,
    project_id TEXT,
    title TEXT NOT NULL,
    due_date TEXT,
    is_completed INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (goal_id) REFERENCES goals(id) ON DELETE CASCADE,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

-- 8. Tasks
CREATE TABLE IF NOT EXISTS tasks (
    id TEXT PRIMARY KEY,
    project_id TEXT,
    goal_id TEXT,
    course_id TEXT,
    title TEXT NOT NULL,
    description TEXT,
    priority TEXT NOT NULL DEFAULT 'medium', -- 'low', 'medium', 'high', 'urgent'
    status TEXT NOT NULL DEFAULT 'todo', -- 'todo', 'in_progress', 'done', 'canceled'
    due_date TEXT,
    category TEXT NOT NULL DEFAULT 'general',
    is_recurring INTEGER NOT NULL DEFAULT 0,
    recurrence_rule TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL,
    FOREIGN KEY (goal_id) REFERENCES goals(id) ON DELETE SET NULL,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE SET NULL
);

-- 9. DSA Topics
CREATE TABLE IF NOT EXISTS dsa_topics (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    sort_order INTEGER NOT NULL DEFAULT 0
);

-- 10. DSA Problems
CREATE TABLE IF NOT EXISTS dsa_problems (
    id TEXT PRIMARY KEY,
    topic_id TEXT NOT NULL,
    title TEXT NOT NULL,
    difficulty TEXT NOT NULL, -- 'Easy', 'Medium', 'Hard'
    platform TEXT NOT NULL DEFAULT 'LeetCode', -- 'LeetCode', 'Codeforces', 'GFG', 'HackerRank'
    url TEXT,
    independent_solve INTEGER NOT NULL DEFAULT 0,
    confidence_score INTEGER NOT NULL DEFAULT 1, -- 1 to 5
    revision_due TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (topic_id) REFERENCES dsa_topics(id) ON DELETE CASCADE
);

-- 11. DSA Attempts
CREATE TABLE IF NOT EXISTS dsa_attempts (
    id TEXT PRIMARY KEY,
    problem_id TEXT NOT NULL,
    timestamp TEXT NOT NULL DEFAULT (datetime('now')),
    success INTEGER NOT NULL DEFAULT 1,
    time_spent_minutes INTEGER NOT NULL DEFAULT 0,
    approach_notes TEXT,
    code_snippet TEXT,
    FOREIGN KEY (problem_id) REFERENCES dsa_problems(id) ON DELETE CASCADE
);

-- 12. Notes (Knowledge Hub)
CREATE TABLE IF NOT EXISTS notes (
    id TEXT PRIMARY KEY,
    course_id TEXT,
    project_id TEXT,
    title TEXT NOT NULL,
    content_markdown TEXT NOT NULL DEFAULT '',
    is_pinned INTEGER NOT NULL DEFAULT 0,
    is_archived INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE SET NULL,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL
);

-- 13. Tags
CREATE TABLE IF NOT EXISTS tags (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    color TEXT NOT NULL DEFAULT '#6366f1'
);

-- 14. Note Tags (Many-to-Many)
CREATE TABLE IF NOT EXISTS note_tags (
    note_id TEXT NOT NULL,
    tag_id TEXT NOT NULL,
    PRIMARY KEY (note_id, tag_id),
    FOREIGN KEY (note_id) REFERENCES notes(id) ON DELETE CASCADE,
    FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
);

-- 15. Habits
CREATE TABLE IF NOT EXISTS habits (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'productivity', -- 'productivity', 'health', 'learning', 'coding'
    frequency TEXT NOT NULL DEFAULT 'daily', -- 'daily', 'weekdays', 'weekly'
    target_per_day INTEGER NOT NULL DEFAULT 1,
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 16. Habit Logs
CREATE TABLE IF NOT EXISTS habit_logs (
    id TEXT PRIMARY KEY,
    habit_id TEXT NOT NULL,
    date TEXT NOT NULL, -- YYYY-MM-DD
    count INTEGER NOT NULL DEFAULT 1,
    completed INTEGER NOT NULL DEFAULT 1,
    notes TEXT,
    FOREIGN KEY (habit_id) REFERENCES habits(id) ON DELETE CASCADE,
    UNIQUE(habit_id, date)
);

-- 17. Companies (Career OS)
CREATE TABLE IF NOT EXISTS companies (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    website TEXT,
    tier TEXT DEFAULT 'Tier 1',
    notes TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 18. Applications (Career OS)
CREATE TABLE IF NOT EXISTS applications (
    id TEXT PRIMARY KEY,
    company_id TEXT NOT NULL,
    role TEXT NOT NULL,
    job_url TEXT,
    salary_range TEXT,
    status TEXT NOT NULL DEFAULT 'drafted', -- 'drafted', 'applied', 'oa_round', 'interview', 'offer', 'rejected'
    applied_date TEXT,
    deadline TEXT,
    notes TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
);

-- 19. Resources (Books, Docs, Courses, Tutorials)
CREATE TABLE IF NOT EXISTS resources (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    resource_type TEXT NOT NULL, -- 'book', 'documentation', 'course', 'tutorial', 'article', 'video'
    url TEXT,
    author TEXT,
    learning_status TEXT NOT NULL DEFAULT 'to_read', -- 'to_read', 'in_progress', 'completed'
    rating INTEGER DEFAULT 0,
    notes TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 20. Study Sessions (Analytics)
CREATE TABLE IF NOT EXISTS study_sessions (
    id TEXT PRIMARY KEY,
    course_id TEXT,
    dsa_topic_id TEXT,
    duration_minutes INTEGER NOT NULL,
    start_time TEXT NOT NULL,
    end_time TEXT NOT NULL,
    summary TEXT,
    focus_rating INTEGER DEFAULT 4, -- 1 to 5
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE SET NULL,
    FOREIGN KEY (dsa_topic_id) REFERENCES dsa_topics(id) ON DELETE SET NULL
);

-- Performance & Relational Indices
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_courses_semester ON courses(semester_id);
CREATE INDEX IF NOT EXISTS idx_dsa_problems_topic ON dsa_problems(topic_id);
CREATE INDEX IF NOT EXISTS idx_dsa_attempts_problem ON dsa_attempts(problem_id);
CREATE INDEX IF NOT EXISTS idx_notes_course ON notes(course_id);
CREATE INDEX IF NOT EXISTS idx_notes_project ON notes(project_id);
CREATE INDEX IF NOT EXISTS idx_habit_logs_date ON habit_logs(date);
CREATE INDEX IF NOT EXISTS idx_applications_company ON applications(company_id);
"#;

pub const DEFAULT_SETTINGS: &[(&str, &str)] = &[
    ("theme", "system"),
    ("sidebar_collapsed", "false"),
    ("user_name", "Developer"),
    ("accent_color", "indigo"),
    ("dsa_daily_target", "3"),
    ("weekly_study_goal_hours", "25"),
    ("current_semester_number", "4"),
];

pub const INITIAL_DSA_TOPICS: &[(&str, &str, &str, &str, i32)] = &[
    ("topic-arrays", "Arrays & Hashing", "arrays-hashing", "Core array manipulations, frequency counting, and two pointers", 1),
    ("topic-two-pointers", "Two Pointers", "two-pointers", "Sorted arrays, two-sum variations, and subarray boundaries", 2),
    ("topic-sliding-window", "Sliding Window", "sliding-window", "Subarray size constraints, dynamic window expansion/shrinkage", 3),
    ("topic-stack", "Stack", "stack", "Monotonic stack, parenthesis validation, expressions", 4),
    ("topic-binary-search", "Binary Search", "binary-search", "Search in sorted arrays, search space reduction, predicates", 5),
    ("topic-linked-list", "Linked List", "linked-list", "Pointer manipulation, reversal, slow & fast pointer techniques", 6),
    ("topic-trees", "Trees", "trees", "Binary trees, BST properties, DFS/BFS traversals, lowest common ancestor", 7),
    ("topic-graphs", "Graphs", "graphs", "BFS, DFS, Dijkstra, topological sort, union-find algorithms", 8),
    ("topic-dp", "Dynamic Programming", "dynamic-programming", "1D/2D memoization, tabulation, knapsack patterns, state machines", 9),
    ("topic-backtracking", "Backtracking", "backtracking", "Subsets, permutations, N-Queens, pruning strategies", 10),
    ("topic-heaps", "Heaps & Priority Queues", "heaps", "Kth largest elements, median finder, interval scheduling", 11),
    ("topic-bit-manipulation", "Bit Manipulation", "bit-manipulation", "Bitmasks, XOR tricks, single number problems", 12),
];

pub const INITIAL_SEMESTERS: &[(i32, &str, &str)] = &[
    (1, "Semester 1 (Fall)", "completed"),
    (2, "Semester 2 (Spring)", "completed"),
    (3, "Semester 3 (Fall)", "completed"),
    (4, "Semester 4 (Spring)", "active"),
    (5, "Semester 5 (Fall)", "upcoming"),
    (6, "Semester 6 (Spring)", "upcoming"),
    (7, "Semester 7 (Fall)", "upcoming"),
    (8, "Semester 8 (Spring)", "upcoming"),
];

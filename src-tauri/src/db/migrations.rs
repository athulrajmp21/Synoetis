use rusqlite::{params, Connection, Transaction};
use crate::error::AppResult;
use crate::db::schema::{INITIAL_SCHEMA, DEFAULT_SETTINGS, INITIAL_DSA_TOPICS, INITIAL_SEMESTERS};

pub fn run_migrations(conn: &mut Connection) -> AppResult<()> {
    // 1. Create migrations tracking table
    conn.execute(
        "CREATE TABLE IF NOT EXISTS _schema_migrations (
            version INTEGER PRIMARY KEY,
            name TEXT NOT NULL,
            applied_at TEXT NOT NULL DEFAULT (datetime('now'))
        )",
        [],
    )?;

    // 2. Query applied migrations in an isolated block so stmt is dropped
    let applied_versions: Vec<i32> = {
        let mut stmt = conn.prepare("SELECT version FROM _schema_migrations ORDER BY version ASC")?;
        let rows = stmt
            .query_map([], |row| row.get(0))?
            .filter_map(|r| r.ok())
            .collect();
        rows
    };

    // Migration 1: Initial schema and seed data
    if !applied_versions.contains(&1) {
        let tx = conn.transaction()?;
        apply_migration_001(&tx)?;
        tx.commit()?;
    }

    // Migration 2: Interviews table for Career OS
    if !applied_versions.contains(&2) {
        let tx = conn.transaction()?;
        apply_migration_002(&tx)?;
        tx.commit()?;
    }

    // Migration 3: Snippets Vault for Developer CLI Cheat Sheets & Code Templates
    if !applied_versions.contains(&3) {
        let tx = conn.transaction()?;
        apply_migration_003(&tx)?;
        tx.commit()?;
    }

    // Migration 4: Spaced Repetition (SRS) Engine & Academic Class Timetable
    if !applied_versions.contains(&4) {
        let tx = conn.transaction()?;
        apply_migration_004(&tx)?;
        tx.commit()?;
    }

    Ok(())
}

fn apply_migration_001(tx: &Transaction) -> AppResult<()> {
    // Execute DDL
    tx.execute_batch(INITIAL_SCHEMA)?;

    // Seed default settings
    for (key, val) in DEFAULT_SETTINGS {
        tx.execute(
            "INSERT OR IGNORE INTO settings (key, value) VALUES (?1, ?2)",
            params![key, val],
        )?;
    }

    // Seed DSA topics
    for (id, name, slug, desc, order) in INITIAL_DSA_TOPICS {
        tx.execute(
            "INSERT OR IGNORE INTO dsa_topics (id, name, slug, description, sort_order) VALUES (?1, ?2, ?3, ?4, ?5)",
            params![id, name, slug, desc, order],
        )?;
    }

    // Seed 8-Semester roadmap
    for (num, name, status) in INITIAL_SEMESTERS {
        let sem_id = format!("sem-{}", num);
        tx.execute(
            "INSERT OR IGNORE INTO semesters (id, number, name, status) VALUES (?1, ?2, ?3, ?4)",
            params![sem_id, num, name, status],
        )?;
    }

    // Record migration 1
    tx.execute(
        "INSERT INTO _schema_migrations (version, name) VALUES (1, '001_initial_schema')",
        [],
    )?;

    Ok(())
}

fn apply_migration_002(tx: &Transaction) -> AppResult<()> {
    tx.execute_batch(
        "CREATE TABLE IF NOT EXISTS interviews (
            id TEXT PRIMARY KEY,
            application_id TEXT NOT NULL,
            round_name TEXT NOT NULL,
            interview_date TEXT,
            interviewer_info TEXT,
            questions_asked TEXT,
            notes TEXT,
            result TEXT NOT NULL DEFAULT 'pending',
            created_at TEXT NOT NULL DEFAULT (datetime('now')),
            FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE CASCADE
        );
        CREATE INDEX IF NOT EXISTS idx_interviews_app ON interviews(application_id);",
    )?;

    tx.execute(
        "INSERT INTO _schema_migrations (version, name) VALUES (2, '002_career_interviews')",
        [],
    )?;

    Ok(())
}

fn apply_migration_003(tx: &Transaction) -> AppResult<()> {
    tx.execute_batch(
        "CREATE TABLE IF NOT EXISTS snippets (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            description TEXT,
            code TEXT NOT NULL,
            language TEXT NOT NULL DEFAULT 'bash',
            category TEXT NOT NULL DEFAULT 'general',
            tags TEXT,
            is_favorite INTEGER NOT NULL DEFAULT 0,
            usage_count INTEGER NOT NULL DEFAULT 0,
            created_at TEXT NOT NULL DEFAULT (datetime('now')),
            updated_at TEXT NOT NULL DEFAULT (datetime('now'))
        );
        CREATE INDEX IF NOT EXISTS idx_snippets_category ON snippets(category);
        CREATE INDEX IF NOT EXISTS idx_snippets_favorite ON snippets(is_favorite);",
    )?;

    // Seed curated developer cheat sheets
    let starter_snippets = [
        (
            "snip-git-1",
            "Undo last commit (keep changes staged)",
            "Rewinds HEAD by one commit while keeping all changes staged in your index.",
            "git reset --soft HEAD~1",
            "bash",
            "git",
            "git, undo, commit, workflow",
            1,
        ),
        (
            "snip-git-2",
            "Discard all local unstaged modifications",
            "Resets all tracked files back to clean HEAD state, discarding unstaged edits.",
            "git restore .",
            "bash",
            "git",
            "git, discard, clean, restore",
            0,
        ),
        (
            "snip-git-3",
            "Pretty Git graph log tree",
            "Visualizes branch topology, merge commits, commit hashes, and relative author dates.",
            "git log --graph --oneline --decorate --all",
            "bash",
            "git",
            "git, log, graph, history",
            1,
        ),
        (
            "snip-git-4",
            "Stash unstaged changes with descriptive message",
            "Shelves unstaged modifications safely without disrupting staged index files.",
            "git stash push -m \"WIP: experimental feature\"",
            "bash",
            "git",
            "git, stash, wip, save",
            0,
        ),
        (
            "snip-docker-1",
            "Purge unused Docker data (containers, images, volumes)",
            "Frees up disk space by removing stopped containers, unused networks, and dangling images.",
            "docker system prune -a --volumes -f",
            "bash",
            "docker",
            "docker, clean, disk, prune, cache",
            1,
        ),
        (
            "snip-docker-2",
            "Follow container logs with live tail",
            "Streams real-time container standard output and error starting from the last 100 lines.",
            "docker logs -f --tail 100 <container_id>",
            "bash",
            "docker",
            "docker, logs, debug, stream",
            0,
        ),
        (
            "snip-docker-3",
            "Open interactive shell inside running container",
            "Attaches a pseudo-TTY shell inside a running container for inspection and diagnostics.",
            "docker exec -it <container_id> /bin/sh",
            "bash",
            "docker",
            "docker, shell, exec, debug",
            0,
        ),
        (
            "snip-linux-1",
            "Kill process holding a specific TCP port",
            "Finds and forcefully terminates the process bound to a specific port (e.g. 3000, 8080).",
            "lsof -ti:8080 | xargs kill -9",
            "bash",
            "linux",
            "linux, port, kill, network, lsof",
            1,
        ),
        (
            "snip-linux-2",
            "Find files modified in the last 24 hours",
            "Recursively scans directory for any files that have been modified within the last day.",
            "find . -type f -mtime -1",
            "bash",
            "linux",
            "linux, find, search, filesystem",
            0,
        ),
        (
            "snip-linux-3",
            "Recursive text search excluding binary files",
            "Fast grep searching for a pattern with line numbers and directory recursion.",
            "grep -rnI \"SEARCH_TERM\" .",
            "bash",
            "linux",
            "linux, grep, search, text",
            0,
        ),
        (
            "snip-sql-1",
            "Atomic SQLite VACUUM snapshot backup",
            "Creates a live, zero-downtime, fully defragmented SQLite database file without locking reads.",
            "VACUUM INTO '/path/to/backup_snapshot.db';",
            "sql",
            "sql",
            "sql, sqlite, backup, vacuum, snapshot",
            1,
        ),
        (
            "snip-sql-2",
            "Running cumulative total with Window Function",
            "Computes running balance or cumulative sum ordered across continuous timestamps.",
            "SELECT id, created_at, amount, SUM(amount) OVER (ORDER BY created_at ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS running_total FROM transactions;",
            "sql",
            "sql",
            "sql, window-function, sum, analytics",
            0,
        ),
        (
            "snip-rust-1",
            "Fast compiler check without bytecode generation",
            "Runs full type-checking and borrow checker diagnostics across all targets at maximum speed.",
            "cargo check --all-targets --all-features",
            "bash",
            "rust",
            "rust, cargo, check, fast, dev",
            1,
        ),
        (
            "snip-rust-2",
            "Optimized production release build",
            "Compiles full binary with level 3 optimizations, LTO, and stripped debug symbols.",
            "cargo build --release",
            "bash",
            "rust",
            "rust, cargo, release, optimize",
            0,
        ),
        (
            "snip-react-1",
            "Debounced Value Custom Hook (TypeScript)",
            "Debounces rapid state transitions (e.g. search inputs, autosave) with cleanup.",
            "export function useDebounce<T>(value: T, delayMs: number): T {\n  const [debouncedValue, setDebouncedValue] = React.useState<T>(value);\n  React.useEffect(() => {\n    const handler = setTimeout(() => setDebouncedValue(value), delayMs);\n    return () => clearTimeout(handler);\n  }, [value, delayMs]);\n  return debouncedValue;\n}",
            "typescript",
            "react",
            "react, typescript, hook, debounce, performance",
            1,
        ),
        (
            "snip-regex-1",
            "RFC 5322 Standard Email Regex Pattern",
            "Matches and validates standard user email addresses while rejecting malformed domains.",
            "^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\\.[a-zA-Z0-9-.]+$",
            "regex",
            "regex",
            "regex, email, validation, pattern",
            1,
        ),
        (
            "snip-regex-2",
            "Semantic Versioning (SemVer 2.0) Validator",
            "Matches major.minor.patch versions with optional pre-release and build metadata tags.",
            "^v?(0|[1-9]\\d*)\\.(0|[1-9]\\d*)\\.(0|[1-9]\\d*)(?:-((?:0|[1-9]\\d*|\\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\\.(?:0|[1-9]\\d*|\\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\\+([0-9a-zA-Z-]+(?:\\.[0-9a-zA-Z-]+)*))?$",
            "regex",
            "regex",
            "regex, semver, versioning, release",
            0,
        ),
        (
            "snip-python-1",
            "Instant local HTTP file server",
            "Spins up an immediate local HTTP server on port 8000 serving files from the current folder.",
            "python -m http.server 8000 --bind 127.0.0.1",
            "bash",
            "python",
            "python, http, server, dev, one-liner",
            1,
        ),
    ];

    for (id, title, desc, code, lang, cat, tags, fav) in starter_snippets {
        tx.execute(
            "INSERT OR IGNORE INTO snippets (id, title, description, code, language, category, tags, is_favorite, usage_count, created_at, updated_at)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, 0, datetime('now'), datetime('now'))",
            params![id, title, desc, code, lang, cat, tags, fav],
        )?;
    }

    tx.execute(
        "INSERT INTO _schema_migrations (version, name) VALUES (3, '003_snippets_vault')",
        [],
    )?;

    Ok(())
}

fn apply_migration_004(tx: &Transaction) -> AppResult<()> {
    tx.execute_batch(
        "CREATE TABLE IF NOT EXISTS srs_items (
            id TEXT PRIMARY KEY,
            item_type TEXT NOT NULL,
            item_id TEXT NOT NULL,
            next_review_date TEXT NOT NULL,
            review_stage INTEGER NOT NULL DEFAULT 1,
            ease_factor REAL NOT NULL DEFAULT 2.5,
            review_count INTEGER NOT NULL DEFAULT 0,
            last_reviewed_at TEXT,
            created_at TEXT NOT NULL DEFAULT (datetime('now')),
            updated_at TEXT NOT NULL DEFAULT (datetime('now')),
            UNIQUE(item_type, item_id)
        );
        CREATE INDEX IF NOT EXISTS idx_srs_next_review ON srs_items(next_review_date);
        CREATE INDEX IF NOT EXISTS idx_srs_item ON srs_items(item_type, item_id);

        CREATE TABLE IF NOT EXISTS class_schedule (
            id TEXT PRIMARY KEY,
            course_id TEXT NOT NULL,
            day_of_week INTEGER NOT NULL,
            start_time TEXT NOT NULL,
            end_time TEXT NOT NULL,
            room TEXT,
            building TEXT,
            class_type TEXT NOT NULL DEFAULT 'lecture',
            created_at TEXT NOT NULL DEFAULT (datetime('now')),
            FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
        );
        CREATE INDEX IF NOT EXISTS idx_class_schedule_day ON class_schedule(day_of_week);
        CREATE INDEX IF NOT EXISTS idx_class_schedule_course ON class_schedule(course_id);",
    )?;

    // Seed initial SRS queue items for existing DSA problems if any
    tx.execute(
        "INSERT OR IGNORE INTO srs_items (id, item_type, item_id, next_review_date, review_stage, ease_factor, review_count, created_at, updated_at)
         SELECT 'srs-dsa-' || id, 'dsa', id, date('now'), 1, 2.5, 0, datetime('now'), datetime('now')
         FROM dsa_problems LIMIT 5",
        [],
    )?;

    // Seed initial SRS queue items for existing Notes if any
    tx.execute(
        "INSERT OR IGNORE INTO srs_items (id, item_type, item_id, next_review_date, review_stage, ease_factor, review_count, created_at, updated_at)
         SELECT 'srs-note-' || id, 'note', id, date('now'), 1, 2.5, 0, datetime('now'), datetime('now')
         FROM notes WHERE is_archived = 0 LIMIT 3",
        [],
    )?;

    tx.execute(
        "INSERT INTO _schema_migrations (version, name) VALUES (4, '004_srs_timetable_sync')",
        [],
    )?;

    Ok(())
}

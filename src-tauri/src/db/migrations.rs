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

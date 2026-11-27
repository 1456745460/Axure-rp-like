use chrono::{SecondsFormat, Utc};
use rusqlite::{params, Connection};
use serde::Serialize;
use serde_json::{json, Value};
use std::sync::Mutex;
use tauri::{AppHandle, Manager, State};

pub struct Db(pub Mutex<Connection>);

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ProjectListItem {
    id: String,
    name: String,
    created_at: String,
    updated_at: String,
}

pub fn init_db(app: &AppHandle) -> Result<Connection, Box<dyn std::error::Error>> {
    let dir = app.path().app_data_dir()?;
    std::fs::create_dir_all(&dir)?;
    let conn = Connection::open(dir.join("prototype.db"))?;
    conn.execute(
        "CREATE TABLE IF NOT EXISTS projects (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            data_json TEXT NOT NULL,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        )",
        [],
    )?;
    Ok(conn)
}

fn now_iso() -> String {
    Utc::now().to_rfc3339_opts(SecondsFormat::Millis, true)
}

fn new_id() -> String {
    let millis = Utc::now().timestamp_millis() as u64;
    let mix = millis.wrapping_mul(0x9E37_79B9) ^ (std::process::id() as u64);
    format!("proj_{:x}_{:x}", millis, mix & 0xff_ffff)
}

fn lock(db: &Db) -> Result<std::sync::MutexGuard<'_, Connection>, String> {
    db.0.lock().map_err(|err| err.to_string())
}

fn project_value(
    id: String,
    name: String,
    data_json: String,
    created_at: String,
    updated_at: String,
) -> Result<Value, String> {
    let mut data: Value = serde_json::from_str(&data_json).unwrap_or_else(|_| {
        json!({ "name": name, "tree": [], "pages": [] })
    });
    let obj = data.as_object_mut().ok_or("项目数据损坏")?;
    obj.insert("id".into(), json!(id));
    obj.insert("name".into(), json!(name));
    obj.insert("createdAt".into(), json!(created_at));
    obj.insert("updatedAt".into(), json!(updated_at));
    Ok(data)
}

#[tauri::command]
pub fn list_projects(db: State<Db>) -> Result<Vec<ProjectListItem>, String> {
    let conn = lock(&db)?;
    let mut stmt = conn
        .prepare(
            "SELECT id, name, created_at, updated_at FROM projects ORDER BY updated_at DESC",
        )
        .map_err(|err| err.to_string())?;
    let rows = stmt
        .query_map([], |row| {
            Ok(ProjectListItem {
                id: row.get(0)?,
                name: row.get(1)?,
                created_at: row.get(2)?,
                updated_at: row.get(3)?,
            })
        })
        .map_err(|err| err.to_string())?;
    rows.collect::<Result<Vec<_>, _>>()
        .map_err(|err| err.to_string())
}

#[tauri::command]
pub fn get_project(db: State<Db>, id: String) -> Result<Value, String> {
    let conn = lock(&db)?;
    let mut stmt = conn
        .prepare("SELECT id, name, data_json, created_at, updated_at FROM projects WHERE id = ?1")
        .map_err(|err| err.to_string())?;
    let mut rows = stmt.query(params![id]).map_err(|err| err.to_string())?;
    let row = rows
        .next()
        .map_err(|err| err.to_string())?
        .ok_or_else(|| "项目不存在".to_string())?;
    project_value(
        row.get(0).map_err(|err| err.to_string())?,
        row.get(1).map_err(|err| err.to_string())?,
        row.get(2).map_err(|err| err.to_string())?,
        row.get(3).map_err(|err| err.to_string())?,
        row.get(4).map_err(|err| err.to_string())?,
    )
}

#[tauri::command]
pub fn save_project(db: State<Db>, payload: Value) -> Result<Value, String> {
    let now = now_iso();
    let id = payload
        .get("id")
        .and_then(Value::as_str)
        .filter(|value| !value.is_empty())
        .map(str::to_string)
        .unwrap_or_else(new_id);
    let name = payload
        .get("name")
        .and_then(Value::as_str)
        .filter(|value| !value.is_empty())
        .unwrap_or("未命名项目")
        .to_string();
    let data = json!({
        "name": name,
        "tree": payload.get("tree").cloned().unwrap_or_else(|| json!([])),
        "pages": payload.get("pages").cloned().unwrap_or_else(|| json!([])),
        "currentPageId": payload.get("currentPageId").cloned().unwrap_or(Value::Null)
    });
    let json = serde_json::to_string(&data).map_err(|err| err.to_string())?;

    let conn = lock(&db)?;
    let existing: Option<String> = conn
        .query_row(
            "SELECT created_at FROM projects WHERE id = ?1",
            params![id],
            |row| row.get(0),
        )
        .ok();

    let created_at = if let Some(created_at) = existing {
        conn.execute(
            "UPDATE projects SET name = ?1, data_json = ?2, updated_at = ?3 WHERE id = ?4",
            params![name, json, now, id],
        )
        .map_err(|err| err.to_string())?;
        created_at
    } else {
        conn.execute(
            "INSERT INTO projects (id, name, data_json, created_at, updated_at) VALUES (?1, ?2, ?3, ?4, ?5)",
            params![id, name, json, now, now],
        )
        .map_err(|err| err.to_string())?;
        now.clone()
    };

    project_value(id, name, json, created_at, now)
}

#[tauri::command]
pub fn delete_project(db: State<Db>, id: String) -> Result<bool, String> {
    let conn = lock(&db)?;
    let changed = conn
        .execute("DELETE FROM projects WHERE id = ?1", params![id])
        .map_err(|err| err.to_string())?;
    Ok(changed > 0)
}

#[tauri::command]
pub fn write_exported_html(path: String, contents: String) -> Result<(), String> {
    std::fs::write(path, contents).map_err(|err| err.to_string())
}

use std::sync::mpsc;

#[tauri::command]
async fn export_file(app: tauri::AppHandle, data: String) -> Result<(), String> {
    use tauri_plugin_dialog::DialogExt;
    let (tx, rx) = mpsc::channel();

    app.dialog()
        .file()
        .add_filter("JSON", &["json"])
        .set_file_name("autotracker-backup.json")
        .save_file(move |file_path| {
            if let Some(path) = file_path {
                if let Some(p) = path.as_path() {
                    let _ = std::fs::write(p, &data);
                    let _ = tx.send(Ok::<(), String>(()));
                } else {
                    let _ = tx.send(Err("Invalid path".to_string()));
                }
            } else {
                let _ = tx.send(Ok(()));
            }
        });

    rx.recv().map_err(|e| e.to_string())?
}

#[tauri::command]
async fn import_file(app: tauri::AppHandle) -> Result<Option<String>, String> {
    use tauri_plugin_dialog::DialogExt;
    let (tx, rx) = mpsc::channel();

    app.dialog()
        .file()
        .add_filter("JSON", &["json"])
        .pick_file(move |file_path| {
            if let Some(path) = file_path {
                if let Some(p) = path.as_path() {
                    let data = std::fs::read_to_string(p).ok();
                    let _ = tx.send(data);
                } else {
                    let _ = tx.send(None);
                }
            } else {
                let _ = tx.send(None);
            }
        });

    rx.recv().map_err(|e| e.to_string())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![export_file, import_file])
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

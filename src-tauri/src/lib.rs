use tauri::menu::{MenuBuilder, MenuItemBuilder, SubmenuBuilder};
use tauri::Emitter;

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[tauri::command]
fn read_file_content(path: String) -> Result<String, String> {
    std::fs::read_to_string(&path).map_err(|e| e.to_string())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_process::init())
        .setup(|app| {
            let open_item = MenuItemBuilder::new("Open Project...")
                .id("open_project")
                .accelerator("CmdOrCtrl+O")
                .build(app)?;

            let save_item = MenuItemBuilder::new("Save Project")
                .id("save_project")
                .accelerator("CmdOrCtrl+S")
                .build(app)?;

            let check_update_item = MenuItemBuilder::new("Check for Updates...")
                .id("check_update")
                .build(app)?;

            let file_submenu = SubmenuBuilder::new(app, "File")
                .item(&open_item)
                .item(&save_item)
                .build()?;

            let help_submenu = SubmenuBuilder::new(app, "Help")
                .item(&check_update_item)
                .build()?;

            let menu = MenuBuilder::new(app)
                .item(&file_submenu)
                .item(&help_submenu)
                .build()?;

            app.set_menu(menu)?;

            app.on_menu_event(move |app_handle, event| match event.id.as_ref() {
                "open_project" => {
                    let _ = app_handle.emit("menu-open-project", ());
                }
                "save_project" => {
                    let _ = app_handle.emit("menu-save-project", ());
                }
                "check_update" => {
                    println!("Menu: Check for updates clicked");
                    let _ = app_handle.emit("menu-check-update", ());
                }

                _ => {}
            });

            Ok(())
        })
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![greet, read_file_content])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

import os
import re
import difflib
import subprocess
import platform
from pathlib import Path
from src.file_search_local import find_local_file


def is_docker() -> bool:
    return os.getenv("RUNNING_IN_DOCKER") == "true"


def is_windows() -> bool:
    return platform.system().lower() == "windows"


START_MENU_PATHS = [
    Path(os.environ.get("APPDATA", "")) / r"Microsoft\Windows\Start Menu\Programs",
    Path(os.environ.get("PROGRAMDATA", "")) / r"Microsoft\Windows\Start Menu\Programs",
]


def normalize_text(text: str) -> str:
    text = text.lower()
    text = text.replace("öffne", "oeffne")
    text = text.replace("ö", "oe")
    text = text.replace("ä", "ae")
    text = text.replace("ü", "ue")
    text = text.replace("ß", "ss")
    text = re.sub(r"[^a-z0-9\s\.]", " ", text)
    text = re.sub(r"\s+", " ", text).strip()
    return text


def extract_app_name(user_text: str) -> str | None:
    text = normalize_text(user_text)

    command_words = [
        "oeffne", "open", "starte", "start", "mach", "mache",
        "bitte", "mir", "den", "die", "das", "app", "programm",
        "anwendung", "auf"
    ]

    words = text.split()
    words = [word for word in words if word not in command_words]

    app_name = " ".join(words).strip()
    return app_name if app_name else None


def get_start_menu_apps() -> dict[str, Path]:
    apps = {}

    for start_path in START_MENU_PATHS:
        if not start_path.exists():
            continue

        for shortcut in start_path.rglob("*.lnk"):
            name = normalize_text(shortcut.stem)
            apps[name] = shortcut

    return apps


def find_best_app_match(app_name: str, apps: dict[str, Path]):
    app_name = normalize_text(app_name)

    for name, path in apps.items():
        if app_name == name:
            return name, path

    for name, path in apps.items():
        if app_name in name or name in app_name:
            return name, path

    matches = difflib.get_close_matches(app_name, apps.keys(), n=1, cutoff=0.45)

    if matches:
        matched_name = matches[0]
        return matched_name, apps[matched_name]

    return None


def extract_filename(user_text: str) -> str | None:
    words = user_text.split()

    for word in words:
        cleaned = word.strip(".,;:!?\"'")
        if "." in cleaned:
            return cleaned

    return None


def execute_pc_action(user_text: str):
    if not user_text:
        return None

    text = normalize_text(user_text)
    print("PC CHECK TEXT:", text)

    # Dateisuche
    if "suche datei" in text or "finde datei" in text or "wo ist" in text:
        filename = extract_filename(user_text)

        if not filename:
            return "Bitte nenne mir den Dateinamen, zum Beispiel config.json."

        matches = find_local_file(filename)

        if not matches:
            return f"Ich habe die Datei {filename} nicht gefunden."

        return "Ich habe die Datei gefunden:\n" + "\n".join(matches)

    command_detected = any(
        word in text for word in [
            "oeffne", "open", "starte", "start", "mach", "mache",
            "einstellung", "settings", "chrome", "google", "gugel",
            "store", "rechner", "taschenrechner", "calculator",
            "explorer", "dateien", "ordner", "notepad", "editor"
        ]
    )

    if not command_detected:
        return None

    if is_docker():
        return (
            "Die PC-Integration ist in der Docker-Version eingeschränkt. "
            "Lokale Windows-Programme können nur in der nativen Windows-"
            "Version geöffnet werden."
        )

    if not is_windows():
        return "Die PC-Integration ist nur unter Windows verfügbar."

    if "einstellung" in text or "settings" in text:
        subprocess.Popen("start ms-settings:", shell=True)
        return "Die Windows-Einstellungen wurden geöffnet."

    if (
        "microsoft store" in text
        or "store" in text
        or "app store" in text
        or "apstory" in text
        or "abstory" in text
    ):
        subprocess.Popen("start ms-windows-store:", shell=True)
        return "Der Microsoft Store wurde geöffnet."

    if "chrome" in text or "google" in text or "gugel" in text:
        subprocess.Popen("start chrome", shell=True)
        return "Google Chrome wurde geöffnet."

    if "rechner" in text or "taschenrechner" in text or "calculator" in text:
        subprocess.Popen("calc", shell=True)
        return "Der Rechner wurde geöffnet."

    if "explorer" in text or "dateien" in text or "ordner" in text:
        subprocess.Popen("explorer", shell=True)
        return "Der Datei-Explorer wurde geöffnet."

    if "notepad" in text or "editor" in text:
        subprocess.Popen("notepad", shell=True)
        return "Der Editor wurde geöffnet."

    app_name = extract_app_name(user_text)

    if not app_name:
        return None

    apps = get_start_menu_apps()
    match = find_best_app_match(app_name, apps)

    if not match:
        return f"Ich habe kein Programm mit dem Namen {app_name} gefunden."

    matched_name, shortcut_path = match

    try:
        os.startfile(shortcut_path)
        return f"{matched_name.title()} wurde geöffnet."
    except Exception as e:
        print("Fehler beim Öffnen:", e)
        return f"{matched_name.title()} konnte nicht geöffnet werden."

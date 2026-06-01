import os
import sqlite3
from datetime import datetime
import uuid

DB_PATH = os.getenv("DATABASE_PATH", "data/voicebot.db")

db_dir = os.path.dirname(DB_PATH)
if db_dir:
    os.makedirs(db_dir, exist_ok=True)


def get_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn


def init_db():
    with get_connection() as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS chats (
                id TEXT PRIMARY KEY,
                title TEXT NOT NULL,
                created_at TEXT NOT NULL
            )
        """)
        conn.execute("""
            CREATE TABLE IF NOT EXISTS messages (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                chat_id TEXT NOT NULL,
                role TEXT NOT NULL,
                content TEXT NOT NULL,
                created_at TEXT NOT NULL,
                FOREIGN KEY(chat_id) REFERENCES chats(id) ON DELETE CASCADE
            )
        """)


def create_chat(title="Neuer Chat"):
    chat_id = str(uuid.uuid4())
    created_at = datetime.now().isoformat()

    with get_connection() as conn:
        conn.execute(
            "INSERT INTO chats (id, title, created_at) VALUES (?, ?, ?)",
            (chat_id, title, created_at),
        )
        conn.execute(
            (
                "INSERT INTO messages (chat_id, role, content, created_at) "
                "VALUES (?, ?, ?, ?)"
            ),
            (
                chat_id,
                "bot",
                "Hallo! Halte den Voice-Button gedrückt und sprich.",
                created_at,
            ),
        )

    return chat_id


def get_all_chats():
    with get_connection() as conn:
        chats = conn.execute(
            "SELECT id, title, created_at FROM chats ORDER BY datetime(created_at) DESC"
        ).fetchall()

        result = []
        for chat in chats:
            messages = conn.execute(
                """
                SELECT role, content, created_at
                FROM messages
                WHERE chat_id = ?
                ORDER BY id ASC
                """,
                (chat["id"],),
            ).fetchall()

            result.append({
                "id": chat["id"],
                "title": chat["title"],
                "createdAt": chat["created_at"],
                "messages": [
                    {
                        "role": msg["role"],
                        "content": msg["content"],
                        "createdAt": msg["created_at"],
                    }
                    for msg in messages
                ],
            })

        return result


def delete_chat(chat_id):
    with get_connection() as conn:
        conn.execute("DELETE FROM chats WHERE id = ?", (chat_id,))


def clear_chat(chat_id):
    now = datetime.now().isoformat()
    with get_connection() as conn:
        conn.execute("DELETE FROM messages WHERE chat_id = ?", (chat_id,))
        conn.execute("UPDATE chats SET title = ? WHERE id = ?", ("Neuer Chat", chat_id))
        conn.execute(
            (
                "INSERT INTO messages (chat_id, role, content, created_at) "
                "VALUES (?, ?, ?, ?)"
            ),
            (
                chat_id,
                "bot",
                "Hallo! Halte den Voice-Button gedrückt und sprich.",
                now,
            ),
        )


def add_message(chat_id, role, content):
    now = datetime.now().isoformat()
    with get_connection() as conn:
        conn.execute(
            (
                "INSERT INTO messages (chat_id, role, content, created_at) "
                "VALUES (?, ?, ?, ?)"
            ),
            (
                chat_id,
                role,
                content,
                now,
            ),
        )


def update_chat_title(chat_id, title):
    with get_connection() as conn:
        conn.execute(
            "UPDATE chats SET title = ? WHERE id = ?",
            (title, chat_id),
        )


def get_chat(chat_id):
    chats = get_all_chats()
    for chat in chats:
        if chat["id"] == chat_id:
            return chat
    return None

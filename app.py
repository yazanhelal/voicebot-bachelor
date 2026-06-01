from flask import Flask, jsonify, request
from flask_cors import CORS
import os
import uuid
import subprocess
import time

from src.transcriber import transcribe_audio
from src.logic_gemini import generate_gemini_response, generate_gemini_title
from src.logic_local_llm import generate_local_llm_response
from src.speaker import speak_text
from src.pc_actions import execute_pc_action, normalize_text

from database import (
    init_db,
    create_chat,
    get_all_chats,
    delete_chat,
    clear_chat,
    add_message,
    update_chat_title,
    get_chat,
)

app = Flask(__name__)
CORS(app)

UPLOAD_FOLDER = "audio"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

init_db()


@app.route("/")
def home():
    return "Backend läuft!"


@app.route("/chats", methods=["GET"])
def list_chats():
    return jsonify({"success": True, "chats": get_all_chats()})


@app.route("/chats", methods=["POST"])
def new_chat():
    chat_id = create_chat()
    return jsonify({"success": True, "chatId": chat_id, "chats": get_all_chats()})


@app.route("/chats/<chat_id>", methods=["DELETE"])
def remove_chat(chat_id):
    delete_chat(chat_id)
    chats = get_all_chats()

    if not chats:
        create_chat()
        chats = get_all_chats()

    return jsonify({"success": True, "chats": chats})


@app.route("/chats/<chat_id>/title", methods=["PATCH"])
def rename_chat(chat_id):
    try:
        data = request.get_json()
        new_title = data.get("title", "").strip()

        if not new_title:
            return jsonify({
                "success": False,
                "error": "Titel darf nicht leer sein"
            }), 400

        if len(new_title) > 40:
            new_title = new_title[:40] + "..."

        update_chat_title(chat_id, new_title)

        return jsonify({
            "success": True,
            "chat": get_chat(chat_id),
            "chats": get_all_chats()
        })

    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


@app.route("/chats/<chat_id>/clear", methods=["POST"])
def reset_chat(chat_id):
    clear_chat(chat_id)
    return jsonify({
        "success": True,
        "chat": get_chat(chat_id),
        "chats": get_all_chats()
    })


@app.route("/voicebot/upload/<chat_id>", methods=["POST"])
def upload_voice(chat_id):
    try:
        if "audio" not in request.files:
            return jsonify({
                "success": False,
                "error": "Keine Audiodatei empfangen"
            }), 400

        audio_file = request.files["audio"]

        if audio_file.filename == "":
            return jsonify({
                "success": False,
                "error": "Leere Datei"
            }), 400

        filename = os.path.join(UPLOAD_FOLDER, f"{uuid.uuid4()}.webm")
        audio_file.save(filename)

        start = time.time()
        user_text = transcribe_audio(filename)
        whisper_time = time.time() - start
        print(f"WHISPER ZEIT: {whisper_time:.2f} Sekunden", flush=True)
        print("ERKANNTER TEXT:", user_text)

        voice_mode = request.form.get("mode", "gemini")
        voice_enabled = request.form.get("voiceEnabled", "true") == "true"
        save_chat = request.form.get("saveChat", "true") == "true"
        language = request.form.get("language", "de")

        print("SPRACHE VOM FRONTEND:", language)
        print("MODUS VOM FRONTEND:", voice_mode)

        start = time.time()
        pc_response = execute_pc_action(user_text)
        pc_time = time.time() - start
        print(f"PC-AKTION ZEIT: {pc_time:.2f} Sekunden", flush=True)

        text = normalize_text(user_text)

        if "einstellung" in text or "settings" in text:
            subprocess.Popen(["start", "ms-settings:"], shell=True)
            return "Die Windows-Einstellungen wurden geöffnet."

        if pc_response:
            response = pc_response
        else:
            if voice_mode == "local":
                start = time.time()
                response = generate_local_llm_response(user_text, language)
                local_time = time.time() - start
                print(f"LOKALES MODELL ZEIT: {local_time:.2f} Sekunden", flush=True)
            else:
                start = time.time()
                response = generate_gemini_response(user_text, language)
                gemini_time = time.time() - start
                print(f"GEMINI ZEIT: {gemini_time:.2f} Sekunden", flush=True)

        if save_chat:
            if user_text.strip():
                add_message(chat_id, "user", user_text)

                current_chat = get_chat(chat_id)
                if (current_chat and current_chat["title"] == "Neuer Chat"
                        and user_text.strip()):
                    title = generate_gemini_title(user_text)
                    update_chat_title(chat_id, title)

            add_message(chat_id, "bot", response)

        if voice_enabled:
            speak_text(response)

        return jsonify({
            "success": True,
            "text": user_text,
            "response": response,
            "mode": voice_mode,
            "language": language,
            "voiceEnabled": voice_enabled,
            "saveChat": save_chat,
            "chats": get_all_chats()
        })

    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


@app.route("/chat/text/<chat_id>", methods=["POST"])
def chat_text(chat_id):
    try:
        data = request.get_json()

        user_text = data.get("message", "").strip()
        chat_mode = data.get("mode", "gemini")
        language = data.get("language", "de")
        voice_enabled = data.get("voiceEnabled", True)
        save_chat = data.get("saveChat", True)

        if not user_text:
            return jsonify({
                "success": False,
                "error": "Keine Nachricht eingegeben"
            }), 400

        pc_response = execute_pc_action(user_text)

        if pc_response:
            response = pc_response
        else:
            if chat_mode == "local":
                response = generate_local_llm_response(user_text, language)
            else:
                response = generate_gemini_response(user_text, language)

        if save_chat:
            add_message(chat_id, "user", user_text)

            current_chat = get_chat(chat_id)
            if current_chat and current_chat["title"] == "Neuer Chat":
                title = generate_gemini_title(user_text)
                update_chat_title(chat_id, title)

            add_message(chat_id, "bot", response)

        if voice_enabled:
            speak_text(response)

        return jsonify({
            "success": True,
            "text": user_text,
            "response": response,
            "mode": chat_mode,
            "language": language,
            "voiceEnabled": voice_enabled,
            "saveChat": save_chat,
            "chats": get_all_chats()
        })

    except Exception as e:
        print("Text-Chat Fehler:", e)
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=False)

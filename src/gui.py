import tkinter as tk
from tkinter import scrolledtext
from threading import Thread

from src.recorder import record_audio
from src.transcriber import transcribe_audio
from src.logic_old import generate_response
from src.speaker import speak_text


def run_voicebot():
    try:
        status_label.config(text="Status: Aufnahme läuft...")
        start_button.config(state="disabled")

        record_audio()

        status_label.config(text="Status: Sprache wird erkannt...")
        user_text = str(transcribe_audio("audio/test.wav"))

        recognized_text.delete("1.0", tk.END)
        recognized_text.insert(tk.END, user_text)

        status_label.config(text="Status: Antwort wird erzeugt...")
        response = str(generate_response(user_text))

        response_text.delete("1.0", tk.END)
        response_text.insert(tk.END, response)

        status_label.config(text="Status: Antwort wird gesprochen...")
        speak_text(response)

        status_label.config(text="Status: Fertig")
    except Exception as e:
        status_label.config(text=f"Fehler: {e}")
    finally:
        start_button.config(state="normal")


def start_voicebot():
    thread = Thread(target=run_voicebot)
    thread.start()


root = tk.Tk()
root.title("Voicebot mit Whisper")
root.geometry("700x500")
root.resizable(False, False)

title_label = tk.Label(root, text="Voicebot Bachelorarbeit", font=("Arial", 18, "bold"))
title_label.pack(pady=10)

status_label = tk.Label(root, text="Status: Bereit", font=("Arial", 12))
status_label.pack(pady=5)

start_button = tk.Button(
    root,
    text="Aufnahme starten",
    font=("Arial", 14),
    width=20,
    height=2,
    command=start_voicebot
)
start_button.pack(pady=15)

recognized_label = tk.Label(root, text="Erkannter Text:", font=("Arial", 12, "bold"))
recognized_label.pack(anchor="w", padx=20)

recognized_text = scrolledtext.ScrolledText(
    root, height=6, width=75, font=("Arial", 11)
)
recognized_text.pack(padx=20, pady=5)

response_label = tk.Label(root, text="Bot-Antwort:", font=("Arial", 12, "bold"))
response_label.pack(anchor="w", padx=20)

response_text = scrolledtext.ScrolledText(root, height=6, width=75, font=("Arial", 11))
response_text.pack(padx=20, pady=5)

root.mainloop()

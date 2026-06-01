import os
import requests

LLAMA_SERVER_URL = os.getenv(
    "LLAMA_SERVER_URL",
    "http://127.0.0.1:8080/completion"
)


def generate_local_llm_response(user_text: str, language: str = "de") -> str:
    if not user_text or not user_text.strip():
        return "Ich konnte leider nichts verstehen."

    if language == "en":
        prompt = (
            "You are a helpful voice assistant. "
            "Answer in English, short and simple.\n\n"
            f"User: {user_text}\n"
            "Assistant:"
        )
    else:
        prompt = (
            "Du bist ein hilfreicher Voicebot. "
            "Antworte auf Deutsch, kurz und einfach.\n\n"
            f"Benutzer: {user_text}\n"
            "Assistent:"
        )

    try:
        response = requests.post(
            LLAMA_SERVER_URL,
            json={
                "prompt": prompt,
                "n_predict": 80,
                "temperature": 0.4,
                "top_p": 0.9,
                "stop": [
                    "Benutzer:",
                    "User:",
                    "<|eot_id|>",
                    "<|end_of_text|>"
                ],
            },
            timeout=300,
        )

        print("LLAMA STATUS:", response.status_code, flush=True)
        print("LLAMA RAW:", response.text[:1000], flush=True)

        if response.status_code != 200:
            return "Der lokale LLM-Server hat einen Fehler zurückgegeben."

        data = response.json()

        answer = (
            data.get("content")
            or data.get("response")
            or data.get("text")
            or ""
        )

        answer = answer.strip()

        if not answer:
            return "Das lokale Sprachmodell hat keine Antwort erzeugt."

        return answer

    except Exception as e:
        print("Lokaler LLM Fehler:", e, flush=True)
        return (
            "Der lokale LLM-Server ist nicht erreichbar oder konnte "
            "keine Antwort erzeugen."
        )

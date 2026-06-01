import os
from dotenv import load_dotenv
from google import genai

load_dotenv()

api_key = os.getenv("GEMINI_API_KEY")
client = genai.Client(api_key=api_key) if api_key else None


def generate_gemini_response(user_text: str, language: str = "de") -> str:
    print("Gemini bekommt:", user_text)
    print("Antwortsprache:", language)

    if not user_text or not user_text.strip():
        if language == "en":
            return "I could not understand anything."
        return "Ich konnte leider nichts verstehen."

    if client is None:
        if language == "en":
            return "Gemini API key is missing."
        return "Gemini API-Key fehlt."

    if language == "en":
        system_language = "Answer in English. Keep the answer short and simple."
    else:
        system_language = "Antworte auf Deutsch. Halte die Antwort kurz und einfach."

    try:
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=(
                f"{system_language}\n"
                "Du bist ein hilfreicher Voicebot. "
                "Antworte maximal mit zwei Sätzen.\n\n"
                f"Benutzer: {user_text}"
            ),
        )

        print("Gemini Antwort:", response.text)

        if response.text:
            return response.text.strip()

        if language == "en":
            return "Gemini did not return an answer."
        return "Gemini hat keine Antwort zurückgegeben."

    except Exception as e:
        print("Gemini Fehler:", e)

        if language == "en":
            return f"Gemini error: {e}"
        return f"Gemini Fehler: {e}"


def generate_gemini_title(user_text: str) -> str:
    """
    Erstellt automatisch einen kurzen Titel für den Chatverlauf.
    Wird benutzt, wenn ein neuer Chat noch den Titel 'Neuer Chat' hat.
    """

    if not user_text or not user_text.strip():
        return "Neuer Chat"

    fallback_title = user_text.strip()

    if len(fallback_title) > 32:
        fallback_title = fallback_title[:32] + "..."

    if client is None:
        return fallback_title

    try:
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=(
                "Erstelle einen kurzen passenden Chat-Titel auf Deutsch.\n"
                "Regeln:\n"
                "- Maximal 4 Wörter\n"
                "- Keine Anführungszeichen\n"
                "- Keine Erklärung\n"
                "- Nur den Titel ausgeben\n\n"
                f"Benutzereingabe: {user_text}"
            ),
        )

        if response.text:
            title = response.text.strip()

            # Unerwünschte Zeichen entfernen
            title = title.replace('"', "").replace("'", "")
            title = title.replace("\n", " ").strip()

            # Falls Gemini doch zu lang antwortet
            if len(title) > 35:
                title = title[:35] + "..."

            if title:
                return title

        return fallback_title

    except Exception as e:
        print("Gemini Titel Fehler:", e)
        return fallback_title
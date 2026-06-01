import os
from dotenv import load_dotenv
from google import genai

load_dotenv()

api_key = os.getenv("GEMINI_API_KEY")
client = genai.Client(api_key=api_key)


def transcribe_audio_gemini(filename: str) -> str:
    try:
        with open(filename, "rb") as audio_file:
            audio_bytes = audio_file.read()

        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=[
                {
                    "role": "user",
                    "parts": [
                        {
                            "text": (
                                "Transkribiere diese Audiodatei exakt als deutschen "
                                "Text. Gib nur den erkannten Text zurück,"
                                " ohne Erklärung."
                            )
                        },
                        {
                            "inline_data": {
                                "mime_type": "audio/webm",
                                "data": audio_bytes,
                            }
                        },
                    ],
                }
            ],
        )

        if response.text:
            return response.text.strip()
        else:
            return "Keine Antwort erhalten."

    except Exception as e:
        print("Fehler bei Gemini Transkription:", e)
        return ""

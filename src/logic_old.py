import re


def clean_text(text: str) -> str:
    text = text.lower()
    text = re.sub(r"[^\w\säöüß]", "", text)
    text = text.strip()
    return text


def generate_response(user_text: str) -> str:
    user_text = clean_text(user_text)

    if "hallo" in user_text or "hi" in user_text:
        return "Hallo, wie kann ich dir helfen?"

    elif "wie geht" in user_text:
        return "Mir geht es gut, danke der Nachfrage."

    elif "wie heißt" in user_text or "wer bist" in user_text:
        return "Ich bin dein Voicebot."

    elif "kennst du mich" in user_text:
        return "Ja, ich kenne dich. Du bist mein Boss hier."

    elif "was kannst" in user_text:
        return "Ich kann Sprache erkennen und einfache Antworten geben."

    elif "spät" in user_text or "uhrzeit" in user_text or "uhr" in user_text:
        return "Ich kann aktuell noch keine Uhrzeit abrufen."

    elif "wetter" in user_text:
        return "Das Wetter kann ich später über eine API anzeigen."

    elif "python" in user_text:
        return "Python ist eine Programmiersprache."

    elif "danke" in user_text:
        return "Gerne."

    elif "tschüss" in user_text or "auf wiedersehen" in user_text:
        return "Auf Wiedersehen."

    else:
        return "Das habe ich leider nicht verstanden."
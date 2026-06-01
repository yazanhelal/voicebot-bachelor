import os

whisper = None
model = None


def get_model():
    global whisper, model

    if model is not None:
        return model

    if whisper is None:
        try:
            import whisper as _whisper
            whisper = _whisper
        except Exception as exc:
            raise RuntimeError(
                "Whisper konnte nicht importiert werden. "
                "Bitte installiere openai-whisper "
                "und seine Abhängigkeiten."
            ) from exc

    try:
        model = whisper.load_model("tiny")
    except Exception as exc:
        raise RuntimeError(
            "Whisper-Modell konnte nicht geladen werden. Überprüfe die Installation "
            "und verfügbare Ressourcen."
        ) from exc

    return model


def transcribe_audio(filename: str) -> str:
    if not isinstance(filename, str) or not filename:
        raise ValueError("Ungültiger Dateiname für die Transkription.")

    if not os.path.exists(filename):
        raise FileNotFoundError(f"Audio-Datei nicht gefunden: {filename}")

    print("Transkribiere Audio mit Whisper...")

    model = get_model()
    result = model.transcribe(filename, language="de")
    return str(result.get("text", ""))

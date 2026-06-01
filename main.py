from src.recorder import record_audio
from src.transcriber import transcribe_audio
from src.logic_old import generate_response
from src.speaker import speak_text

filename = "audio/test.wav"
record_audio(filename)
text = transcribe_audio(filename)

if not text or not isinstance(text, str):
    text = "Ich konnte nichts verstehen."

print("Erkannter Text:")
print(text)

response = generate_response(text)

print("Bot-Antwort:")
print(response)

speak_text(response)

import sounddevice as sd
from scipy.io.wavfile import write
import numpy as np


def find_input_device(preferred_names=None):
    if preferred_names is None:
        preferred_names = [
            "USB Microphone",
            "Mikrofonarray",
            "Iriun Webcam",
            "Microphone",
            "Mikrofon",
        ]

    devices = sd.query_devices()

    for i, device in enumerate(devices):
        name = str(device["name"])
        max_input_channels = device["max_input_channels"]

        if max_input_channels > 0:
            for preferred in preferred_names:
                if preferred.lower() in name.lower():
                    print(f"Verwende Eingabegerät: {i} - {name}")
                    return i

    raise RuntimeError("Kein passendes Eingabegerät gefunden.")


def record_audio(filename="audio/test.wav", duration=8, fs=16000):
    print("🎤 Aufnahme startet...")

    device = find_input_device()

    recording = sd.rec(
        int(duration * fs),
        samplerate=fs,
        channels=1,
        dtype="int16",
        device=device
    )
    sd.wait()

    recording = recording.astype(np.int32) * 3
    recording = np.clip(recording, -32768, 32767).astype("int16")

    write(filename, fs, recording)
    print(f"✅ Aufnahme gespeichert als: {filename}")

# Voicebot mit Whisper

Bachelorarbeit von Yazan Sy

## Projektbeschreibung

Dieses Projekt ist ein prototypischer Voicebot, der im Rahmen einer Bachelorarbeit entwickelt wurde. Der Voicebot kann Sprache aufnehmen, diese mit Whisper in Text umwandeln, eine Antwort generieren und diese Antwort wieder als Sprache ausgeben.

Das System unterstützt zwei Modi:

* Cloud-Modus mit Gemini API
* Lokaler Modus mit llama.cpp und einem GGUF-Modell

## Technologien

* Python
* Flask
* React
* Whisper
* llama.cpp
* GGUF-Modell
* SQLite
* Docker
* Docker Compose

## Funktionen

* Spracheingabe über Mikrofon
* Speech-to-Text mit Whisper
* Antwortgenerierung über Gemini API oder lokales LLM
* Text-to-Speech Ausgabe
* Chatverlauf
* Speicherung in SQLite
* Frontend mit React
* Backend mit Flask
* Docker-Unterstützung
* Startskript für Windows

## Wichtiger Hinweis zum LLM-Modell

Das lokale LLM-Modell ist nicht im Repository enthalten, da GGUF-Modelle sehr groß sind und nicht sinnvoll auf GitHub hochgeladen werden sollten.

Das Modell muss separat heruntergeladen und lokal im Projektordner abgelegt werden.

Empfohlener Ordner:

```text
models/
```

Beispiel:

```text
models/model.gguf
```

GGUF-Modelle können z. B. auf Hugging Face heruntergeladen werden:

```text
https://huggingface.co/models?library=gguf
```

Wichtig ist, dass das Modell im GGUF-Format vorliegt und mit llama.cpp kompatibel ist.

## Projektstruktur

```text
voicebot-bachelor/
│
├── frontend/              # React Frontend
├── src/                   # Backend/Programmlogik
├── audio/                 # Audio-Dateien
├── data/                  # Datenordner
├── models/                # Hier muss das GGUF-Modell lokal abgelegt werden
│
├── app.py                 # Flask Backend
├── main.py                # Hauptprogramm
├── database.py            # SQLite Datenbank
├── requirements.txt       # Python-Abhängigkeiten
├── docker-compose.yml     # Docker Compose Konfiguration
├── Dockerfile.backend     # Dockerfile für Backend
├── Dockerfile.llama       # Dockerfile für llama.cpp
├── start_voicebot.bat     # Startskript für Windows
└── README.md
```

## Installation ohne Docker

### 1. Repository herunterladen

```bash
git clone https://github.com/yazanhelal/voicebot-bachelor.git
cd voicebot-bachelor
```

### 2. Python-Umgebung erstellen

```bash
python -m venv .venv
```

Windows:

```bash
.venv\Scripts\activate
```

### 3. Python-Pakete installieren

```bash
pip install -r requirements.txt
```

### 4. Frontend installieren

```bash
cd frontend
npm install
```

### 5. LLM-Modell herunterladen

Ein GGUF-Modell von Hugging Face herunterladen und in diesen Ordner legen:

```text
models/
```

Beispiel:

```text
models/model.gguf
```

Falls der Dateiname im Code anders gesetzt ist, muss der Modellpfad im Code entsprechend angepasst werden.

### 6. Backend starten

Im Hauptordner:

```bash
python app.py
```

### 7. Frontend starten

Im Ordner `frontend`:

```bash
npm run dev
```

Danach kann das Frontend im Browser geöffnet werden.

Meistens unter:

```text
http://localhost:5173
```

## Start mit Docker

Das Projekt enthält Docker-Dateien für die containerisierte Ausführung.

### 1. Modell vorbereiten

Das GGUF-Modell muss vorher lokal in den Ordner `models/` gelegt werden.

```text
models/model.gguf
```

### 2. Container starten

Im Hauptordner:

```bash
docker compose up --build
```

Danach werden die Container für Backend, Frontend und lokales LLM gestartet.

## Hinweis zu API-Schlüsseln

API-Schlüssel, zum Beispiel für Gemini, werden aus Sicherheitsgründen nicht im Repository gespeichert.

Falls ein API-Schlüssel benötigt wird, muss lokal eine `.env` Datei erstellt werden.

Beispiel:

```text
GEMINI_API_KEY=dein_api_key
```

## Nicht im Repository enthalten

Folgende Dateien und Ordner werden bewusst nicht hochgeladen:

```text
.venv/
.venv311/
node_modules/
models/
*.gguf
.env
*.db
```

Diese Dateien sind entweder zu groß, lokal erzeugt oder enthalten sensible Daten.

## Autor

Yazan Sy
Bachelorarbeit: Konzeption und prototypische Umsetzung eines Voicebots unter Verwendung von Whisper

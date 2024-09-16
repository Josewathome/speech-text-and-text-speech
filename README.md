---
still on improvement
# Speech and Text Testing System
A lightweight conversational assistant with text-to-speech (TTS) and transcription capabilities.

![Microphone Icon](https://img.icons8.com/ios-filled/50/000000/microphone.png) ![Speaker Icon](https://img.icons8.com/ios-filled/50/000000/speaker.png)

## Description
The Speech and Text Testing System is a small, lightweight conversational assistant that allows users to interact with the system through spoken commands. You can talk to the assistant, and it will read back your speech in English. The system utilizes the Whisper model for transcribing speech to text and the Coqui TTS model for text-to-speech functionality. While the Whisper model is predominantly trained on English, it can transcribe speech in over 30 languages. The TTS functionality can be extended to support multiple languages by modifying the TTS model.

## Installation

### Prerequisites
Ensure you have the following installed:
- Python 3.x
- Django
- FFmpeg
- Other dependencies listed in `requirements.txt`

### Steps
1. **Clone the repository:**
    ```bash
    git clone https://github.com/Josewathome/speech-text-and-text-speech.git
    cd speech-text-and-text-speech
    ```

2. **Install the requirements:**
    ```bash
    pip install -r requirements.txt
    ```

3. **Make migrations:**
    ```bash
    python manage.py makemigrations
    python manage.py migrate
    ```

4. **Run the Django server:**
    ```bash
    python manage.py runserver
    ```

5. **Access the interface:**
    Open your browser and go to [http://localhost:8000/interface/](http://localhost:8000/interface/)

## Additional Setup

### Whisper Model
To use the Whisper model for speech-to-text, install the Whisper package using pip:
```bash
pip install openai-whisper
```

The Whisper model requires FFmpeg. Install it based on your operating system:

- **Ubuntu or Debian:**
    ```bash
    sudo apt update && sudo apt install ffmpeg
    ```

- **macOS using Homebrew:**
    ```bash
    brew install ffmpeg
    ```

- **Windows:**
    Download it from the [official FFmpeg website](https://ffmpeg.org/download.html) and add it to your system PATH.

You might also need to install additional Python packages:
```bash
pip install setuptools-rust
```

### Whisper API
OpenAI's Whisper API, released in March 2023, offers faster performance than the open-source model and is priced at $0.006 per minute of transcription. It supports transcriptions and translations, accepting standard audio formats such as m4a, mp3, mp4, and wav. The API is particularly strong in English but can handle over 30 languages.

For enhanced capabilities, consider Whisper-based APIs like Gladia, which offer a more extended feature set.

### Coqui TTS
To add text-to-speech functionality, install the Coqui TTS package:
```bash
pip install TTS
```

Coqui TTS allows for flexible language support. For more details, visit the [Coqui TTS GitHub page](https://github.com/coqui-ai/TTS).

---

---

# Testing System

![Microphone Icon](https://img.icons8.com/ios-filled/50/000000/microphone.png) ![Speaker Icon](https://img.icons8.com/ios-filled/50/000000/speaker.png)

## Description
A brief description of what your project does and its purpose.

## Installation

### Prerequisites
Make sure you have the following installed:
- Python 3.x
- Django
- FFmpeg
- Other dependencies listed in `requirements.txt`

### Steps
1. **Clone the repository:**
    ```bash
    git clone https://github.com/yourusername/your-repo-name.git
    cd your-repo-name
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
First, install the Whisper package using pip:
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

## Whisper API
In March 2023, OpenAI made the large-v2 model available through their API, offering faster performance than the open-source model at $0.006 per minute of transcription. The Whisper API supports transcriptions and translations, accepting standard audio formats like m4a, mp3, mp4, and wav.

## Coqui TTS
Make sure you have installed Coqui TTS:
```bash
pip install TTS
```

For more details, visit the [Coqui TTS GitHub page](https://github.com/coqui-ai/TTS).

---

Feel free to customize this template to better fit your project's specifics. Let me know if you need any more help!

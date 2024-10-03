
# Speech and Text image
## Chatbot/Virtual Assistant.

A lightweight conversational assistant that allows users to interact using both speech and text. This system utilizes state-of-the-art models for speech recognition and text-to-speech (TTS) generation, including Whisper for transcription and Coqui TTS for speech synthesis. The project is built using Django and supports additional models and APIs via Hugging Face.

![Microphone Icon](https://img.icons8.com/ios-filled/50/000000/microphone.png) ![Speaker Icon](https://img.icons8.com/ios-filled/50/000000/speaker.png)

## Features
- **Speech-to-Text**: Uses Whisper for accurate speech recognition across 30+ languages.
- **Text-to-Speech**: Powered by Coqui TTS for multilingual voice synthesis.
- **Microphone Input**: Supports real-time speech input via microphone.
- **Image Generation**: Integrated with open-source models and Hugging Face API for generating images from text.
- **Django Web Interface**: Accessible through a local server for easy interaction.

**NB ON Secrets**: I wll remove the secretes after one week you can go to hugging face and get your own api key from hugging face.

   ```bash
   file path
   src/src/secrets/secrets.txt
   ```
## Table of Contents
1. [Installation](#installation)
2. [Setup](#setup)
3. [Usage](#usage)
4. [Models and API Integration](#models-and-api-integration)
5. [Contributing](#contributing)
6. [License](#license)

---

## Installation

### Prerequisites
Ensure you have the following installed:
- Python 3.x
- Django
- FFmpeg
- pip
- Other dependencies listed in `requirements.txt`

### Steps

1. **Clone the Repository:**
   ```bash
   git clone https://github.com/Josewathome/speech-text-and-text-speech.git
   cd speech-text-and-text-speech
   ```

2. **Create a Virtual Environment (Optional but Recommended):**
   ```bash
   python -m venv venv
   source venv/bin/activate    # On Windows: venv\Scripts\activate
   ```

3. **Install Requirements:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Set Up the Django Application:**
   Make and apply migrations for the Django project.
   ```bash
   python manage.py makemigrations
   python manage.py migrate
   ```

5. **Run the Django Server:**
   Start the development server.
   ```bash
   python manage.py runserver
   ```

6. **Access the Interface:**
   Open your browser and go to [http://localhost:8000/api/interface/](http://localhost:8000/api/interface/).

---

## Setup

### Whisper Model Setup (Speech-to-Text)
The system uses OpenAI's Whisper model for speech-to-text functionality. To use Whisper:

1. **Install Whisper:**
   ```bash
   pip install openai-whisper
   ```

2. **Install FFmpeg:**
   Whisper requires FFmpeg for processing audio files. Follow the instructions based on your operating system:

   - **Ubuntu/Debian:**
     ```bash
     sudo apt update && sudo apt install ffmpeg
     ```

   - **macOS (Homebrew):**
     ```bash
     brew install ffmpeg
     ```

   - **Windows:**
     Download FFmpeg from the [official website](https://ffmpeg.org/download.html) and add it to your system PATH.

3. **Additional Dependencies:**
   You may also need to install additional dependencies:
   ```bash
   pip install setuptools-rust
   ```

### Coqui TTS Setup (Text-to-Speech)
Coqui TTS is used for synthesizing speech in multiple languages. To set it up:

1. **Install Coqui TTS:**
   ```bash
   pip install TTS
   ```

2. For more details about customizing TTS models, refer to the [Coqui TTS GitHub page](https://github.com/coqui-ai/TTS).

---

## Usage

### Running the Application

1. **Start the Django Server:**
   ```bash
   python manage.py runserver
   ```

2. **Access the Application:**
   Open your browser and go to [http://localhost:8000/api/interface/](http://localhost:8000/api/interface/) to interact with the assistant.

### Speech-to-Text
- The Whisper model is used to transcribe spoken language into text. You can use the microphone input to provide speech commands to the assistant.

### Text-to-Speech
- Coqui TTS will convert the generated text response back into speech. This enables natural conversations with the assistant.

### Image Generation
- You can generate images based on text input using models hosted locally or via Hugging Face's API.

---

## Models and API Integration

### Whisper API
If you prefer using OpenAI's Whisper API for faster transcription, you can integrate it into your setup. The API supports multiple formats, including m4a, mp3, and wav, with pricing at $0.006 per minute of transcription. OpenAI's Whisper API can handle over 30 languages.

1. **Sign Up for API Access:**
   You can obtain your API key from the [OpenAI website](https://openai.com/api/).

2. **Modify Settings:**
   Update the settings in your Django app to use the Whisper API instead of the local model for transcription.

### Hugging Face API for Image Generation
Some of the models for image generation are integrated via Hugging Face API keys. Follow these steps to set it up:

1. **Sign Up for Hugging Face:**
   Visit [Hugging Face](https://huggingface.co/) to create an account.

2. **Obtain API Key:**
   Once registered, get your API key from your Hugging Face account settings.

3. **Configure the API Key in Django:**
   Set the Hugging Face API key in your environment or directly in the Django configuration file to enable API-based model access.
   ```bash
   file path
   src/src/secrets/secrets.txt
   ```

---

## Contributing

We welcome contributions to improve the system. To contribute:

1. Fork the repository.
2. Create a new feature branch (`git checkout -b feature-branch`).
3. Commit your changes (`git commit -m 'Add new feature'`).
4. Push to the branch (`git push origin feature-branch`).
5. Open a pull request.

---

## License

This project is licensed under the MIT License. See the `LICENSE` file for details.
```
This `README.md` provides step-by-step instructions, covering the setup, usage, and model integration processes, while also mentioning the APIs used. It should be easy for anyone to follow along and use the system. Let me know if you want further customizations!

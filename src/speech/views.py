from django.shortcuts import render

# Create your views here.
"""
We import the necessary modules, including TTS from the Coqui TTS library.
We initialize the TTS model. Here, we're using the "tts_models/en/ljspeech/tacotron2-DDC" model, which is an English TTS model. You can change this to other models available in Coqui TTS if needed.
The text_to_speech view function:

Accepts a POST request with JSON data containing the 'text' to be converted to speech.
"""

# views.py
import os
import tempfile
from django.http import FileResponse, JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from TTS.api import TTS
import json

# Initialize TTS model
tts = TTS(model_name="tts_models/en/ljspeech/tacotron2-DDC", progress_bar=False)

@csrf_exempt
@require_http_methods(["POST"])
def text_to_speech(request):
    """
    Django view to handle text-to-speech requests.
    
    Expects a JSON payload with 'text' and optional parameters.
    Returns an audio file of the synthesized speech.
    """
    try:
        data = json.loads(request.body.decode('utf-8'))
        text = data.get('text')
        
        if not text:
            return JsonResponse({"error": "No text provided"}, status=400)
        
        # Optional parameters with default values
        model_name = data.get('model', "tts_models/en/ljspeech/tacotron2-DDC")
        speaker = data.get('speaker', None)
        speed = float(data.get('speed', 1.0))
        
        # Check if the model is multi-lingual
        is_multi_lingual = "multilingual" in model_name or "multi-dataset" in model_name
        
        # Only use language if the model is multi-lingual
        language = data.get('language', 'en') if is_multi_lingual else None
        
        # Create a temporary file to store the audio
        with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as temp_audio:
            # Generate speech from text
            tts_kwargs = {
                "text": text,
                "file_path": temp_audio.name,
                "speaker": speaker,
                "speed": speed
            }
            
            # Only add language if it's a multi-lingual model
            if is_multi_lingual:
                tts_kwargs["language"] = language
            
            tts.tts_to_file(**tts_kwargs)
        
        # Send the file as a response
        response = FileResponse(open(temp_audio.name, 'rb'), content_type='audio/wav')
        response['Content-Disposition'] = 'attachment; filename="speech.wav"'
        
        # Clean up the temporary file after sending
        os.unlink(temp_audio.name)
        
        return response
    
    except json.JSONDecodeError:
        return JsonResponse({"error": "Invalid JSON in request body"}, status=400)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)



""""
We added a model_name parameter to allow users to specify different models.
We check if the model is multi-lingual by looking for "multilingual" or "multi-dataset" in the model name.
We only include the language parameter in the TTS function call if the model is multi-lingual.
We use **tts_kwargs to pass arguments to the TTS function, which allows us to conditionally include the language parameter.

Now, you can use this endpoint for both single-language and multi-language models. Here's how to use it:
For a single-language model:
jsonCopy{
    "text": "Hello, this is a test of text-to-speech conversion.",
    "model": "tts_models/en/ljspeech/tacotron2-DDC",
    "speed": 1.0
}
For a multi-language model:
jsonCopy{
    "text": "Hello, this is a test of text-to-speech conversion.",
    "model": "tts_models/multilingual/multi-dataset/your_tts",
    "language": "en",
    "speaker": "speaker_id",
    "speed": 1.0
}
This implementation should resolve the error you were seeing. It will use the language parameter only when appropriate for the selected model.
Remember to adjust the model initialization at the top of the file if you want to use a different default model:
tts = TTS(model_name="your_preferred_model_name", progress_bar=False)
"""
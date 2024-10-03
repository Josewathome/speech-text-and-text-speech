# views.py
import json
import os
import tempfile
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
import whisper
import requests
from pydub import AudioSegment
from urllib.parse import urlparse

def get_audio_file(data):
    """
    Get audio file from various input methods.
    
    Args:
    data (dict): Request data containing audio information
    
    Returns:
    str: Path to the audio file
    """
    if 'audio_file' in data:
        # Handle file upload
        uploaded_file = data['audio_file']
        temp_file = tempfile.NamedTemporaryFile(delete=False, suffix=os.path.splitext(uploaded_file.name)[1])
        for chunk in uploaded_file.chunks():
            temp_file.write(chunk)
        temp_file.close()
        return temp_file.name
    
    elif 'audio_url' in data:
        # Handle URL input
        return download_audio(data['audio_url'])
    
    elif 'audio_path' in data:
        # Handle local file path
        if os.path.exists(data['audio_path']):
            return data['audio_path']
        else:
            raise FileNotFoundError(f"File not found: {data['audio_path']}")
    
    else:
        raise ValueError("No audio input provided")

def download_audio(url):
    """
    Download audio file from the given URL.
    
    Args:
    url (str): URL of the audio file
    
    Returns:
    str: Path to the downloaded temporary file
    """
    response = requests.get(url)
    if response.status_code == 200:
        file_extension = os.path.splitext(urlparse(url).path)[1]
        with tempfile.NamedTemporaryFile(delete=False, suffix=file_extension, mode='wb') as temp_file:
            temp_file.write(response.content)
            return temp_file.name
    else:
        raise Exception(f"Failed to download audio: HTTP {response.status_code}")

def convert_to_wav(input_file):
    """
    Convert the input audio file to WAV format.
    
    Args:
    input_file (str): Path to the input audio file
    
    Returns:
    str: Path to the converted WAV file
    """
    audio = AudioSegment.from_file(input_file)
    wav_file = tempfile.NamedTemporaryFile(delete=False, suffix=".wav")
    audio.export(wav_file.name, format="wav")
    return wav_file.name

def transcribe_audio(file_path):
    """
    Transcribe audio file using OpenAI's Whisper model.
    
    Args:
    file_path (str): Path to the audio file
    
    Returns:
    str: Transcribed text
    """
    model = whisper.load_model("base")
    result = model.transcribe(file_path)
    return result["text"]

def cleanup(*file_paths):
    """
    Remove temporary audio files.
    
    Args:
    *file_paths (str): Paths to the files to be removed
    """
    for file_path in file_paths:
        try:
            os.remove(file_path)
        except Exception as e:
            print(f"Error removing file {file_path}: {e}")

# views.py

@csrf_exempt
@require_http_methods(["POST"])
def transcribe_view(request):
    """
    Django view to handle audio transcription requests.

    Accepts audio file uploads in different formats (mp3, wav, ogg, etc.).
    Returns transcribed text as a JSON response.
    """
    try:
        if 'audio' not in request.FILES:
            return JsonResponse({"error": "No audio file provided"}, status=400)

        audio_file = request.FILES['audio']

        file_extension = os.path.splitext(audio_file.name)[1].lower()

        with tempfile.NamedTemporaryFile(delete=False, suffix=file_extension) as temp_file:
            for chunk in audio_file.chunks():
                temp_file.write(chunk)
        
        input_file_path = temp_file.name

        if file_extension != ".wav":
            audio = AudioSegment.from_file(input_file_path)
            wav_file_path = tempfile.mktemp(suffix='.wav')
            audio.export(wav_file_path, format="wav")
        else:
            wav_file_path = input_file_path

        model = whisper.load_model("base")
        result = model.transcribe(wav_file_path)
        transcription = result["text"]
        
        os.remove(input_file_path)
        if file_extension != ".wav":
            os.remove(wav_file_path)

        return JsonResponse({"transcription": transcription})

    except Exception as e:
        return JsonResponse({"error": str(e)}, status=400)



#creating new chat
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import Chat
from .serializers import ChatSerializer

class ChatCreateView(APIView):
    def post(self, request):
        serializer = ChatSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# This is the code to modify
from rest_framework import status, views
from rest_framework.decorators import api_view, parser_classes
from rest_framework.response import Response
from .models import Chat, History, File, Errors
from .serializers import ChatSerializer, HistorySerializer, FileSerializer, ErrorSerializer
from django.views.decorators.csrf import csrf_exempt
from rest_framework.parsers import JSONParser, MultiPartParser, FormParser
from django.db import transaction
from django.shortcuts import get_object_or_404
from django.core.files.base import ContentFile
from speech.views import text_to_speech
from image_gen.views import generate_summary, generate_image, generate_text
import uuid
from django.core.paginator import Paginator
import json
from django.http import JsonResponse, FileResponse
from django.core.files import File as DjangoFile
import base64
from PIL import Image
from io import BytesIO
import os
from django.core.exceptions import ObjectDoesNotExist
import tempfile
from pydub import AudioSegment
import whisper
import logging
import time
import os
from django.conf import settings

logger = logging.getLogger(__name__)

@api_view(['POST', 'GET', 'PUT', 'DELETE'])
@parser_classes([JSONParser, MultiPartParser, FormParser])
def chat_view(request):
    try:
        if request.method == 'POST':
            return create_chat(request)
        elif request.method == 'GET':
            return get_chat_history(request)
        elif request.method == 'PUT':
            return update_chat(request)
        elif request.method == 'DELETE':
            return delete_chat(request)
    except Exception as e:
        error_message = str(e)
        chat_code = request.data.get('chat_code') if hasattr(request, 'data') else None
        if chat_code:
            chat = Chat.objects.filter(code=chat_code).first()
            if chat:
                Errors.objects.create(chat=chat, error=error_message)
        logger.error(f"Error in chat_view: {error_message}", exc_info=True)
        return Response({"error": error_message}, status=500)

logger = logging.getLogger(__name__)

def create_chat(request):
    data = request.data
    new_chat = str(data.get('new_chat', 'false')).lower() == 'true'
    input_type = data.get('input_type', 'text')
    input_content = data.get('input_content', '')
    generate_image_flag = str(data.get('generate_image', 'false')).lower() == 'true'

    try:
        # Create new chat or get existing one
        if new_chat:
            chat = Chat.objects.create()
            logger.info(f"Created new chat with code: {chat.code}")
        else:
            chat_code = data.get('chat_code')
            chat = Chat.objects.get(code=chat_code)
            logger.info(f"Retrieved existing chat with code: {chat.code}")

        # Handle audio input if provided
        if input_type == 'audio':
            audio_file = request.FILES.get('audio')
            if audio_file:
                input_content = handle_audio_input(audio_file)
                if not input_content:
                    logger.error("Failed to transcribe audio")
                    return Response({"error": "Failed to transcribe audio"}, status=400)
            else:
                logger.error("No audio file provided")
                return Response({"error": "No audio file provided"}, status=400)

        # Create chat history
        history = History.objects.create(chat=chat, input_text=input_content)
        logger.info(f"Created chat history with ID: {history.id}")

        # Generate text response
        logger.info("Generating text response...")
        output_text_response = generate_text({"text": input_content})
        if isinstance(output_text_response, JsonResponse):
            output_text_data = json.loads(output_text_response.content.decode('utf-8'))
            output_text = output_text_data.get('generated_text', '')
            logger.info(f"Generated text response: {output_text[:50]}...")  # Log first 50 chars
        else:
            logger.error("Invalid response from generate_text")
            return Response({"error": "Invalid response from generate_text"}, status=500)
        # saving the title
        chat = Chat.objects.get(code=chat_code)
        def get_first_four_words(sentence):
            words = sentence.split()  
            first_four_words = words[:4] 
            return ' '.join(first_four_words) 
        
        if chat.title == 'New chat':
            chat.title = get_first_four_words(output_text)
            chat.save()
            logger.info(f"Set chat title: {chat.title}")

        
        history.output_text = output_text
        history.save()

        # Generate image if needed
        if len(output_text) > 200 and generate_image_flag:
            logger.info("Generating image...")
            summary_response = generate_summary({"text": output_text})
            if isinstance(summary_response, JsonResponse):
                summary_data = json.loads(summary_response.content.decode('utf-8'))
                summary = summary_data.get('summary_text', '')
                if summary:
                    image_response = generate_image({"text": summary})
                    if isinstance(image_response, JsonResponse):
                        image_data = json.loads(image_response.content.decode('utf-8'))
                        image_base64 = image_data.get('image_base64', '')
                        if image_base64:
                            image_content = base64.b64decode(image_base64)
                            file = File.objects.create(history=history)
                            file.output_image.save('generated_image.jpg', ContentFile(image_content), save=True)
                            logger.info("Image generated and saved successfully")
                        else:
                            logger.warning("No image data from generate_image")
                    else:
                        logger.warning("Invalid response from generate_image")
                else:
                    logger.warning("No summary generated for image")
            else:
                logger.warning("Invalid response from generate_summary")

        # Generate audio response
        logger.info("Generating audio response...")
        audio_response = text_to_speech(output_text)

        if isinstance(audio_response, Response):
            audio_data = audio_response.data
            if "error" in audio_data:
                logger.warning(f"Invalid response from text_to_speech: {audio_data['error']}")
            else:
                audio_base64 = audio_data.get('audio_base64', '')
                if audio_base64:
                    try:
                        audio_content = base64.b64decode(audio_base64)
                        file = File.objects.create(history=history)
                        file_name = f'generated_audio_{int(time.time())}.wav'  # Unique filename
                        file.output_audio.save(file_name, ContentFile(audio_content), save=True)
                        logger.info(f"Audio generated and saved successfully: {file_name}")
                    except Exception as e:
                        logger.error(f"Error saving audio file: {str(e)}")
                else:
                    logger.warning("No audio data from text_to_speech")
        else:
            logger.error("Unexpected response type from text_to_speech")


        if not chat.title:
            chat.title = ' '.join(output_text.split()[:3])
            chat.save()
            logger.info(f"Set chat title: {chat.title}")

        logger.info("Chat creation completed successfully")
        return Response(ChatSerializer(chat).data, status=status.HTTP_201_CREATED)

    except Chat.DoesNotExist:
        logger.error(f"Chat not found with code: {data.get('chat_code')}")
        return Response({"error": "Chat not found"}, status=404)
    except Exception as e:
        logger.error(f"Error in create_chat: {str(e)}", exc_info=True)
        if 'chat' in locals():
            Errors.objects.create(chat=chat, error=str(e))
        return Response({"error": str(e)}, status=500)
    

def get_chat_history(request):
    try:
        chat_code = request.query_params.get('chat_code')
        page = int(request.query_params.get('page', 1))
        per_page = int(request.query_params.get('per_page', 10))

        chat = Chat.objects.get(code=chat_code)
        history = History.objects.filter(chat=chat).order_by('-added_at')

        paginator = Paginator(history, per_page)
        paginated_history = paginator.page(page)

        serialized_history = HistorySerializer(paginated_history, many=True).data

        return Response({
            "chat": ChatSerializer(chat).data,
            "history": serialized_history,
            "total_pages": paginator.num_pages,
            "current_page": page
        }, status=status.HTTP_200_OK)
    except Chat.DoesNotExist:
        return Response({"error": "Chat not found"}, status=404)
    except Exception as e:
        logger.error(f"Error in get_chat_history: {str(e)}", exc_info=True)
        return Response({"error": str(e)}, status=500)

def update_chat(request):
    try:
        data = request.data
        history_id = data.get('history_id')
        new_input = data.get('new_input')

        history = History.objects.get(id=history_id)
        history.input_text = new_input
        history.save()

        output_text_response = generate_text({"text": new_input})
        if isinstance(output_text_response, JsonResponse):
            output_text_data = json.loads(output_text_response.content.decode('utf-8'))
            output_text = output_text_data.get('generated_text', '')
        else:
            return Response({"error": "Invalid response from generate_text"}, status=500)

        history.output_text = output_text
        history.save()

        if File.objects.filter(history=history, output_image__isnull=False).exists():
            summary_response = generate_summary({"text": output_text})
            if isinstance(summary_response, JsonResponse):
                summary_data = json.loads(summary_response.content.decode('utf-8'))
                summary = summary_data.get('summary_text', '')
                if summary:
                    image_response = generate_image({"text": summary})
                    if isinstance(image_response, JsonResponse):
                        image_data = json.loads(image_response.content.decode('utf-8'))
                        image_base64 = image_data.get('image_base64', '')
                        if image_base64:
                            image_content = base64.b64decode(image_base64)
                            file = File.objects.get(history=history, output_image__isnull=False)
                            file.output_image.save('updated_image.jpg', ContentFile(image_content), save=True)
                    else:
                        logger.warning("Invalid response from generate_image")
            else:
                logger.warning("Invalid response from generate_summary")

        audio_response = text_to_speech(output_text)
        
        if isinstance(audio_response, FileResponse):
            file, created = File.objects.get_or_create(history=history, defaults={'output_audio': None})
            file.output_audio.save('updated_audio.wav', audio_response.getvalue(), save=True)
        else:
            logger.warning("Invalid response from text_to_speech")

        return Response(HistorySerializer(history).data, status=status.HTTP_200_OK)
    except History.DoesNotExist:
        return Response({"error": "History not found"}, status=404)
    except Exception as e:
        logger.error(f"Error in update_chat: {str(e)}", exc_info=True)
        return Response({"error": str(e)}, status=500)

def delete_chat(request):
    try:
        chat_code = request.query_params.get('chat_code')
        chat = Chat.objects.get(code=chat_code)
        
        # Get all associated histories
        histories = History.objects.filter(chat=chat)
        
        for history in histories:
            # Get all associated files
            files = File.objects.filter(history=history)
            
            for file in files:
                # Delete the file from local storage
                if file.output_audio:
                    if os.path.isfile(file.output_audio.path):
                        os.remove(file.output_audio.path)
                if file.output_image:
                    if os.path.isfile(file.output_image.path):
                        os.remove(file.output_image.path)
                
                # Delete the file record
                file.delete()
            
            # Delete the history record
            history.delete()
        
        # Delete the chat
        chat.delete()
        
        return Response({"message": "Chat and associated files deleted successfully"}, status=status.HTTP_200_OK)
    except Chat.DoesNotExist:
        return Response({"error": "Chat not found"}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        logger.error(f"Error in delete_chat: {str(e)}", exc_info=True)
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
def handle_audio_input(audio_file):
    try:
        file_extension = os.path.splitext(audio_file.name)[1].lower()
        with tempfile.NamedTemporaryFile(delete=False, suffix=file_extension) as temp_file:
            for chunk in audio_file.chunks():
                temp_file.write(chunk)

        input_file_path = temp_file.name

        if file_extension != ".wav":
            audio = AudioSegment.from_file(input_file_path)
            wav_file_path = tempfile.mktemp(suffix='.wav')
            audio.export(wav_file_path, format="wav")
        else:
            wav_file_path = input_file_path

        model = whisper.load_model("base")
        result = model.transcribe(wav_file_path)
        os.remove(wav_file_path)
        return result.get('text', '')

    except Exception as e:
        logger.error(f"Error in handle_audio_input: {str(e)}", exc_info=True)
        return None


from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Chat, History, File, Errors
from .serializers import ChatSerializer, HistorySerializer, FileSerializer, ErrorSerializer
from django.shortcuts import get_object_or_404

class ChatViewSet(viewsets.ModelViewSet):
    queryset = Chat.objects.all().order_by('-updated_at')
    serializer_class = ChatSerializer

    @action(detail=False, methods=['GET'])
    def list_chats(self, request):
        chats = self.get_queryset()
        serializer = self.get_serializer(chats, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['POST'])
    def create_interaction(self, request, pk=None):
        chat = self.get_object()
        history_serializer = HistorySerializer(data=request.data)
        if history_serializer.is_valid():
            history = history_serializer.save(chat=chat)
            
            # Handle file uploads
            audio_file = request.FILES.get('audio')
            image_file = request.FILES.get('image')
            
            if audio_file or image_file:
                file_data = {}
                if audio_file:
                    file_data['output_audio'] = audio_file
                if image_file:
                    file_data['output_image'] = image_file
                file_serializer = FileSerializer(data=file_data)
                if file_serializer.is_valid():
                    file_serializer.save(history=history)
            
            chat.save()  # Update the 'updated_at' field
            return Response(ChatSerializer(chat).data)
        return Response(history_serializer.errors, status=status.HTTP_400_BAD_ERROR)

    @action(detail=True, methods=['GET'])
    def get_history(self, request, pk=None):
        chat = self.get_object()
        serializer = self.get_serializer(chat)
        return Response(serializer.data)

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        chat = serializer.save()
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)

    def destroy(self, request, *args, **kwargs):
        chat = self.get_object()
        chat.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

class ErrorViewSet(viewsets.ModelViewSet):
    queryset = Errors.objects.all().order_by('-updated_at')
    serializer_class = ErrorSerializer

    @action(detail=False, methods=['POST'])
    def create_error(self, request):
        chat_code = request.data.get('chat_code')
        error_message = request.data.get('error')
        
        chat = get_object_or_404(Chat, code=chat_code)
        
        error = Errors.objects.create(chat=chat, error=error_message)
        serializer = self.get_serializer(error)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=['GET'])
    def get_errors(self, request):
        chat_code = request.query_params.get('chat_code')
        if chat_code:
            errors = self.queryset.filter(chat__code=chat_code)
        else:
            errors = self.queryset.all()
        
        serializer = self.get_serializer(errors, many=True)
        return Response(serializer.data)


# The following functions (generate_text, generate_summary, generate_image, text_to_speech)
# should be imported from their respective modules as they are already implemented elsewhere.
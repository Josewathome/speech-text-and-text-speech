from django.shortcuts import render

# Create your views here.
from .main_model import Text_query, IMAGE_query, SUMMARY_query # diffrent models.
from django.http import  JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
import json
import io
from PIL import Image
import base64
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
import logging
import re


logger = logging.getLogger(__name__)

def clean_text(text):
    """
    Cleans the generated text by removing unwanted characters, excessive newlines, and spaces.
    You can customize this function as per your specific cleaning requirements.
    """
    # Remove unwanted characters (example: non-alphanumeric except basic punctuation)
    text = re.sub(r'[^\w\s\'".,!?-]+', '', text)  # Keep alphanumeric, whitespace, and basic punctuation
    
    # Remove excessive whitespace (more than 1 space)
    text = re.sub(r'\s{2,}', ' ', text)
    
    # Trim excessive newlines (more than 2 newlines)
    text = re.sub(r'\n{3,}', '\n\n', text)
    
    # Strip leading and trailing spaces
    return text.strip()

def generate_text(request):
    try:
        if hasattr(request, 'body'):
            data = json.loads(request.body.decode('utf-8'))
        else:
            data = request  
        text = data.get('text')
        if not text:
            return JsonResponse({"error": "No text provided"}, status=400)
        input_text_with_prompt = f"Please provide a detailed description of, {text}"
        response = Text_query({
            "inputs": input_text_with_prompt,
        })
        
        logger.debug(f"Text_query response: {response}")
        if not isinstance(response, list) or not response or 'generated_text' not in response[0]:
            logger.error(f"Unexpected response format from Text_query: {response}")
            return JsonResponse({"error": "Unexpected response format from text generation model"}, status=500)

        generated_text = response[0]['generated_text']
        
        # Clean the generated text
        if generated_text.startswith(input_text_with_prompt):
            generated_text = generated_text[len(input_text_with_prompt):].strip()

        cleaned_text = clean_text(generated_text)

        return JsonResponse({"generated_text": cleaned_text})
    #JsonResponse({"generated_text": generated_text.strip()})

    except json.JSONDecodeError:
        logger.error("Invalid JSON in request body", exc_info=True)
        return JsonResponse({"error": "Invalid JSON in request body"}, status=400)
    except Exception as e:
        logger.error(f"Error in generate_text view: {str(e)}", exc_info=True)
        return JsonResponse({"error": "An unexpected error occurred"}, status=500)

"""
logger = logging.getLogger(__name__)
def generate_text(request):
    try:
        if hasattr(request, 'body'):
            data = json.loads(request.body.decode('utf-8'))
        else:
            data = request  
        text = data.get('text')
        if not text:
            return JsonResponse({"error": "No text provided"}, status=400)
        input_text_with_prompt = f"Please provide a detailed description of, {text}"
        response = Text_query({
            "inputs": input_text_with_prompt,
        })
        
        logger.debug(f"Text_query response: {response}")
        if not isinstance(response, list) or not response or 'generated_text' not in response[0]:
            logger.error(f"Unexpected response format from Text_query: {response}")
            return JsonResponse({"error": "Unexpected response format from text generation model"}, status=500)

        generated_text = response[0]['generated_text']
        if generated_text.startswith(input_text_with_prompt):
            generated_text = generated_text[len(input_text_with_prompt):]
        return JsonResponse({"generated_text": generated_text.strip()})

    except json.JSONDecodeError:
        logger.error("Invalid JSON in request body", exc_info=True)
        return JsonResponse({"error": "Invalid JSON in request body"}, status=400)
    except Exception as e:
        logger.error(f"Error in generate_text view: {str(e)}", exc_info=True)
        return JsonResponse({"error": "An unexpected error occurred"}, status=500)

"""
    
    
#generate image view
def generate_image(request):
    try:
        if hasattr(request, 'body'):
            data = json.loads(request.body.decode('utf-8'))
        else:
            data = request 
        text = data.get('text')
        if not text:
            return JsonResponse({"error": "No text provided"}, status=400)

        text = f"Please generate an image that best describes: {text}"
        image_bytes = IMAGE_query({
            "inputs": text,
        })

        generated_image = Image.open(io.BytesIO(image_bytes))

        buffer = io.BytesIO()
        generated_image.save(buffer, format="JPEG")
        buffer.seek(0)

        image_base64 = base64.b64encode(buffer.read()).decode('utf-8')

        return JsonResponse({"image_base64": image_base64})

    except json.JSONDecodeError:
        return JsonResponse({"error": "Invalid JSON in request body"}, status=400)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)

    
#Summarize:

def generate_summary(request):
    
    try:
        if hasattr(request, 'body'):
            data = json.loads(request.body.decode('utf-8'))
        else:
            data = request 
            
        text = data.get('text')
        
        if not text:
            return JsonResponse({"error": "No text provided"}, status=400)
        summary = SUMMARY_query(
            {
            "inputs": text,
        }
        )
        return  JsonResponse({
            
            'summary_text' : summary }) #  {"summary_text":""}	string	The summarized text.
    
    except json.JSONDecodeError:
        return JsonResponse({"error": "Invalid JSON in request body"}, status=400)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)
    
    
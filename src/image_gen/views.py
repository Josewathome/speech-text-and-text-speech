from django.shortcuts import render

# Create your views here.
from .main_model import Text_query, IMAGE_query, SUMMARY_query # diffrent models.

from django.http import  JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
import json

import logging

logger = logging.getLogger(__name__)

@csrf_exempt
@require_http_methods(["POST"])
def generate_text(request):
    try:
        # Load and extract the input text
        data = json.loads(request.body.decode('utf-8'))
        text = data.get('text')

        if not text:
            return JsonResponse({"error": "No text provided"}, status=400)
        
        # Add some context to the input text
        input_text_with_prompt = f"Please provide a detailed description of, {text}"
        
        # Call the text generation API
        response = Text_query({
            "inputs": input_text_with_prompt,
        })
        
        # Log the response for debugging
        logger.debug(f"Text_query response: {response}")

        # Check if the response is in the expected format
        if not isinstance(response, list) or not response or 'generated_text' not in response[0]:
            logger.error(f"Unexpected response format from Text_query: {response}")
            return JsonResponse({"error": "Unexpected response format from text generation model"}, status=500)

        generated_text = response[0]['generated_text']

        # Remove the input text from the generated text if it appears at the beginning
        if generated_text.startswith(input_text_with_prompt):
            generated_text = generated_text[len(input_text_with_prompt):]

        # Return the cleaned-up generated text
        return JsonResponse({"generated_text": generated_text.strip()})

    except json.JSONDecodeError:
        logger.error("Invalid JSON in request body", exc_info=True)
        return JsonResponse({"error": "Invalid JSON in request body"}, status=400)
    except Exception as e:
        logger.error(f"Error in generate_text view: {str(e)}", exc_info=True)
        return JsonResponse({"error": "An unexpected error occurred"}, status=500)


    
    
#generate image view
import io
from PIL import Image
import base64

from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods

@csrf_exempt
@require_http_methods(["POST"])
def generate_image(request):
    try:
        # Load and extract the input text
        data = json.loads(request.body.decode('utf-8'))
        text = data.get('text')

        if not text:
            return JsonResponse({"error": "No text provided"}, status=400)

        # Prepare the input text for image generation
        text = f"Please generate an image that best describes: {text}"

        # Call the image generation API to get the image bytes
        image_bytes = IMAGE_query({
            "inputs": text,
        })

        # Open the image from bytes
        generated_image = Image.open(io.BytesIO(image_bytes))

        # Convert the image to JPEG format and save it to a buffer
        buffer = io.BytesIO()
        generated_image.save(buffer, format="JPEG")
        buffer.seek(0)

        # Encode the image in base64 for the JSON response
        image_base64 = base64.b64encode(buffer.read()).decode('utf-8')

        # Return the base64-encoded image in the response
        return JsonResponse({"image_base64": image_base64})

    except json.JSONDecodeError:
        return JsonResponse({"error": "Invalid JSON in request body"}, status=400)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)

    
#Summarize:
@csrf_exempt
@require_http_methods(["POST"])
def generate_summary(request):
    
    try:
        data = json.loads(request.body.decode('utf-8'))
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
    
    
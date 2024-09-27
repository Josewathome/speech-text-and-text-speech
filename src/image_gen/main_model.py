import requests
import os
import json

file_path = os.path.join('src', 'secrets', 'secrets.txt')

def get_access_token(file_path):
    with open(file_path, 'r') as file:
        data = json.load(file)
        access_token = data.get("access token")
    return access_token

access_token = get_access_token(file_path)

headers = {
    "Authorization": f"Bearer {access_token}"
}

#IMAGE GENERATION
imageAPI_URL = "https://api-inference.huggingface.co/models/black-forest-labs/FLUX.1-dev"
def IMAGE_query(payload):
	response = requests.post(imageAPI_URL, headers=headers, json=payload)
	return response.content

"""
image_bytes = IMAGE_query(
    {
	"inputs": "Please provide a detailed description of china town in kenya\n\nThe Chinatown in Kenya, also known as Little China, is a vibrant and bustling neighborhood located in the heart of Nairobi, the country\'s capital city. It is primarily concentrated in the areas of Ngara and Eastleigh, with a smaller community in the CBD (Central Business District). Here\'s a detailed description of Kenya\'s Chinatown:\n\n1. **History and Demographics**: The Chinese community in Kenya dates back to the early 20th century when laborers were brought",
}
) 

# You can access the image with PIL.Image for example
import io
from PIL import Image
image = Image.open(io.BytesIO(image_bytes))
print(image)
"""

#Text Generation
TextAPI_URL = "https://api-inference.huggingface.co/models/mistralai/Mistral-Nemo-Instruct-2407"

def Text_query(payload):
    
	response = requests.post(TextAPI_URL, headers=headers, json=payload)
	return response.json()
"""	
output = Text_query({
    "inputs": "Please provide a detailed description of china town in kenya",
    "parameters": {
        "temperature": 0.65,
        #"max_new_tokens": 500,
        "top_p": 0.85,
        "frequency_penalty": 0.2,
        "return_full_text": True,
        #"stop": ["\n", "END"]
    },
    "stream": False
})

print(output)
[{'summary_text': 'Please provide a detailed description of china town in kenya\n\nThe Chinatown in Kenya, also known as "}]
"""

#Summarization

SummaryAPI_URL = "https://api-inference.huggingface.co/models/facebook/bart-large-cnn"

def SUMMARY_query(payload):
	response = requests.post(SummaryAPI_URL, headers=headers, json=payload)
	return response.json()
"""	
output = SUMMARY_query({
	"inputs": "The tower is 324 metres (1,063 ft) tall, about the same height as an 81-storey building, and the tallest structure in Paris. Its base is square, measuring 125 metres (410 ft) on each side. During its construction, the Eiffel Tower surpassed the Washington Monument to become the tallest man-made structure in the world, a title it held for 41 years until the Chrysler Building in New York City was finished in 1930. It was the first structure to reach a height of 300 metres. Due to the addition of a broadcasting aerial at the top of the tower in 1957, it is now taller than the Chrysler Building by 5.2 metres (17 ft). Excluding transmitters, the Eiffel Tower is the second tallest free-standing structure in France after the Millau Viaduct.",
})

summary_text	string	The summarized text.
"""
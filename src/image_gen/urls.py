# urls.py
from django.urls import path
from . import views

urlpatterns = [
   # path('generate-text/', views.generate_text, name='text_to_speech'), #input is json { "text":""} output [{'generated_text': ' "}]
    
   # path('generate-image/', views.generate_image, name='text_to_speech'), #input is json { "text":""} output .JpegImageFile image mode=RGB size=1024x1024 {image.show()}
    
   # path('generate-summary/', views.generate_summary, name='text_to_speech'), #input is json { "text":""}  output {"summary_text":""}	string	The summarized text.
]
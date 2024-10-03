# urls.py
from django.urls import path
from . import views

urlpatterns = [
    path('tts/', views.text_to_speech_api, name='text_to_speech'),
]
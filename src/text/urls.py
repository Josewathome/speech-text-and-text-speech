# urls.py
from django.urls import path, include
from . import views
from django.conf import settings
from django.conf.urls.static import static
from rest_framework.routers import DefaultRouter
from .views import ChatViewSet, ErrorViewSet

router = DefaultRouter()
router.register(r'querychat', ChatViewSet)
router.register(r'error', ErrorViewSet)

urlpatterns = [
   # path('transcribe/', views.transcribe_view, name='transcribe'),
    
    path('chat/', views.chat_view, name='create_or_update_chat'),
    path('chat/create/', views.ChatCreateView.as_view(), name='chat-create'),
    
    path('', include(router.urls)),
]
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
# models.py
from django.db import models
import uuid

class Chat(models.Model):
    code = models.CharField(max_length=20, unique=True, primary_key=True, editable=False)
    title = models.CharField(max_length=255,null=True,)
    added_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'text_chat'

    def __str__(self):
        return f"{self.title} id: {self.code}"
    
    def save(self, *args, **kwargs):
        if not self.code:
            self.code = uuid.uuid4().hex[:20]  # Generate a 20-character unique code
        super().save(*args, **kwargs)

class History(models.Model):
    chat = models.ForeignKey(Chat, related_name='interactions', on_delete=models.CASCADE)
    input_text = models.TextField(null=True, blank=True)
    output_text = models.TextField(null=True, blank=True)
    added_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"History entry for Chat {self.chat.code}"

class File(models.Model):
    history = models.ForeignKey(History, related_name='files', on_delete=models.CASCADE)
    output_audio = models.FileField(upload_to='audio/', null=True, blank=True)
    output_image = models.ImageField(upload_to='images/', null=True, blank=True)
    added_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

class Errors(models.Model):
    chat = models.ForeignKey(Chat, related_name='errors', on_delete=models.CASCADE)  # Changed from 'code' to 'chat'
    error = models.TextField(null=True, blank=True)
    added_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Error for Chat {self.chat.code}: {self.error[:50]}"

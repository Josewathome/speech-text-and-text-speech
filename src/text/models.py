from django.db import models

# Create your models here.
# models.py
from django.db import models

class ChatHistory(models.Model):
    title = models.CharField(max_length=255)
    input_text = models.TextField()
    output_text = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title

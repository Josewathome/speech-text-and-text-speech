from django.contrib import admin
from .models import Chat, History, File, Errors
# Register your models here.
admin.site.register(Chat)
admin.site.register(History)
admin.site.register(File)
admin.site.register(Errors)

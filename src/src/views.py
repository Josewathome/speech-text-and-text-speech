# views.py
from django.shortcuts import render

def my_html_view(request):
    return render(request, 'index.html')
def history_html(request):
    return render(request, 'history.html')
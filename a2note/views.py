"""
All the views rendered by a2note_ninja

Author: Ama
"""

from django.shortcuts import render

#translation
from django.utils.translation import gettext_lazy as _
from django.utils.translation import activate, get_language


def index(request):

    return render(request, "a2note/index.html")

def register(request):
    return render(request, "a2note/register.html")


def login(request):
    return render(request, "a2note/login.html")

def todolist(request):

    return render(request, "a2note/todolist.html")


def shoplist(request):

    return render(request, "a2note/shoplist.html")

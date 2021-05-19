from django.shortcuts import render

#translation
from django.utils.translation import gettext_lazy as _
from django.utils.translation import activate, get_language


def index(request):

    return render(request, "a2note/index.html")


def todolist(request):

    return render(request, "a2note/todolist.html")


def shoplist(request):

    return render(request, "a2note/shoplist.html")

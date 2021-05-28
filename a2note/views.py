"""
All the views rendered by a2note_ninja

Author: Ama
"""

from django.shortcuts import render
from django.http import JsonResponse

#translation
from django.utils.translation import gettext_lazy as _
from django.utils.translation import activate, get_language

from a2note.dynamoDB_ops import *

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

def product_list_view(request):
    """
    This view returns data about all the product in the database to make the auto fill
    function work
    """
    product_list = select_elements_by_type('PRODUCT')
    
    response = {}
    for p in product_list:
        if  request.LANGUAGE_CODE == 'it':
            name = p['IT_name']
        else:
            name = p['EN_name']
        response[name] = p['element_category']

    return JsonResponse(response)

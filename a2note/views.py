"""
All the views rendered by a2note_ninja

Author: Ama
"""

from django.shortcuts import render, redirect
from django.http import JsonResponse

from django.contrib.auth.models import User
from a2note.models import AdditionalInfo
from django.contrib.auth import authenticate, login

#translation
from django.utils.translation import gettext_lazy as _
from django.utils.translation import activate, get_language

from a2note.dynamoDB_ops import *

def index(request):

    return render(request, "a2note/index.html")

def register(request):
    return render(request, "a2note/register.html")


def register_success(request):
    #Initializing defaults
    context = {}
    failed = False

    #Retrieving POST data
    username = request.POST.get("ninjaName")
    email = request.POST.get("email")
    psw0 = request.POST.get("password0")
    psw1 = request.POST.get("password1")

    context["username"] = username
    context["email"] = email

    try:
        consent = request.POST.get("consentCheck") == "consent"
    except:
        consent = False

    ### Perform checks ###

    #CHECK 1
    #Check if username already present
    try:
        user = User.objects.get(username=username)
        failed = True
        context["message"] = {
        "class": "alert alert-danger alert-dismissible",
        "text": _("Oh no! The ninja name you chose seems to be already taken...don't worry! Just choose a different one : )")
        }
    except User.DoesNotExist:
        failed = False

    #CHECK 2
    #Check if email already present
    if not failed:
        try:
            user = User.objects.get(email=email)
            failed = True
            context["message"] = {
            "class": "alert alert-danger alert-dismissible",
            "text": _("Ooops...the email address you inserted is already associated with another ninja...")
            }
        except User.DoesNotExist:
            failed = False

    #CHECK 3
    #Check if the two inserted passwords correspond
    if not failed:
        if psw0 != psw1:
            failed = True
            context["message"] = {
            "class": "alert alert-danger alert-dismissible",
            "text": _("The two password you inserted do not correspond...")
            }

    if failed:
        return render(request, "a2note/register.html", context)


    #Getting IP address of the user to register the consent
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        ip_address = x_forwarded_for.split(',')[-1]
    else:
        ip_address = request.META.get('REMOTE_ADDR')

    #...user registration TO-DO
    new_user = User.objects.create_user(username=username, email=email, password=psw0)
    additional_info = AdditionalInfo(user=new_user, consent_ip=ip_address)

    #Last check and auto login of the new user
    user = authenticate(username=username, password=psw0)
    if user:
        login(request, user)


    return redirect('index_view')


def login_view(request):
    return render(request, "a2note/login.html")

def my_account_view(request):
    return render(request, "a2note/my_account.html")

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

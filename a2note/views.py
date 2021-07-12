"""
All the views rendered by a2note.ninja

Author: Ama
"""

from django.shortcuts import render, redirect
from django.http import JsonResponse

from django.contrib.auth.models import User
from a2note.models import AdditionalInfo
from django.contrib.auth import authenticate, login, update_session_auth_hash
from django.contrib.auth.decorators import login_required

from django.core.validators import validate_email

#translation
from django.utils.translation import gettext
from django.utils.translation import gettext_lazy as _
from django.utils.translation import activate, get_language

from a2note.dynamoDB_ops import *
from a2note.mailer import send_email

import json
from datetime import datetime
import random

import socket

#Caching
from django.core.cache import cache

def error_view(request, message="", pagemessage=""):

    context = {}
    context["message"] = {
    "class": "alert alert-danger alert-dismissible",
    "text": message
    }

    if pagemessage == "":
        context["pageMessage"] = _("Possible reasons for this error: <br><ul>" \
        "<li>The list is not shared so only the author can see it</li>" \
        "<li>The list encountered its demise and it's not with us anymore</li>" \
        "<li>The entire website exploded</li></ul><br>" \
        "Ok, maybe not the last option...")

    return render(request, "a2note/error_page.html", context)

def index(request):
    if request.user.is_authenticated:
        #Get user information
        user = request.user

        total, todolists_ctr, shoplists_ctr = 0,0,0
        #Get all lists created by the current user
        cache_key = user.username + "_LISTS"
        created_lists = cache.get(cache_key)
        if not created_lists:
            created_lists = select_lists_by_author(user.username)
            cache.set(cache_key, created_lists)

        lists = []

        for l in created_lists:
            length = len(l["items"])
            creation_date = datetime.strptime(l["creation_timestamp"], "%Y-%m-%d h.%H:%M:%S.%f")
            last_modified = datetime.strptime(l["last_modified"], "%Y-%m-%d h.%H:%M:%S.%f")
            #List title
            if "title" in l:
                title = l["title"]
            else:
                #title legacy for old lists without titles
                title = l["element_type"] + "_" + l["element_id"]
            list_obj = {
                "element_type": l["element_type"],
                "element_id": l["element_id"],
                "title": title,
                "creation_timestamp": creation_date.strftime("%Y-%m-%d h.%H:%M:%S"),
                "last_modified": last_modified.strftime("%Y-%m-%d h.%H:%M:%S"),
                "length": length
            }
            lists.append(list_obj)
            if l["element_type"] == "SHOPLIST":
                shoplists_ctr += 1
            elif l["element_type"] == "TODOLIST":
                todolists_ctr += 1
            else:
                pass

        lists = sorted(lists, key=lambda k: k['last_modified'], reverse=True)

        total = len(lists)

        context = {
            "lists": lists,
            "total": total,
            "todolists": todolists_ctr,
            "shoplists": shoplists_ctr
        }

        return render(request, "a2note/index.html", context)

    return render(request, "a2note/index.html")

def about_us(request):

    return render(request, "a2note/about_us.html")

def generate_OTP():
    LENGTH = 6
    digits = '0123456789'

    return "".join([random.choice(digits) for i in range(LENGTH)])

def send_otp(request):
    username = request.POST["username"]
    email = request.POST["email"]

    response = {}

    try:
        validate_email(email)
    except:
        response = {
        "RESULT": "ERROR",
        "DESCRIPTION": _("Email address is invalid...please check")
        }
        return JsonResponse(response)

    otp = generate_OTP()
    cache_key = f"{username}_{email}"
    cache.set(cache_key, otp, 60*5)

    email_subj = "a2note.ninja - Registration OTP"

    email_content = _("Hi") + f" <strong>{username}!</strong><br>"
    email_content += _("Here's the code to complete your registration on a2note.ninja") + "<br>"
    email_content += f"<strong style='font-size:3rem;'>{otp}</strong><br><br>"
    email_content += "a2note.ninja"

    try:
        send_email(email, email_subj, email_content)
    except:
        response = {
        "RESULT": "ERROR",
        "DESCRIPTION": _("Something went wrong...try again later.")
        }
        return JsonResponse(response)

    response = {
    "RESULT": "OK"
    }
    return JsonResponse(response)

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
    otp_user = request.POST.get("OTPNum")

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
            "text": _("The two password you entered do not match...")
            }

    #CHECK 4
    #Check if OTP is correct
    if not failed:
        cache_key = f"{username}_{email}"
        correct_otp = cache.get(cache_key)
        if otp_user != correct_otp:
            failed = True
            context["message"] = {
            "class": "alert alert-danger alert-dismissible",
            "text": _("Sorry, OTP is incorrect...")
            }
        else:
            cache_key = f"{username}_{email}"
            cache.delete(cache_key)

    if failed:
        return render(request, "a2note/register.html", context)

    #Getting IP address of the user to register the consent
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        ip_address = x_forwarded_for.split(',')[-1].strip()
    else:
        ip_address = request.META.get('REMOTE_ADDR')

    #...user registration TO-DO
    new_user = User.objects.create_user(username=username, email=email, password=psw0)
    try:
        additional_info = AdditionalInfo(user=new_user, consent_ip=ip_address)
        additional_info.save()
    except:
        pass

    #Last check and auto login of the new user
    user = authenticate(username=username, password=psw0)
    if user:
        login(request, user)

    return redirect('index_view')


def login_view(request):
    return render(request, "a2note/login.html")


@login_required
def my_account_view(request):
    #Get user information
    user = request.user

    #Get all lists created by the current user
    cache_key = user.username + "_LISTS"
    created_lists = cache.get(cache_key)
    if not created_lists:
        created_lists = select_lists_by_author(user.username)
        cache.set(cache_key, created_lists)

    shop_num, todo_num = 0,0
    for l in created_lists:
        if l["element_type"] == "SHOPLIST":
            shop_num += 1
        elif l["element_type"] == "TODOLIST":
            todo_num += 1
        else:
            pass

    context = {
        "shopping_lists": shop_num,
        "todo_lists": todo_num
    }

    return render(request, "a2note/my_account.html", context)

@login_required
def psw_change_view(request):
    user = request.user

    old_psw = request.POST["psw_old"]
    new_psw1 = request.POST["psw_new1"]
    new_psw2 = request.POST["psw_new2"]

    response = {}

    if old_psw.strip() == "" or new_psw1.strip() == "" or new_psw2.strip() == "":
        response["message"] = {
        "class": "alert alert-danger alert-dismissible",
        "text": _("Please, enter all fields")
        }
        response["RESULT"] = "ERROR"
        return JsonResponse(response)

    # CHECK 1
    if new_psw1 != new_psw2:
        response["message"] = {
        "class": "alert alert-danger alert-dismissible",
        "text": _("Sorry, the passwords you entered do not match...")
        }
        response["RESULT"] = "ERROR"
        return JsonResponse(response)

    # CHECK 2
    user_obj = User.objects.get(username=user.username)
    if not user_obj.check_password(old_psw):
        response["message"] = {
        "class": "alert alert-danger alert-dismissible",
        "text": _("Old password is incorrect...")
        }
        response["RESULT"] = "ERROR"
        return JsonResponse(response)

    # All checks cleared...updateing user's password
    user_obj.set_password(new_psw1)
    user_obj.save()

    #Updating session hash to keep user logged in after password change
    update_session_auth_hash(request, user_obj)

    response["message"] = {
    "class": "alert alert-success alert-dismissible",
    "text": _("Password changed successfully")
    }
    response["RESULT"] = "OK"
    return JsonResponse(response)

@login_required
def dashboard_view(request):
    #Get user information
    user = request.user

    #Get all lists created by the current user
    #Get all lists created by the current user
    cache_key = user.username + "_LISTS"
    created_lists = cache.get(cache_key)
    if not created_lists:
        created_lists = select_lists_by_author(user.username)

    total_tasks, total_items = 0,0
    total_done, total_todo = 0,0
    todolists_ctr, shoplists_ctr = 0,0

    #Number of lists created for each weekday
    todolists_per_weekday = [0 for i in range(7)]
    shoplists_per_weekday = [0 for i in range(7)]

    #For loop to get lists data and to make some "math" :)
    for l in created_lists:
        length = len(l["items"])
        creation_date = datetime.strptime(l["creation_timestamp"], "%Y-%m-%d h.%H:%M:%S.%f")
        if l["element_type"] == "SHOPLIST":
            shoplists_ctr += 1
            total_items += length
            shoplists_per_weekday[creation_date.weekday()] += 1
        elif l["element_type"] == "TODOLIST":
            todolists_ctr += 1
            total_tasks += length
            todolists_per_weekday[creation_date.weekday()] += 1
            for t in l["items"]:
                if l["items"][t]["status"] == "Done":
                    total_done += 1
                else:
                    total_todo +=1
        else:
            pass

    context = {
        "total": len(created_lists),
        "todolists_total": todolists_ctr,
        "shoplists_total": shoplists_ctr,
        "total_tasks": total_tasks,
        "tasks_done": total_done,
        "tasks_todo": total_todo,
        "total_items": total_items
        }

    #Passing plots data to the webpage to build chart.js plots

    if todolists_ctr > 0 or shoplists_ctr > 0:
        context["type_donut_plot"] = {
        "values": [todolists_ctr, shoplists_ctr],
        "labels": ["To-do lists", "Shopping lists"],
        "colors": ["blue", 'rgb(221, 226, 16)']
        }

    if total_done > 0 or total_todo > 0:
        context["task_donut_plot"] = {
        "values": [total_done, total_todo],
        "labels": [gettext("Done"), gettext("To do")],
        "colors": ["rgb(12, 205, 37)", "grey"]
        }

    if todolists_ctr > 0:
        context["todo_weekday_plot"] = {
        "values": todolists_per_weekday,
        "labels": [gettext("Mon"),gettext("Tue"),gettext("Wed"),gettext("Thu"),gettext("Fri"),gettext("Sat"),gettext("Sun")],
        "colors": ["blue" for i in range(7)]
        }

    if shoplists_ctr > 0:
        context["shop_weekday_plot"] = {
        "values": shoplists_per_weekday,
        "labels": [gettext("Mon"),gettext("Tue"),gettext("Wed"),gettext("Thu"),gettext("Fri"),gettext("Sat"),gettext("Sun")],
        "colors": ["rgb(221, 226, 16)" for i in range(7)]
        }

    context["total"] = len(created_lists)

    return render(request, "a2note/my_dashboard.html", context)

@login_required
def bulletin_view(request):
    #User data
    user = request.user
    username = user.username

    context = {}

    bulletin_id = f"{username}_BULLETIN"
    bulletin_board = cache.get(bulletin_id)

    if bulletin_board:
        context["bulletin_content"] = bulletin_board["bulletin_content"]
        context["bulletin_class"] = bulletin_board["bulletin_class"]
    else:
        bulletin_board = select_element_by_id(bulletin_id, "BULLETIN")
        if len(bulletin_board) > 0:
            bulletin_board = bulletin_board[0]
            context["bulletin_content"] = bulletin_board["bulletin_content"]
            context["bulletin_class"] = bulletin_board["bulletin_class"]

            cache.set(bulletin_id, bulletin_board)


    return render(request, "a2note/bulletin.html", context)

@login_required
def save_bulletin_view(request):
    """
    This view saves data about the user bulletin board in the DB
    """
    #User data
    user = request.user
    username = user.username

    #Bulletin data
    bulletin_content = request.POST["bulletin_content"]
    bulletin_class = request.POST["bulletin_class"]
    element_type = "BULLETIN"
    element_id = f"{username}_BULLETIN"

    bulletin_content = bulletin_content.strip()

    #List data
    item = {
        'element_type': element_type,
        'element_id': element_id,
        'bulletin_content': bulletin_content,
        'bulletin_class': bulletin_class
    }

    insert_item(item)

    item = cache.set(element_id, item)
    print(f"|{bulletin_content}|")

    response = {"RESULT": "OK",
                "bulletin_content": bulletin_content,
                "bulletin_class": bulletin_class
                }

    return JsonResponse(response)

def todolist(request):
    """
    Creation of a to-do list for an unauthenticated user
    """
    return render(request, "a2note/todolist.html")

def shoplist(request):
    """
    Creation of a shopping list for an unauthenticated user
    """
    return render(request, "a2note/shoplist.html")


@login_required
def create_list_view(request):
    """
    Creates a new list
    """
    element_type = request.POST["element_type"]

    if element_type not in ("TODOLIST", "SHOPLIST"):
        pass

    item = {
    "element_type": element_type,
    "author": request.user.username,
    "shared": "False",
    "edit_enabled": "False",
    "title": "",
    "items": {}
    }

    new_list = insert_item(item)

    response = {"element_id": new_list["element_id"]}

    # Clear cached lists for the user
    cache_key = new_list["author"] + "_LISTS"
    cache.delete(cache_key)

    return JsonResponse(response)


def list_editor(request, listUID):
    """
    This is the list editor.
    Here a user (if it has privileges) can edit a list by adding items or
    deleting them.
    Only the list author can change the privacy settings for the list or delete the list.
    """
    #Choose the correct type of list
    if listUID[:2] == "SL":
        list_type = "SHOPLIST"
    else:
        list_type = "TODOLIST"

    cache_key = list_type + listUID
    item = cache.get(cache_key)
    if not item:
        #Select from table the list to access data
        item = select_element_by_id(listUID, list_type)
        if len(item) > 0:
            item = item[0]
        else:
            #Return error page with message
            return error_view(request, _("Ooops! That's awkward..."))
        cache.set(cache_key, item)

    view_granted, edit_granted = False, False

    #CHECK if user can access the current list
    if request.user.is_authenticated:
        user = request.user
        username = user.username
    else:
        username = ""

    # CONDITION 1 - The user is the author of the current list
    if username == item["author"]:
        view_granted = True
        edit_granted = True
    else:
        # CONDITION 2 - The user is not the author, but the list is shared
        if "shared" in item:
            view_granted = item["shared"] == "True"
        if "edit_enabled" in item:
            edit_granted = item["edit_enabled"] == "True"

    if not edit_granted:
        if view_granted:
            return list_viewer(request, item["element_id"])
        else:
            #Render an error page with a message
            return error_view(request, _("This is not the list you were looking for..."))

    context = item

    if list_type == "SHOPLIST":
        return render(request, "a2note/shoplist_editor.html", context)
    else:
        return render(request, "a2note/todolist_editor.html", context)

def list_viewer(request, listUID):
    """
    This is the list viewer.
    This page presents the lists and all of it's content (if the user has privilege to see it).
    No modification can be made or saved to the list itself.
    """
    if listUID[:2] == "SL":
        element_type = "SHOPLIST"
    else:
        element_type = "TODOLIST"

    cache_key = element_type + listUID
    item = cache.get(cache_key)
    if not item:
        #Select from table the list to access data
        item = select_element_by_id(listUID, element_type)
        if len(item) > 0:
            item = item[0]
        else:
            #Return error page with message
            return error_view(request, _("Ooops! That's awkward..."))
        cache.set(cache_key, item)

    #CHECK if the user can see the list
    view_granted = False
    if request.user.is_authenticated:
        user = request.user
        username = user.username
    else:
        username = ""

    if username == item["author"]:
        view_granted = True
    else:
        if "shared" in item:
            view_granted = item["shared"] == "True"

    if not view_granted:
        #Render an error page with a message
        return error_view(request, _("Sorry, nothing to see here..."))

    context = item

    if element_type == "SHOPLIST":
        return render(request, "a2note/shoplist_viewer.html", context)
    else:
        return render(request, "a2note/todolist_viewer.html", context)


def product_list_view(request):
    """
    This view returns data about all the product in the database to make the auto fill
    function work
    """
    #Checking if the products are already present in the cache
    product_list = cache.get("PRODUCTS")
    if not product_list:
        product_list = select_elements_by_type('PRODUCT')
        cache.set("PRODUCTS", product_list, 60 * 60 * 24) #Value is cached for 24h

    response = {}
    for p in product_list:
        if  request.LANGUAGE_CODE == 'it':
            name = p['IT_name']
        else:
            name = p['EN_name']
        response[name] = p['element_category']

    return JsonResponse(response)

def save_list_view(request):
    """
    This view saves data about a list in the DB
    """

    if request.user.is_authenticated:
        user = request.user
        username = user.username
    else:
        username = ""

    element_id = request.POST["element_id"]
    element_type = request.POST["element_type"]
    title = request.POST["title"]
    items = request.POST["items"]
    items = json.loads(items)
    shared = request.POST["shared"]
    edit_enabled = request.POST["edit_enabled"]

    if title == "":
        title = element_type + "_" + element_id

    response = {}

    list_data = select_element_by_id(element_id, element_type)
    if len(list_data) > 0:
        list_data = list_data[0]
    else:
        response = {
            "STATUS": "ERROR",
            "DESCRIPTION": "Non existent list"
        }
        return JsonResponse(response)

    author = list_data["author"]

    # CHECKS BEFORE LIST MODIFICATION
    access_granted = False
    edit_granted = False

    #Check access privilege
    if username == list_data['author']:
        access_granted, edit_granted = True, True
    else:
        #If the user is not the author of the list, the shared and edit_enabled values
        # are taken from the database
        shared = list_data["shared"]
        edit_enabled = list_data["edit_enabled"]

        if list_data["shared"] == "True":
            access_granted = True

        if "edit_enabled" in list_data:
            if list_data["edit_enabled"] == "True" and access_granted:
                edit_granted = True

    if not edit_granted:
        return {
            "RESULT": "ERROR",
            "DESCRIPTION": _("You do not have edit privilege on this list.")
        }

    #List data
    item = {
        'element_type': element_type,
        'element_id': element_id,
        'title': title,
        'author': author,
        'items': items,
        'shared': shared,
        'edit_enabled': edit_enabled,
        'creation_timestamp': list_data["creation_timestamp"]
    }

    insert_item(item)

    #delete cached lists for the list author
    cache_key = list_data["author"] + "_LISTS"
    cache_key2 = element_type + element_id
    cache.delete(cache_key)
    cache.delete(cache_key2)

    response = {
        'STATUS': 'OK'
    }

    return JsonResponse(response)

@login_required
def delete_list(request):
    """
    Deletion of a list
    Allowed only if the user is logged in and is the author of the list.
    """
    element_type = request.POST.get("element_type")
    element_id = request.POST.get("element_id")

    old_list = select_element_by_id(element_id, element_type)
    if len(old_list) > 0:
        old_list = old_list[0]

    #CHECK if the user is the author of the list
    if request.user.username != old_list["author"]:
        response = {"RESULT": "ERROR",
        "DESCRIPTION": "Only the author of the list can delete it."}

        return JsonResponse(response)

    delete_item(element_type, element_id)

    #delete cached lists for the list author
    cache_key = old_list["author"] + "_LISTS"
    cache_key2 = element_type + element_id
    cache.delete(cache_key)
    cache.delete(cache_key2)

    response = {"RESULT": "OK"}
    return JsonResponse(response)

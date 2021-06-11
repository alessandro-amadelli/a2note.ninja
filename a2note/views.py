"""
All the views rendered by a2note_ninja

Author: Ama
"""

from django.shortcuts import render, redirect
from django.http import JsonResponse

from django.contrib.auth.models import User
from a2note.models import AdditionalInfo
from django.contrib.auth import authenticate, login
from django.contrib.auth.decorators import login_required

#translation
from django.utils.translation import gettext
from django.utils.translation import gettext_lazy as _
from django.utils.translation import activate, get_language

from a2note.dynamoDB_ops import *

import json
from datetime import datetime

from a2note.plot_maker import make_donut, make_bar

def index(request):
    if request.user.is_authenticated:
        #Get user information
        user = request.user

        total, todolists_ctr, shoplists_ctr = 0,0,0
        #Get all lists created by the current user
        created_lists = select_lists_by_author(user.username)

        lists = []

        for l in created_lists:
            length = len(l["items"])
            creation_date = datetime.strptime(l["creation_timestamp"], "%Y-%m-%d h.%H:%M:%S.%f")
            list_obj = {
                "element_id": l["element_id"],
                "element_type": l["element_type"],
                "creation_timestamp": creation_date.strftime("%Y-%m-%d h.%H:%M:%S"),
                "length": length
            }
            lists.append(list_obj)
            if l["element_type"] == "SHOPLIST":
                shoplists_ctr += 1
            elif l["element_type"] == "TODOLIST":
                todolists_ctr += 1
            else:
                pass

        total = len(lists)

        context = {
            "lists": lists,
            "total": total,
            "todolists": todolists_ctr,
            "shoplists": shoplists_ctr
        }

        return render(request, "a2note/index.html", context)

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
    additional_info.save()

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
    created_lists = select_lists_by_author(user.username)

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
def dashboard_view(request):
    #Get user information
    user = request.user

    #Get all lists created by the current user
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

    context = {"total": len(created_lists),
        "todolists_total": todolists_ctr,
        "shoplists_total": shoplists_ctr,
        "total_tasks": total_tasks,
        "tasks_done": total_done,
        "tasks_todo": total_todo,
        "total_items": total_items
        }

    if todolists_ctr > 0 or shoplists_ctr > 0:
        type_donut_plot = make_donut(values=[todolists_ctr, shoplists_ctr], labels=["To-do lists", "Shopping lists"],
        center_text=len(created_lists))
        context["type_donut_plot"] = type_donut_plot

    if total_done > 0 or total_todo > 0:
        task_donut_plot = make_donut(values=[total_done, total_todo], labels=["Done", "To do"], colors=["green", "grey"])
        context["task_donut_plot"] = task_donut_plot

    if todolists_ctr > 0:
        todo_weekday_plot = make_bar(values=todolists_per_weekday, labels=[gettext("Mon"),gettext("Tue"),gettext("Wed"),gettext("Thu"),gettext("Fri"),gettext("Sat"),gettext("Sun")])
        context["todo_weekday_plot"] = todo_weekday_plot

    if shoplists_ctr > 0:
        shop_weekday_plot = make_bar(values=shoplists_per_weekday, labels=[gettext("Mon"),gettext("Tue"),gettext("Wed"),gettext("Thu"),gettext("Fri"),gettext("Sat"),gettext("Sun")])
        context["shop_weekday_plot"] = shop_weekday_plot

    context["total"] = len(created_lists)

    return render(request, "a2note/my_dashboard.html", context)


def todolist(request):

    return render(request, "a2note/todolist.html")

@login_required
def new_todolist_view(request):
    #User data
    user = request.user

    #Creation of the new shopping list with essential data
    item = {
    "element_type": "TODOLIST",
    "author": user.username
    }

    new_todolist = insert_item(item)

    #Return of the newly created shopping list's id to the page and a creation message
    element_id = new_todolist["element_id"]
    context = {
    "element_id": element_id,
    "message": {
            "class": "alert alert-success alert-dismissible",
            "text": _("New to-do list created")
        }
    }

    return render(request, "a2note/todolist.html", context)


def shoplist(request):

    return render(request, "a2note/shoplist.html")

@login_required
def new_shoplist_view(request):
    #User data
    user = request.user

    #Creation of the new shopping list with essential data
    item = {
    "element_type": "SHOPLIST",
    "author": user.username
    }

    new_shoplist = insert_item(item)

    #Return of the newly created shopping list's id to the page and a creation message
    element_id = new_shoplist["element_id"]
    context = {
    "element_id": element_id,
    "message": {
            "class": "alert alert-success alert-dismissible",
            "text": _("New shopping list created")
        }
    }

    #return render(request, "a2note/shoplist.html", context)
    return list_editor(request, element_id)


def list_editor(request, listUID):
    #Choose the correct type of list
    if listUID[:2] == "SL":
        list_type = "SHOPLIST"
    else:
        list_type = "TODOLIST"

    #Select from table the list to access data
    item = select_element_by_id(listUID, list_type)
    if len(item) > 0:
        item = item[0]
    else:
        #Return error page with message
        pass

    access_granted = False

    #CHECK if user can access the current list
    if request.user.is_authenticated:
        user = request.user
        username = user.username
    else:
        username = ""

    # CONDITION 1 - The user is the author of the current list
    if username == item["author"]:
        access_granted = True
    else:
        # CONDITION 2 - The user is not the author, but the list is shared
        if "shared" in item:
            if item["shared"] == "True":
                access_granted = True

    if not access_granted:
        #Render an error page with a message
        pass

    context = item

    if list_type == "SHOPLIST":
        return render(request, "a2note/shoplist_editor.html", context)
    else:
        return render(request, "a2note/todolist_editor.html", context)


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
    items = request.POST["items"]
    items = json.loads(items)
    print(items)
    shared = request.POST["shared"]
    edit_enabled = request.POST["edit_enabled"]

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
        if "shared" in list_data:
            if list_data["shared"] == "True":
                access_granted = True
        if "edit_enabled" in list_data:
            if list_data["edit_enabled"] == "True" and access_granted:
                edit_granted = True

    #List data
    item = {
        'element_type': element_type,
        'element_id': element_id,
        'author': author,
        'items': items,
        'shared': shared,
        'edit_enabled': edit_enabled,
        'creation_timestamp': list_data["creation_timestamp"]
    }

    insert_item(item)

    response = {
        'STATUS': 'OK'
    }

    return JsonResponse(response)

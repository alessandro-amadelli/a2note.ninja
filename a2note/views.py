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
from django.contrib.admin.views.decorators import staff_member_required

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
import numpy as np

import socket

#Caching
from django.core.cache import cache

def get_fulfilled_achievements(username):
    """
    The function gets the user's medal table (achievement already fulfilled by the user) with
    a cache-first logic.
    """
    #Retrieve the achievements already fulfilled by the user (cache-first)
    cache_key = f"{username}_MEDAL_TABLE"
    user_fulfilled = cache.get(cache_key)

    if not user_fulfilled:
        user_medal_table = select_element_by_id(f"{username}_medal_table", "MEDAL_TABLE")
        if len(user_medal_table) > 0:
            user_fulfilled = user_medal_table[0]["achievements"]
        else:
            user_fulfilled = []

    return user_fulfilled

def assign_achievements_to_user(username, achievements=[]):
    """
    The function receives a list containing achievement ids.
    The function:
        0: Gets the user's medal_table (already fulfilled achievements)
        1: For each achievement in achievements
            a: checks if the id is already present in the user's medal table
            b: if not, append the achievement to the user's medal table
        2: If a change was made -> update cache and database
    """
    if len(achievements) == 0:
        return

    user_fulfilled = get_fulfilled_achievements(username)
    updated = False

    for achievement_id in achievements:
        if achievement_id not in user_fulfilled:
            user_fulfilled.append(achievement_id)
            updated = True

    if updated:
        #Remove possible duplicates
        user_fulfilled = list(set(user_fulfilled))

        #Update cache value and database record
        cache_key = f"{username}_MEDAL_TABLE"
        cache.set(cache_key, user_fulfilled)
        item = {
            "element_type": "MEDAL_TABLE",
            "element_id": f"{username}_medal_table",
            "achievements": user_fulfilled
        }
        insert_item(item)

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

    #Checking if the user is authenticade to assign the achievement#8
    if request.user.is_authenticated:
        username = request.user.username
        assign_achievements_to_user(username, ["achievement#8"])

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

def open_shared(request):

    return render(request, "a2note/open_shared.html")

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

def forgot_password_view(request):
    return render(request, "a2note/reset_password.html")

def check_fulfilled_achievements(achievement_list, username):
    user_fulfilled = get_fulfilled_achievements(username)

    if len(user_fulfilled) == len(achievement_list):
        return user_fulfilled

    #Checking fulfillment of other achievements

    #Check achievement#1 'Hello, world' - Assigned by default bacause user is registered
    if 'achievement#1' not in user_fulfilled:
        user_fulfilled.append('achievement#1')

    #achievement#2  -> see save_list_view()
    #achievement#3  -> see create_list_view()
    #achievement#4  -> see create_list_view()
    #achievement#5  -> see dashboard_view()
    #achievement#6  -> see theme_changed()
    #achievement#7  -> see delete_list()
    #achievement#8  -> see error_view()
    #achievement#9  -> see dashboard_view()
    #achievement#11 -> see save_bulletin_view()
    #achievement#15 -> see psw_change_view()
    #achievement#19 -> see deletion_canceled()

    #Checking list related achievement completion
    cache_key = username + "_LISTS"
    created_lists = cache.get(cache_key)
    if not created_lists:
        created_lists = select_lists_by_author(username)
        cache.set(cache_key, created_lists)

    shop_num, todo_num = 0,0
    task_num, done_task_num = 0,0
    older_list_date = 0
    today = datetime.now()
    for l in created_lists:
        if l["element_type"] == "SHOPLIST":
            shop_num += 1
            creation_date = datetime.strptime(l["creation_timestamp"], "%Y-%m-%d h.%H:%M:%S.%f")
            if older_list_date == 0 or creation_date < older_list_date:
                older_list_date = creation_date
            item_num = 0
            fruit_veg_num, alcohol_num, clean_hygiene_num = 0,0,0
            for i in l["items"]:
                item_quantity = int(l["items"][i]["quantity"])
                item_num += item_quantity
                if l["items"][i]["category"] in ("fruit", "vegetable"):
                    fruit_veg_num += item_quantity
                elif l["items"][i]["category"] == "alcohol":
                    alcohol_num += item_quantity
                elif l["items"][i]["category"] in ("cleaning", "hygiene"):
                    clean_hygiene_num += item_quantity
            #achievement#12 'Healthy'
            if item_num > 10 and ((fruit_veg_num * 100) / item_quantity) > 70:
                user_fulfilled.append("achievement#12")
            #achievement#16 "Flammable"
            if item_num > 10 and ((alcohol_num * 100) / item_quantity) > 70:
                user_fulfilled.append("achievement#16")
            #achievement#17 "Germ killer"
            if item_num > 10 and ((clean_hygiene_num * 100) / item_quantity) > 70:
                user_fulfilled.append("achievement#17")
        elif l["element_type"] == "TODOLIST":
            todo_num += 1
            task_num += len(l["items"].keys())
            for t in l["items"]:
                if l["items"][t]["status"] == "Done":
                    done_task_num += 1

        #achievement#10 "Reliable"
        if done_task_num >= 10:
            user_fulfilled.append("achievement#10")

        #achievement#13 "Milk is expired!"
        from datetime import timedelta
        target_date = (today - timedelta(weeks=24)).strftime("%Y%m%d")
        if older_list_date.strftime("%Y%m%d") <= target_date:
            user_fulfilled.append("achievement#13")

        #achievemnt#14 'Happy birthday!!!'
        if "achievement#14" not in user_fulfilled:
            target_date = (today - timedelta(days=365)).strftime("%Y%m%d")
            user = User.objects.get(username=username)
            registration_date = user.date_joined
            registration_date = registration_date.strftime("%Y%m%d")
            if registration_date <= target_date:
                user_fulfilled.append("achievement#14")

        #achievement#18 "Task manager"
        if task_num >= 100:
            user_fulfilled.append("achievement#18")

    #Removing possible duplicates before checking for the legendary achievement
    user_fulfilled = list(set(user_fulfilled))

    #achievement#20 'Legendary'
    if len(user_fulfilled) == (len(achievement_list) - 1):
        user_fulfilled.append("achievement#20")

    assign_achievements_to_user(username, user_fulfilled)

    return user_fulfilled

@login_required
def my_account_view(request):
    #Get user information
    user = request.user

    #Get all lists created by the current user (cache-first)
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

    #Get the list of all existing achievements (cache-first)
    cache_key = "ACHIEVEMENT_LIST"
    achievement_list = cache.get(cache_key)
    if not achievement_list:
        achievement_list = select_elements_by_type("ACHIEVEMENT")
        cache.set(cache_key, achievement_list, 60 * 60 * 24) #TTL = 24h

    #Checks if the user fulfilled other achievements (and gets fulfilled achievements list)
    user_fulfilled = check_fulfilled_achievements([a['element_id'] for a in achievement_list], user.username)

    #sort achievement list by achievement number
    achievement_list_eng = sorted(achievement_list, key=lambda d: int(d["element_id"].split("#")[1]))

    #For each achievement, update information
    achievement_list = []
    for achievement in achievement_list_eng:
        ach_name = ""
        if request.LANGUAGE_CODE == 'it':
            if achievement["IT_name"] != "":
                ach_name = achievement["IT_name"]
            else:
                ach_name = achievement["EN_name"]
            ach_description = achievement["IT_description"]
        else:
            ach_name = achievement["EN_name"]
            ach_description = achievement["EN_description"]
        ach_name = "#" + achievement["element_id"].split("#")[1] + " " + ach_name

        fulfilled = ""
        if achievement["element_id"] in user_fulfilled:
            fulfilled = "fulfilled-achievement"

        achievement_list.append({
            "name": ach_name,
            "description": ach_description,
            "fulfilled": fulfilled
        })

    context = {
        "shopping_lists": shop_num,
        "todo_lists": todo_num,
        "achievement_list": achievement_list,
        "total_achievements": len(achievement_list),
        "fulfilled_achievements": len(user_fulfilled)
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

    # CHECK 1 - The 2 new password entered must match
    if new_psw1 != new_psw2:
        response["message"] = {
        "class": "alert alert-danger alert-dismissible",
        "text": _("Sorry, the passwords you entered do not match...")
        }
        response["RESULT"] = "ERROR"
        return JsonResponse(response)

    # CHECK 2 - The old password entered have to be correct
    user_obj = User.objects.get(username=user.username)
    if not user_obj.check_password(old_psw):
        response["message"] = {
        "class": "alert alert-danger alert-dismissible",
        "text": _("Old password is incorrect...")
        }
        response["RESULT"] = "ERROR"
        return JsonResponse(response)
    
    # CHECK 3 - New password must be different from old password
    if old_psw == new_psw1:
        response["message"] = {
        "class": "alert alert-danger alert-dismissible",
        "text": _("New password cannot be the same as the old one...")
        }
        response["RESULT"] = "ERROR"
        return JsonResponse(response)

    # All checks cleared...updating user's password
    user_obj.set_password(new_psw1)
    user_obj.save()

    #Updating session hash to keep user logged in after password change
    update_session_auth_hash(request, user_obj)

    #Assign achievement#15 to the user
    username = user.username
    assign_achievements_to_user(username, ["achievement#15"])

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

    username = user.username
    #Assign the achievement#5 to the user for checking the dashboard
    new_achievements = ["achievement#5"]

    #Check and assign achievement#9
    if sum([todolists_per_weekday[i] > 0 or shoplists_per_weekday[i] > 0 for i in range(len(shoplists_per_weekday))]) == 7:
        new_achievements.append("achievement#9")

    assign_achievements_to_user(username, new_achievements)

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

    response = {"RESULT": "OK",
                "bulletin_content": bulletin_content,
                "bulletin_class": bulletin_class
                }

    #Assign achievement#11 to the user
    assign_achievements_to_user(username, ["achievement#11"])

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

    item = {
    "element_type": element_type,
    "author": request.user.username,
    "shared": "False",
    "edit_enabled": "False",
    "title": "",
    "items": {}
    }

    new_list = insert_item(item)

    #Check and assign achievemnts for first lists
    new_achievements = []
    #achievement#3 'Shopping rookie'
    if element_type == "SHOPLIST":
        new_achievements.append("achievement#3")
    #achievement#4 'Task rookie'
    if element_type == "TODOLIST":
        new_achievements.append("achievement#4")

    if len(new_achievements) > 0:
        assign_achievements_to_user(request.user.username, new_achievements)

    response = {"element_id": new_list["element_id"]}

    # Clear cached lists for the user
    cache_key = new_list["author"] + "_LISTS"
    cache.delete(cache_key)

    return JsonResponse(response)

def update_history(username, element_id, author, title):
    cache_key = f"{username}_HISTORY"
    hist_key = f"HS_{username}"

    old_hist = cache.get(cache_key)
    if not old_hist:
        old_hist = select_element_by_id(hist_key, "HISTORY")
        if len(old_hist) > 0:
            old_hist = old_hist[0]
            old_hist = old_hist["content"]

    #For loop to:
    #  -Check if element is already present in history (and in case update timestamp of last open)
    #  -Check if the list is still present in the list's author cache
    found = False
    i = 0
    new_hist = []
    for e in old_hist:
        #If element is already present in history
        if old_hist[i]['element_id'] == element_id:
            old_hist[i]['title'] = title
            old_hist[i]['last_opened'] = datetime.now().strftime("%Y-%m-%d h.%H:%M:%S")
            found = True
        author_list_cache = old_hist[i]['author'] + "_LISTS"
        author_list = cache.get(author_list_cache)

        #If still present in the author's cache, then it is written in the new_hist
        if author_list:
            id_list = [k['element_id'] for k in author_list]
            if old_hist[i]['element_id'] in id_list:
                new_hist.append(e)
        else:
            new_hist.append(e)
        i += 1

    #If it is a new entry, then append
    if not found:
        #New history entry
        visited_list = {
        "element_id": element_id,
        "title": title,
        "author": author,
        "last_opened": datetime.now().strftime("%Y-%m-%d h.%H:%M:%S")
        }
        #If list already has 20 elements, then the last one is removed prior adding the new one
        if len(new_hist) > 19:
            new_hist.pop(-1)
        new_hist.append(visited_list)

    #Reorder list based on last access
    new_hist = sorted(new_hist, key=lambda k: k['last_opened'], reverse=True)

    #Updating cache value for the user history
    cache.set(cache_key, new_hist)

    #Check if the database is recently updated
    already_updated = cache.get(cache_key + "_UPDATED")
    if not already_updated:
        new_item = {
            "element_id": hist_key,
            "element_type": "HISTORY",
            "content": old_hist
        }
        insert_item(new_item)
        cache.set(cache_key + "_UPDATED", True, 2) #Cache key with TTL=2s to avoid consecutive updates on DB

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

    if username != "":
        update_history(username, listUID, item["author"], item["title"])

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

    if username != "":
        update_history(username, listUID, item["author"], item["title"])

    if element_type == "SHOPLIST":
        return render(request, "a2note/shoplist_viewer.html", context)
    else:
        return render(request, "a2note/todolist_viewer.html", context)

def get_all_products():
    #Checking if the products are already present in the cache
    product_list = cache.get("PRODUCTS")
    if not product_list:
        product_list = select_elements_by_type('PRODUCT')
        cache.set("PRODUCTS", product_list, 60 * 60 * 24) #Value is cached for 24h
    
    return product_list


def product_list_view(request):
    """
    This view returns data about all the product in the database to make the auto fill
    function work
    """
    #Checking if the products are already present in the cache
    product_list = get_all_products()

    response = {}
    for p in product_list:
        if  request.LANGUAGE_CODE == 'it':
            name = p['IT_name']
        else:
            name = p['EN_name']
        response[name] = p['element_category']

    return JsonResponse(response)

@login_required
def random_list_view(request):
    """
    This view returns a random generated shopping-list by taking a dictionary containing parameters:
      _list_length: the desired number of elements in the list
      _categories: each one of the categories to be included in the list with it's weight (likelyhood to be included in the list)
    """
    #Dictionary containing the desired parameters
    parameters = json.loads(request.POST["parameters"])
    print(parameters)

    #Obtaining list with all the products
    product_list = get_all_products()

    #Desired length of the list
    try:
        list_length = parameters['list_length']
    except:
        list_length = 10 #default value for list_length

    
    #print(product_list)

    if len(parameters.keys()) < 2:
        #Check if list_length exceeds the length of the data set
        if list_length > len(product_list):
            list_length = len(product_list)
        #list with randomly selected products in case the user didn't specify any category
        selected_list = np.random.choice(a=product_list, size=list_length, replace=False)
    else:
        #Parameters for the numpy function
        a = [] #array with the elements to choose from
        p = [] #array with the probability of each element

        #Sum of the total weight for the categories in the parameters
        total_sum = sum([parameters[k] for k in parameters.keys() if k != 'list_length'])

        for c in [k for k in parameters.keys() if k != 'list_length']:
            #Value for the probability of a specific product to be included in the list, based upon the category
            probability = ((parameters[c] * 100) / total_sum) / 100
            #All products belonging to the current category
            cat_list = [e for e in product_list if e['element_category'] == c]
            a = a + cat_list
            for i in range(len(cat_list)):
                p.append(probability/len(cat_list))
        #Check if list_length exceeds the length of the data set
        if list_length > len(a):
            list_length = len(a)
        #list with randomly selected products
        selected_list = np.random.choice(a=a, size=list_length, replace=False, p=p)

    response = {}

    for p in selected_list:
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

    if element_type == "SHOPLIST":
        modifications = request.POST["modifications"]
        modifications = json.loads(modifications)
    else:
        items = request.POST["items"]
        items = json.loads(items)

    shared = request.POST["shared"]
    edit_enabled = request.POST["edit_enabled"]

    if title == "":
        title = element_type + "_" + element_id

    response = {}

    list_data = cache.get(element_type + element_id)
    if not list_data:
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
        #assign achievement#2 'Connected' if the list is shared
        if list_data["shared"] == "True":
            assign_achievements_to_user(username, ["achievement#2"])
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

    if element_type == "SHOPLIST":
        #Applying modification to the items variable
        items = list_data["items"]
        for a in modifications["add"].keys():
            items[a] = modifications["add"][a]

        for m in modifications["mod"].keys():
            items[m] = modifications["mod"][m]

        for d in modifications["del"].keys():
            items.pop(d, None)

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
def list_history_view(request):
    """
    The function retrieves the user's history data, insert them in the context
    and pass them to the template.
    History DB structure: history is a list with the following structure
    [
        {
            element_id: UID of the visited list,
            title: title of the visited list,
            author: list author,
            last_opened: last time the list was opened by the user (timestamp)
        },
        ...
    ]
    """

    user = request.user
    username = user.username

    cache_key = f"{username}_HISTORY"
    list_history = cache.get(cache_key)
    if not list_history:
        #Select user's history data from DB
        list_history = select_element_by_id(f"HS_{username}", "HISTORY")
        if len(list_history) > 0:
            list_history = list_history[0]
            list_history = list_history["content"]
            # list_history = sorted(item, key=lambda k: k['last_opened'], reverse=True)
        else:
            list_history = ""
        cache.set(cache_key, list_history)

    context = {}

    if list_history != "":
        context["list_history"] = list_history

    return render(request, 'a2note/history.html', context)

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

    #Assign to the user the achievement#7 for the list deletion
    username = request.user.username
    assign_achievements_to_user(username, ["achievement#7"])

    response = {"RESULT": "OK"}
    return JsonResponse(response)

def send_reset_email(email_address, username, otp):
    email_subj = "a2note.ninja - Password reset OTP"

    email_content = _("Hi") + f" <strong>{username}!</strong><br>"
    email_content += _("Here's the code to confirm the password reset for your a2note.ninja account.") + "<br>"
    email_content += f"<strong style='font-size:3rem;'>{otp}</strong><br><br>"
    email_content += "a2note.ninja"

    try:
        send_email(email_address, email_subj, email_content)
    except Exception as e:
        response = {
        "RESULT": "ERROR",
        "DESCRIPTION": _("Something went wrong...try again later.")
        }
        return JsonResponse(response)

    response = {
    "RESULT": "OK"
    }
    return JsonResponse(response)

def send_reset_otp(request):
    """
    Receives user's request to send the otp for the password reset.
    The function checks if the email is associated with an existing user and:
      _If the email exists -> sends to the email an OTP to confirm the password reset.
      _If the email is nonexistent, no OTP is sent.
    For security reasons the function's response doesn't change between the 2 above mentioned cases.
    """
    email_address = request.POST.get("email_address")

    is_legit = True

    #Check if the email is valid
    try:
        validate_email(email_address)
    except:
        is_legit = False

    #Check if the email is associated with an existing user
    try:
        user = User.objects.get(email=email_address)
        username = user.username
    except User.DoesNotExist:
        is_legit = False

    #OTP is generated, saved in cache and sent via email
    if is_legit:
        otp = generate_OTP()
        cache_key = f"reset_OTP_{email_address}"
        cache.set(cache_key, otp, 60*5) #expires in 5 minutes

        #OTP is sent via email
        try:
            send_reset_email(email_address, username, otp)
        except:
            pass

    #In any case, the same response is sent back to the client
    response = {"RESULT": "OK"}
    return JsonResponse(response)

def reset_user_password(request):
    """
    Receives user's request for password reset and proceeds to check if the opt is correct.
    If the OTP is correct, then the password is reset.
    """
    email_address = request.POST.get("email_address")
    new_password = request.POST.get("new_password")
    otp = request.POST.get("otp")

    is_success = True

    #Check if the password is at least 8 characters long
    is_success = (len(new_password) >= 8)

    #Check if the email is valid
    if is_success:
        try:
            validate_email(email_address)
        except:
            is_success = False

    #Check if the OTP is generated, still valid and if it corresponds
    if is_success:
        cached_otp = cache.get(f"reset_OTP_{email_address}")
        if cached_otp:
            if otp != cached_otp:
                is_success = False
        else:
            is_success = False

    #Check if the user's email is correct and retrieve username
    if is_success:
        try:
            user = User.objects.get(email=email_address)
            username = user.username
        except User.DoesNotExist:
            is_success = False

    #Reset user's password
    if is_success:
        user.set_password(new_password)
        user.save()

        #Updating session hash to keep user logged in after password change
        login(request, user)
        response = {"RESULT": "OK"}
        return JsonResponse(response)

    response = {"RESULT": "ERROR"}
    return JsonResponse(response)

def theme_changed(request):
    """
    This view is created with the sole purpose of assigning the achievement
    for theme toggling.
    Yes, really...
    """
    if request.user.is_authenticated:
        username = request.user.username
        #Assigne achievement#6 for toggling the theme
        assign_achievements_to_user(username, ["achievement#6"])

    response = {"RESULT": "OK"}
    return JsonResponse(response)

def deletion_canceled(request):
    """
    This view is created with the sole purpose of assigning the achievement for
    the merciful users.
    (Go for delete a list and then "spare" the list's life)
    """
    if request.user.is_authenticated:
        username = request.user.username
        #Assign achievement#19 for canceling delete operation
        assign_achievements_to_user(username, ["achievement#19"])

    response = {"RESULT": "OK"}
    return JsonResponse(response)

@staff_member_required
def admin_view(request):
    context = {}

    user_list = User.objects.all().order_by("id")

    context["user_list"] = user_list

    return render(request, 'a2note/admin_page.html', context)

@staff_member_required
def admin_block_user(request):
    #If current user is not superuser, does nothing
    if not request.user.is_superuser:
        response = {
            "RESULT": "ERROR",
            "DESCRIPTION": "Not authorized."
        }
        return JsonResponse(response)
    
    admin_action = request.POST.get("admin_action")
    user_involved = request.POST.get("user_involved")

    #Boolean value to indicate if the user is to block or activate
    new_active_value = admin_action != "block_user"

    User.objects.filter(username=user_involved).update(is_active=new_active_value)

    response = {"RESULT": "OK"}
    return JsonResponse(response)


def offline(request):
    return render(request, "a2note/offline.html")

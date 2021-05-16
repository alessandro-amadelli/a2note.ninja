from django.shortcuts import render



def index(request):

    return render(request, "a2note/index.html")


def todolist(request):

    return render(request, "a2note/todolist.html")


def shoplist(request):

    return render(request, "a2note/shoplist.html")

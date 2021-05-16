from django.urls import path

from . import views

urlpatterns = [
    path("", views.index, name="index_view"),
    path("todolist", views.todolist, name="todolist_view"),
    path("shoplist", views.shoplist, name="shoplist_view"),
]

from django.urls import path

from . import views
from django.views.i18n import JavaScriptCatalog

urlpatterns = [
    path("", views.index, name="index_view"),
    path("register", views.register, name="register_view"),
    path("login", views.login, name="login_view"),
    path("todolist", views.todolist, name="todolist_view"),
    path("shoplist", views.shoplist, name="shoplist_view"),
    path("product_list_view", views.product_list_view, name="product_list_view"),
    path('jsi18n/', JavaScriptCatalog.as_view(), name='javascript-catalog'),
]

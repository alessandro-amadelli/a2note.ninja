from django.urls import path

from . import views
from django.contrib.auth import views as auth_views
from django.views.i18n import JavaScriptCatalog

from django.views.generic import TemplateView

urlpatterns = [
    path("", views.index, name="index_view"),
    path("about_us/", views.about_us, name="about_us"),
    path("register/", views.register, name="register_view"),
    path("send_otp/", views.send_otp, name="send_otp"),
    path("register_success/", views.register_success, name="register_success"),
    path("login/", auth_views.LoginView.as_view(template_name='a2note/login.html'), name="login_view"),
    path("logout/", auth_views.LogoutView.as_view(), name="logout"),
    path("my_account/", views.my_account_view, name="my_account_view"),
    path("psw_change_view/", views.psw_change_view, name="psw_change_view"),
    path("my_dashboard/", views.dashboard_view, name="dashboard_view"),
    path("bulletin_board/", views.bulletin_view, name="bulletin_view"),
    path("save_bulletin_view/", views.save_bulletin_view, name="save_bulletin_view"),
    path("todolist/", views.todolist, name="todolist_view"),
    path("create_list_view/", views.create_list_view, name="create_list_view"),
    path("shoplist/", views.shoplist, name="shoplist_view"),
    path("list_editor/<str:listUID>", views.list_editor, name="list_editor"),
    path("list_viewer/<str:listUID>", views.list_viewer, name="list_viewer"),
    path("save_list_view/", views.save_list_view, name="save_list_view"),
    path("delete_list/", views.delete_list, name="delete_list"),
    path("product_list_view/", views.product_list_view, name="product_list_view"),
    path("offline/", views.offline, name="offline"),
    path('jsi18n/', JavaScriptCatalog.as_view(), name='javascript-catalog'),
    path('sw.js', (TemplateView.as_view(template_name="sw.js", content_type='application/javascript', )), name='sw.js'),
]

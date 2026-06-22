from django.urls import path
from . import views

urlpatterns = [
    path("", view=views.index, name="home"),
    path("sitemap.xml", view=views.sitemap_xml, name="sitemap"),
    path("api/contact", view=views.contact, name="contact"),
]

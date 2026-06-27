from django.conf import settings
from django.contrib import admin
from django.urls import path, include
from django.conf.urls.static import static

urlpatterns = [
    path("admin/", admin.site.urls),
    path("", include("kelvinkamara.urls")),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

admin.site.site_header = "Kelvin Kamara - Award Winning Software Engineer"
admin.site.site_title = "Kelvin Kamara - Award Winning Software Engineer Admin Portal"
admin.site.index_title = "Welcome to the Admin Portal"

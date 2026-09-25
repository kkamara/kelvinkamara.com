"""
WSGI config for app project.

It exposes the WSGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/5.2/howto/deployment/wsgi/
"""

import os

from django.core.wsgi import get_wsgi_application

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "app.settings")

django_application = get_wsgi_application()


def application(environ, start_response):
    # The host's wsgi.file_wrapper calls fileno() for sendfile, which
    # WhiteNoise's ranged-response file wrapper doesn't support, causing
    # 500s on any Range request (e.g. browser video/static playback).
    environ.pop("wsgi.file_wrapper", None)
    return django_application(environ, start_response)

from pathlib import Path

from django.http import FileResponse, Http404, JsonResponse
from django.shortcuts import render
from django.core.mail import EmailMultiAlternatives
from django.template.loader import get_template
from django.utils.html import strip_tags
from django.conf import settings
from django.core.exceptions import ValidationError
from django.core.validators import validate_email
from django.contrib.staticfiles import finders
from django.views.decorators.csrf import ensure_csrf_cookie

import logging
import requests


def sitemap_xml(request):
    sitemap_path = finders.find("sitemap.xml")
    if not sitemap_path:
        # Fallbacks for environments where static finders are unavailable.
        static_root = getattr(settings, "STATIC_ROOT", "")
        fallback_paths = []
        if static_root:
            fallback_paths.append(Path(static_root) / "sitemap.xml")
        fallback_paths.extend(
            [
                Path(settings.BASE_DIR) / "static" / "sitemap.xml",
                Path(settings.BASE_DIR) / "kelvinkamara" / "assets" / "sitemap.xml",
            ]
        )
        sitemap_path = next(
            (str(path) for path in fallback_paths if path.exists()),
            None,
        )

    if not sitemap_path:
        raise Http404("sitemap.xml not found")

    return FileResponse(open(sitemap_path, "rb"), content_type="application/xml")


@ensure_csrf_cookie
def index(request):
    context = {"dark_mode": "off"}
    dark_mode = request.GET.get("dark_mode", False)
    if dark_mode is not False and dark_mode == "on":
        context["dark_mode"] = "on"
    return render(request, "pages/index.html", context=context)


def is_valid_email(subject):
    try:
        validate_email(subject)
        return True
    except ValidationError as exception:
        logging.info(str(exception))
        return False


def contact(request):
    if "POST" == request.method:
        error_msg = ""
        name = request.POST.get("name", False)
        email = request.POST.get("email", False)
        message = request.POST.get("message", False)
        if not name or name == "":
            error_msg = "Name string must be provided"
        elif len(name) < 3:
            error_msg = "Name length must be greater than 2 characters"
        elif len(name) > 50:
            error_msg = "Name length must be less than 51 characters"

        if not email or email == "":
            error_msg = "Email string must be provided"
        elif len(email) < 3:
            error_msg = "Email length must be greater than 2 characters"
        elif len(email) > 50:
            error_msg = "Email length must be less than 51 characters"
        elif not is_valid_email(email):
            error_msg = "Email must be a valid format like johnsmith@example.com"

        if message:
            if type(message) is not str:
                error_msg = "Message string must be provided"
            elif len(message) > 1000:
                error_msg = "Message length must be less than 1001 characters"

        if len(error_msg) > 0:
            return JsonResponse({"error": error_msg}, status=400)

        html = get_template("emails/contact.html")
        html_content = html.render(
            {
                "name": name,
                "email": email,
                "message": message,
                "app_url": settings.APP_URL,
            }
        )
        text_content = strip_tags(html_content)

        if settings.MAILGUN_SECRET:
            try:
                send_mail = requests.post(
                    f"https://api.eu.mailgun.net/v3/{settings.MAILGUN_DOMAIN}/messages",
                    auth=("api", settings.MAILGUN_SECRET),
                    data={
                        "from": settings.MAIL_FROM_ADDRESS,
                        "to": [settings.MAIL_TO_ADDRESS],
                        "subject": settings.MAIL_SUBJECT,
                        "text": text_content,
                        "html": html_content,
                        "h:Reply-To": email,  # Populates the to field in the email client when replying to the email.
                    },
                    timeout=10,
                )
            except requests.RequestException as exc:
                logging.error("Mailgun request failed: %s", str(exc))
                return JsonResponse({"error": "Internal Server Error."}, status=500)
            if send_mail.status_code != 200:
                logging.error(
                    "Mailgun send failed. status=%s body=%s",
                    send_mail.status_code,
                    send_mail.text,
                )
                return JsonResponse({"error": "Internal Server Error."}, status=500)
        else:
            # Send to Docker's mailhog for local development
            try:
                send_mail = EmailMultiAlternatives(
                    subject=settings.MAIL_SUBJECT,
                    body=text_content,
                    from_email=settings.MAIL_FROM_ADDRESS,
                    to=[settings.MAIL_TO_ADDRESS],
                    reply_to=[email],
                )
                send_mail.attach_alternative(html_content, "text/html")
                send_mail.send(fail_silently=False)
            except Exception as e:
                logging.error("Email send failed: %s", str(e))
                return JsonResponse({"error": "Internal Server Error."}, status=500)
        return JsonResponse({"message": "Success"}, status=200)
    return JsonResponse({"error": "Resource not found."}, status=404)

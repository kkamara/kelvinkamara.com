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
from django.views.decorators.http import require_POST



def _static_file_response(filename, content_type):
    static_path = finders.find(filename)
    if not static_path:
        static_root = getattr(settings, "STATIC_ROOT", "")
        fallback_paths = []
        if static_root:
            fallback_paths.append(Path(static_root) / filename)
        fallback_paths.extend(
            [
                Path(settings.BASE_DIR) / "static" / filename,
                Path(settings.BASE_DIR) / "kelvinkamara" / "assets" / filename,
            ]
        )
        static_path = next(
            (str(path) for path in fallback_paths if path.exists()), None
        )

    if not static_path:
        raise Http404(f"{filename} not found")

    return FileResponse(open(static_path, "rb"), content_type=content_type)


def sitemap_xml(request):
    return _static_file_response("sitemap.xml", "application/xml")


def robots_txt(request):
    return _static_file_response("robots.txt", "text/plain")


@ensure_csrf_cookie
def index(request):
    context = {
        "turnstile_sitekey": settings.TURNSTILE_SITEKEY,
    }
    return render(request, "kelvinkamara/pages/index.html", context=context)


def is_valid_email(subject):
    try:
        validate_email(subject)
        return True
    except ValidationError as exception:
        logging.info(str(exception))
        return False


@require_POST
def contact(request):
    captcha_token = request.POST.get("cf-turnstile-response", "")
    captcha_required = bool(
        settings.TURNSTILE_SECRET and settings.TURNSTILE_SITEKEY
    )
    if captcha_required and not captcha_token:
        return JsonResponse(
            {"error": "Captcha is required before submitting."}, status=400
        )

    captcha_result = {"success": True}
    if captcha_required:
        try:
            captcha_response = requests.post(
                "https://challenges.cloudflare.com/turnstile/v0/siteverify",
                data={
                    "secret": settings.TURNSTILE_SECRET,
                    "response": captcha_token,
                    "remoteip": request.META.get("REMOTE_ADDR", ""),
                },
                timeout=10,
            )
            captcha_response.raise_for_status()
            captcha_result = captcha_response.json()
        except (requests.RequestException, ValueError) as exc:
            logging.error("Turnstile verification failed: %s", str(exc))
            return JsonResponse({"error": "Internal Server Error."}, status=500)

    if captcha_required and not captcha_result.get("success"):
        return JsonResponse(
            {"error": "Captcha verification failed. Please try again."},
            status=400,
        )

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
    elif len(email) > 100:
        error_msg = "Email length must be less than 101 characters"
    elif not is_valid_email(email):
        error_msg = "Email must be a valid format like johnsmith@example.com"

    if message:
        if type(message) is not str:
            error_msg = "Message string must be provided"
        elif len(message) > 1000:
            error_msg = "Message length must be less than 1001 characters"

    if len(error_msg) > 0:
        return JsonResponse({"error": error_msg}, status=400)

    html = get_template("kelvinkamara/emails/contact.html")
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

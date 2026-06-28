$(document).ready(function() {
    /* close modal modal */
    $(".close-success").click(function() {
        $(".success").toggle();
    });
    $(".close-error").click(function() {
        $(".error").toggle();
    });

    // set form values
    $name = $("#name");
    $email = $("#email");
    $message = $("#message");
    $contactForm = $("#contact-form");
    $captchaField = $(".captcha-field");

    /* clear inputs on page load */
    $name.val("");
    $email.val("");
    $message.val("");

    function fieldHandler(maxLength = 50, noNumbers = false) {
        var value = $(this).val();
        var hasError = false;

        if (
            !value.length ||
            value.length < 3 ||
            value.length > maxLength ||
            (noNumbers && value.match(/\d+/g))
        ) {
            hasError = true;
        }

        if (hasError) {
            $(this).addClass("is-invalid");
            return;
        }

        if ($(this).hasClass("is-invalid")) {
            $(this).removeClass("is-invalid");
        }
    }

    function setCaptchaInvalid(isInvalid) {
        if (!$captchaField.length) {
            return;
        }

        if (isInvalid) {
            $captchaField.addClass("is-invalid");
            return;
        }

        $captchaField.removeClass("is-invalid");
    }

    $(document).on("change input", "input[name='cf-turnstile-response']", function() {
        if ($(this).val()) {
            setCaptchaInvalid(false);
        }
    });

    $name.on("input", function() {
        fieldHandler.call(this, undefined, true);
    });

    $email.on("input", function() {
        fieldHandler.call(this, 100);
    });

    $message.on("input", function() {
        var value = $(this).val();
        var hasError = false;

        if (value.length > 1000) {
            hasError = true;
        }

        if (hasError) {
            $(this).addClass("is-invalid");
            return;
        }

        if ($(this).hasClass("is-invalid")) {
            $(this).removeClass("is-invalid");
        }
    });

    $contactForm.on("submit", function(e) {
        e.preventDefault();

        if (
            $name.hasClass("is-invalid") ||
            $email.hasClass("is-invalid") ||
            $message.hasClass("is-invalid")
        )
            return;

        const data = {};
        data.name = $name.val();
        data.email = $email.val();
        if ($message.val().length) data.message = $message.val();
        data["cf-turnstile-response"] = $(
            "input[name='cf-turnstile-response']"
        ).val();

        if (!data["cf-turnstile-response"]) {
            setCaptchaInvalid(true);
            return;
        }

        setCaptchaInvalid(false);

        // send ajax request
        $.ajaxSetup({
            url: "/api/contact",
            global: false,
            type: "POST",
            headers: {
                "X-CSRFToken": $("input[name=csrfmiddlewaretoken]").val()
            }
        });
        $.ajax({
            data
        })
            .done(function() {
                $name.val("");
                $email.val("");
                $message.val("");
                setCaptchaInvalid(false);
                $(".success").toggle();
            })
            .fail(function(xhr) {
                const errorMsg =
                    xhr && xhr.responseJSON && xhr.responseJSON.error
                        ? xhr.responseJSON.error.toLowerCase()
                        : "";
                const isCaptchaError = errorMsg.includes("captcha");

                if (isCaptchaError) {
                    setCaptchaInvalid(true);
                    return;
                }

                $(".error").toggle();
            })
            .always(function() {
                if (window.turnstile && "function" === typeof window.turnstile.reset) {
                    window.turnstile.reset();
                }
            });
    });

    handleNavCurrentClass();
});

// Handle setting `nav-current` class on nav links.
function handleNavCurrentClass() {
    const navHome = $(".nav-home");
    const navWork = $(".nav-work");
    const navRecommendations = $(".nav-recommendations");
    const navAwardHow = $(".nav-award-how");
    navHome.removeClass("nav-current");
    navWork.removeClass("nav-current");
    navRecommendations.removeClass("nav-current");
    navAwardHow.removeClass("nav-current");

    switch(window.location.hash) {
        case "":
        case "#home":
            navHome.addClass("nav-current");
            break;
        case "#work":
            navWork.addClass("nav-current");
            break;
        case "#recommendations":
            navRecommendations.addClass("nav-current");
            break;
        case "#award-how":
            navAwardHow.addClass("nav-current");
            break;
    }

    navHome.on("click", function() {
        navHome.addClass("nav-current");
        navWork.removeClass("nav-current");
        navRecommendations.removeClass("nav-current");
        navAwardHow.removeClass("nav-current");
    });

    navWork.on("click", function() {
        navWork.addClass("nav-current");
        navHome.removeClass("nav-current");
        navRecommendations.removeClass("nav-current");
        navAwardHow.removeClass("nav-current");
    });

    navRecommendations.on("click", function() {
        navRecommendations.addClass("nav-current");
        navHome.removeClass("nav-current");
        navWork.removeClass("nav-current");
        navAwardHow.removeClass("nav-current");
    });

    navAwardHow.on("click", function() {
        navAwardHow.addClass("nav-current");
        navHome.removeClass("nav-current");
        navWork.removeClass("nav-current");
        navRecommendations.removeClass("nav-current");
    });
}

// These callbacks are invoked by Cloudflare Turnstile from data-* attributes
// in the contact form template, so they are used even without JS call-sites.
// Note: Chrome's warning text mentions a preload resource. In this codebase we do
// not add a Turnstile preload tag directly; the preload is introduced by Turnstile.
function onContactCaptchaSolved() {
    $(".captcha-field").removeClass("is-invalid");
}

function onContactCaptchaExpired() {
    $(".captcha-field").addClass("is-invalid");
}

function onContactCaptchaError() {
    $(".captcha-field").addClass("is-invalid");
}

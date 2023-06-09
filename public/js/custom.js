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

        // send ajax request
        $.ajaxSetup({
            headers: {
                "X-CSRF-TOKEN": $('meta[name="csrf-token"]').attr("content")
            },
            url: "/api/contact",
            global: false,
            type: "POST"
        });
        $.ajax({
            data
        })
            .done(function() {
                $name.val("");
                $email.val("");
                $message.val("");
                $(".success").toggle();
            })
            .error(function() {
                $(".error").toggle();
            });
    });
});

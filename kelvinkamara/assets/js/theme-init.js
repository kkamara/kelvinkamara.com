(function() {
    var currentScript = document.currentScript;
    var storageKey = "kelvinkamara.theme";
    var darkThemeHref = "";
    var darkThemeStylesheetId = "dark-theme-stylesheet";
    var theme = "light";

    if (currentScript && currentScript.dataset) {
        storageKey = currentScript.dataset.storageKey || storageKey;
        darkThemeHref = currentScript.dataset.darkThemeHref || darkThemeHref;
    }

    function ensureDarkThemeStylesheet() {
        if (!darkThemeHref || document.getElementById(darkThemeStylesheetId)) {
            return;
        }

        var link = document.createElement("link");
        link.id = darkThemeStylesheetId;
        link.rel = "stylesheet";
        link.href = darkThemeHref;
        document.head.appendChild(link);
    }

    try {
        if (window.localStorage.getItem(storageKey) === "dark") {
            theme = "dark";
        }
    } catch (error) {
        theme = "light";
    }

    if (theme === "dark") {
        ensureDarkThemeStylesheet();
    }

    document.documentElement.setAttribute("data-theme", theme);
})();

<!--
    ======================================
    Site Scripts
    ======================================
-->
<script src="{{ asset('/plugins/jquery.js') }}"></script>
<script src="{{ asset('/plugins/owl-carousel/owl.carousel.min.js') }}"></script>
<script src="{{ asset('/plugins/isotope.min.js') }}"></script>
<script src="{{ asset('/plugins/imagesloaded.pkgd.min.js') }}"></script>
<script src="{{ asset('/plugins/magnific-popup/jquery.magnific-popup.min.js') }}"></script>
<script src="{{ asset('/plugins/highlight.min.js') }}"></script>
<script src="{{ asset('/plugins/jquery.fitvids.js') }}"></script>
<script>
    $(document).ready(function(){
        // fitvids
        $("body").fitVids();
    });
    var images = document.querySelectorAll('.kg-gallery-image img');
    images.forEach(function (image) {
        var container = image.closest('.kg-gallery-image');
        var width = image.attributes.width.value;
        var height = image.attributes.height.value;
        var ratio = width / height;
        container.style.flex = ratio + ' 1 0%';
    });
    var activateHighlight = function () {
        document.querySelectorAll("pre code").forEach(
            function (currentValue, currentIndex, listObj) {
                hljs.highlightBlock(currentValue);
            }
        );
    };
    if (window.attachEvent) {
        window.attachEvent('onload', loadHighlight);
    } else {
        if (window.onload) {
            var originalOnload = window.onload;
            var newOnload = function (evt) {
                originalOnload(evt);
                activateHighlight(evt);
            }
            window.onload = newOnload;
        } else {
            window.onload = activateHighlight;
        }
    }
</script>
<script src="{{ asset('/js/main.js') }}"></script>
<script src="{{ asset('/js/bootstrap.min.js') }}"></script>
<script src="{{ asset('/js/all.min.js') }}"></script>
<script src="{{ asset('/js/custom.js') }}"></script>
<script src="{{ asset('/js/fontawesome.min.js') }}"></script>

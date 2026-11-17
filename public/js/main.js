$(document).ready(function() {
    /*-----------------------------
        Featured Posts slider 
    -----------------------------*/
    $('.featured-slider').owlCarousel({
        center: true,
        loop: true,
        margin: 30,
        responsiveClass: true,
        dots: false,
        nav: true,
        stagePadding: 300,
        navText: [
            '<i class="arrow_left feture-post-arrow"></i>',
            '<i class="arrow_right feture-post-arrow"></i>',
        ],
        responsive: {
            0: {
                items: 1,
                stagePadding: 0,
                center: false,
            },
            577: {
                items: 1,
                stagePadding: 100,
            },
            1000: {
                items: 1,
            },
        },
    })

    /*-----------------------------
        Push back menu
    -----------------------------*/
    $('.menu-bar').on('click', function() {
        $('.push-back-menu').addClass('active')
        $('body').addClass('overflow-hidden')
    })
    $('.close-icon').on('click', function() {
        $(this)
            .parent()
            .removeClass('active')
        $('body').removeClass('overflow-hidden')
    })
    $('.menu-bar, .push-back-menu, .search-result-container, .search').on(
        'click',
        function(e) {
            e.stopPropagation()
        }
    )

    /*-----------------------------
        Search menu
    -----------------------------*/
    $('.search').on('click', function() {
        $('.search-result-container').addClass('active')
    })

    $('body').on('click', function() {
        $('.search-result-container').removeClass('active')
        $('.push-back-menu').removeClass('active')
        $('body').removeClass('overflow-hidden')
    })
    /*-----------------------------
    Portfolio Activation with masonry
    -----------------------------*/
    var $grid = $('.portfolio-content').imagesLoaded(function() {
        $grid.isotope({
            itemSelector: '.single-portfolio',
            percentPosition: true,
            masonry: {
                columnWidth: '.grid-sizer',
            },
            filter: '*',
        })
    })

    $('.portfiloNav li').on('click', 'a', function(e) {
        e.preventDefault()
        var $this = $(this)
        $this
            .addClass('active')
            .parent()
            .siblings()
            .children()
            .removeClass('active')
        $this
            .parents('.porfolio-nav')
            .next()
            .isotope({ filter: $this.data('filter') })
    })

    // Popup image
    let galleryImage = $('.kg-gallery-image img')
    galleryImage.on('click', function() {
        $.magnificPopup.open({
            items: {
                src: $(this).attr('src'),
            },
            type: 'image',
        })
    })


    //////////////////////////// Load more posts JS ////////////////////////////////////
    var nextPage = $('link[rel=next]').attr('href'),
    a = $('.load-more-posts'),
    b = $('.loadmore-section')

    if (!nextPage) {
        b.addClass('d-none')
    }
    a.click(function(n) {
        n.preventDefault()
        var i =
            nextPage.split(/page/)[0] +
            'page/' +
            pagination_next_page_number +
            '/'
        $.ajax({
            url: i,
            beforeSend: function() {
                a.html(
                    '<svg version="1.1" id="loader-1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" width="30px" height="30px" viewBox="0 0 40 40" enable-background="new 0 0 40 40" xml:space="preserve"><path opacity="0.2" fill="#fff" d="M20.201,5.169c-8.254,0-14.946,6.692-14.946,14.946c0,8.255,6.692,14.946,14.946,14.946s14.946-6.691,14.946-14.946C35.146,11.861,28.455,5.169,20.201,5.169z M20.201,31.749c-6.425,0-11.634-5.208-11.634-11.634c0-6.425,5.209-11.634,11.634-11.634c6.425,0,11.633,5.209,11.633,11.634C31.834,26.541,26.626,31.749,20.201,31.749z" /><path fill="#fff" d="M26.013,10.047l1.654-2.866c-2.198-1.272-4.743-2.012-7.466-2.012h0v3.312h0C22.32,8.481,24.301,9.057,26.013,10.047z"><animateTransform attributeType="xml" attributeName="transform" type="rotate" from="0 20 20" to="360 20 20" dur="0.5s" repeatCount="indefinite" /></path></svg>'
                )
            },
        }).done(function(data) {
            var posts = $('.post-card', data),
                postwrapper = $('.posts-wrapper')
            postwrapper.append(posts);
            a.text('Load More')
            pagination_next_page_number++
            pagination_next_page_number >
                pagination_available_pages_number && a.text('No post found').addClass('disabled').attr('disabled', 'disabled')
        })
    })

    
})



<div class="hero-area d-flex justify-content-between align-items-center flex-wrap">
    <div 
        class="publication-cover" 
        style="background-image: url({{asset('img/profile.min.jpg')}}); background-position: 0px -28px;"
    ></div>
    <div class="hero-right px-2">
        <div class="hero-content">
            <h1 class="blog-description">Award-Winning Web Developer</h1>
        </div>
        @include("layouts.partials.subscribe")
        <form 
            action="https://www.paypal.com/donate"
            method="post"
            target="_top"
            style="position: relative; margin-left: 23px; margin-top: 23px;"
        >
            <input type="hidden" name="hosted_button_id" value="GCCWYL4HNKGQQ"/>
            <input 
                type="image" 
                src="https://www.paypalobjects.com/en_US/GB/i/btn/btn_donateCC_LG.gif" 
                border="0" 
                name="submit" 
                title="PayPal - The safer, easier way to pay online!" 
                alt="Donate with PayPal button"
            />
            <img 
                alt=""
                border="0"
                src="https://www.paypal.com/en_GB/i/scr/pixel.gif"
                width="1"
                height="1"
            />
        </form>
        <div class="hero-menu-link">
            <a 
                href="https://github.com/kkamara"
                style="outline: none;"
            >
                <i 
                    class="fab fa-github-square fa-2x header-icon"
                    style="margin-right: -2.5px;"
                ></i>
            </a>
            <a 
                href="https://www.linkedin.com/in/kelvin-kamara"
                style="outline: none;"
            >
                <i 
                    class="fab fa-linkedin fa-2x header-icon"
                    style="margin-right: -2.5px;margin-left:15px"
                ></i>
            </a>
            &nbsp; &nbsp;
            <a
                id="contact-me-link"
                class="d-flex align-items-center"
                href="" 
                data-toggle="modal" 
                data-target="#contactMeModal"
            >
                <span class="pr-2">contact ME</span>
                <i class="arrow_right feature-post-arrow"></i>
            </a>
        </div>
    </div>
    <i class="arrow_down hero-bottom-arrow"></i>
</div>
{{-- Modal --}}
<div 
    id="contactMeModal" 
    class="modal hero-modal left"
    tabindex="-1" 
    role="dialog" 
    aria-labelledby="contactMeModalTitle" 
    aria-hidden="true"
>
    <div class="modal-dialog modal-dialog-centered" role="document">
        <div class="modal-content">
            <div class="modal-header">
                <h5 id="exampleModalLongTitle" class="modal-title">
                    Contact me
                </h5>
                <button class="close" type="button" data-dismiss="modal" aria-label="Close">
                    <span aria-hidden="true">×</span>
                </button>
            </div>
            <div class="modal-body">
                <form id="contact-form" class="container">
                    <div class="col-md-12">
                        <p>
                            Let's discuss ways in which we can fulfill your needs.
                        </p>
                        <a href="mailto:kamaracomputers@gmail.com">
                            Send me an email <i class="far fa-envelope pub-icon fa-2x"></i>
                        </a>
                        <br />
                        <a href="tel:+447956694595">
                            Give me a call <i class="fas fa-phone pub-icon fa-2x"></i>
                        </a>
                    </div>
                    <br />
                    <div class="col-md-12">
                        <div class="form-group">
                            <label for="name">
                                Name&nbsp;
                            </label>
                            <input id="name" class="form-control" name="name" type="text" required/>
                        </div>
                        <div class="form-group">
                            <label for="email">
                                Email&nbsp;
                            </label>
                            <input id="email" class="form-control" name="email" type="email" required/>
                        </div>
                        <div class="form-group">
                            <label for="message">Message</label>
                            <textarea id="message" class="form-control" name="message"></textarea>
                        </div>
                        <div class="form-group text-center">
                            <button id="submit" class="btn btn-primary" name="submit">
                                Submit
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    </div>
</div>
<div class="modalbox success col-sm-8 col-md-6 col-lg-5 center animate" style="display: none;">
    <div class="icon">
        <i class="fas fa-check fa-4x modal-icon"></i>
    </div>
    <h1>Success!</h1>
    <p>Your message has been sent.</p>
    <button class="close-success btn" type="button">
        Ok
    </button>
</div>
<div class="modalbox error col-sm-8 col-md-6 col-lg-5 center animate" style="display: none;">
    <div class="icon">
        <i class="far fa-thumbs-down fa-4x modal-icon"></i>
    </div>
    <h1>Oh no!</h1>
    <p>
        Oops! Something went wrong, you should try again.
    </p>
    <button class="close-error btn" type="button">Try again</button>
</div>
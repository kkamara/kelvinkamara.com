$(document).ready(function(){
  $('.testimonials').bxSlider({
    auto: true,
    pause: 32000, //time on each review
    mode: 'fade', // or slide
    infiniteLoop: true,
    controls: false, // true for arrows
    slideMargin: 0
  });
});
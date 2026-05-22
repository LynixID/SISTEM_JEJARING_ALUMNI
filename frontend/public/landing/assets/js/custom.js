(function ($) {
	
	"use strict";

	// Header Type = Fixed
  $(window).scroll(function() {
    var scroll = $(window).scrollTop();
    var box = $('.header-text').height();
    var header = $('header').height();

    if (scroll >= box - header) {
      $("header").addClass("background-header");
    } else {
      $("header").removeClass("background-header");
    }
  });


	$('.owl-banner').owlCarousel({
		items:1,
		loop:true,
		dots: true,
		nav: false,
		autoplay: true,
		margin:0,
		  responsive:{
			  0:{
				  items:1
			  },
			  600:{
				  items:1
			  },
			  1000:{
				  items:1
			  },
			  1600:{
				  items:1
			  }
		  }
	})

    $('.owl-services').owlCarousel({
        items:4,
        loop:true,
        dots: true,
        nav: false,
        autoplay: true,
        margin:5,
          responsive:{
              0:{
                  items:1
              },
              600:{
                  items:2
              },
              1000:{
                  items:3
              },
              1600:{
                  items:4
              }
          }
    })

    $('.owl-portfolio').owlCarousel({
        items:4,
        loop:true,
        dots: true,
        nav: true,
        autoplay: true,
        margin:30,
          responsive:{
              0:{
                  items:1
              },
              700:{
                  items:2
              },
              1000:{
                  items:3
              },
              1600:{
                  items:4
              }
          }
    })

    

	// Menu Dropdown Toggle
  if($('.menu-trigger').length){
    $(".menu-trigger").on('click', function() { 
      $(this).toggleClass('active');
      $('.header-area .nav').slideToggle(200);
    });
  }


  // Menu dropdown mobile collapse (no delay or scroll animation)
  $('.scroll-to-section a[href*=\\#]:not([href=\\#])').on('click', function() {
    var width = $(window).width();
    if (width < 991) {
      $('.menu-trigger').removeClass('active');
      $('.header-area .nav').slideUp(200);  
    }
  });

  $(document).ready(function () {
      $(document).on("scroll", onScroll);
  });

  function onScroll(event){
      var scrollPos = $(document).scrollTop();
      var headerHeight = $('header').outerHeight() || 100;
      var activeLink = null;

      $('.nav a[href^="#"]').each(function () {
          var currLink = $(this);
          var refElement = $(currLink.attr("href"));
          if (refElement.length) {
              var top = refElement.offset().top - headerHeight - 50; // Triggers slightly before section top
              var bottom = top + refElement.outerHeight();
              if (scrollPos >= top && scrollPos < bottom) {
                  activeLink = currLink;
              }
          }
      });

      if (activeLink) {
          $('.nav a').removeClass("active");
          activeLink.addClass("active");
      }
  }



	// Page loading animation
	 $(window).on('load', function() {

        $('#js-preloader').addClass('loaded');

    });

	

	// Window Resize Mobile Menu Fix
  function mobileNav() {
    var width = $(window).width();
    $('.submenu').on('click', function() {
      if(width < 767) {
        $('.submenu ul').removeClass('active');
        $(this).find('ul').toggleClass('active');
      }
    });
  }




})(window.jQuery);
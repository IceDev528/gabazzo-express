// Enable Night Mode on The Page
$(document).ready(function () {
  $(".mode_icon").click(function () {
    let mode = localStorage.getItem("mode");

    if (mode === "dark") localStorage.setItem("mode", "light");
    else localStorage.setItem("mode", "dark");

    $(".mode_icon").toggleClass("active");
    $("body").toggleClass("night");
  });

  if (localStorage.getItem("mode") === "dark") {
    $(".mode_icon").toggleClass("active");
    $("body").toggleClass("night");
  }
});

// Bootstrap Scripts
$(document).ready(function () {
  // Tooltip & Popover Initialization
  $('[data-toggle="tooltip"]').tooltip();
  $('[data-toggle="popover"]').popover();

  // Humbergur Icon Toggler
  $(".navbar-toggler").on("click", function () {
    $(".humbergur_icon").toggleClass("open");
  });
});

// Stop Bootstrap Dropdown Clicking Propagation
$(document).on("click", ".dropdown-menu", function (e) {
  if ($(this).hasClass("filter_down")) {
    e.stopPropagation();
  }
});

$(document).ready(function () {
  $(".see_number").on("click", function () {
    $(".the_number").slideToggle(200);
    $(".see_number").addClass("inactive");
  });
});

// Company Info
$(document).ready(function () {
  $("#dismissCompanyInfoLink").on("click", function () {
    $("#companyInfoMobile").removeClass("show");
  });

  $("#companyInfoLink").on("click", function () {
    $("#companyInfoMobile").addClass("show");
  });
});

// Profile Links
$(document).ready(function () {
  $(".dismissMembersProfileLinks").on("click", function () {
    $(".membersProfileLinks").removeClass("show");
  });

  $(".membersProfilePic").on("click", function () {
    $(".membersProfileLinks").addClass("show");
  });
});

// Service Port Page Right Fixed Buttons For Mobile
$(document).ready(function () {
  $(".expand_port_fixed").on("click", function () {
    $(".expand_port_fixed").addClass("hide");
    $(".port_fixed").addClass("show");
  });

  $(".collapsed_port_fixed").on("click", function () {
    $(".expand_port_fixed").removeClass("hide");
    $(".port_fixed").removeClass("show");
  });
});

$(document).ready(function () {
  $("#port-gallery").lightSlider({
    gallery: true,
    item: 1,
    thumbItem: 5,
    slideMargin: 0,
    speed: 800,
    auto: false,
    loop: false,
  });
});

// Owl Carousel Scripts
$(document).ready(function () {
  $(".popular_services .owl-carousel").owlCarousel({
    items: 4,
    loop: false,
    margin: 20,
    nav: true,
    dots: true,
    responsiveClass: true,
    responsive: {
      0: {
        items: 1,
      },
      576: {
        items: 2,
      },
      767: {
        items: 3,
      },
      992: {
        items: 4,
      },
      1200: {
        items: 4,
      },
    },
  });

  $(".nearby_companies .owl-carousel").owlCarousel({
    items: 3,
    loop: false,
    margin: 20,
    nav: true,
    dots: true,
    responsiveClass: true,
    responsive: {
      0: {
        items: 1,
      },
      576: {
        items: 1,
      },
      767: {
        items: 2,
      },
      992: {
        items: 3,
      },
      1200: {
        items: 3,
      },
    },
  });

  $(".needed_home_services .owl-carousel").owlCarousel({
    items: 4,
    loop: false,
    margin: 20,
    nav: true,
    dots: true,
    responsiveClass: true,
    responsive: {
      0: {
        items: 1,
      },
      576: {
        items: 2,
      },
      992: {
        items: 4,
      },
      1200: {
        items: 4,
      },
    },
  });

  $(".services_category_slider .owl-carousel").owlCarousel({
    items: 6,
    loop: false,
    margin: 20,
    nav: true,
    dots: false,
    responsiveClass: true,
    responsive: {
      0: {
        items: 3,
        margin: 10,
      },
      576: {
        items: 3,
      },
      992: {
        items: 6,
      },
      1200: {
        items: 6,
      },
    },
  });

  $(".service_img_slider .owl-carousel").owlCarousel({
    items: 1,
    loop: false,
    margin: 0,
    nav: true,
    dots: false,
  });

  $(".company_services .owl-carousel").owlCarousel({
    items: 4,
    loop: false,
    margin: 20,
    nav: true,
    dots: true,
    responsiveClass: true,
    responsive: {
      0: {
        items: 1,
      },
      576: {
        items: 2,
      },
      992: {
        items: 3,
      },
      1200: {
        items: 4,
      },
    },
  });

  $(".portfolio_carousel .owl-carousel").owlCarousel({
    items: 1,
    loop: false,
    margin: 20,
    nav: true,
    dots: false,
  });

  $(".review_carousel .owl-carousel").owlCarousel({
    items: 1,
    loop: false,
    margin: 20,
    nav: true,
    dots: false,
  });
});

// Splide Slider For Portfolio
document.addEventListener("DOMContentLoaded", function () {
  new Splide(".portfolio_slider .splide", {
    type: "slide",
    arrows: true,
    gap: "20px",
    perPage: 3,
    perMove: 1,
    drag: false,
    pagination: true,
    breakpoints: {
      0: {
        perPage: 1,
      },
      576: {
        perPage: 1,
      },
      768: {
        perPage: 2,
      },
      994: {
        perPage: 2,
      },
    },
  }).mount();
});

// Add Class On Comapny Profile Page Menu After Scroll Down
$(window).scroll(function () {
  if ($(this).scrollTop() > 550) {
    $(".cp_fixed_menu_wrap").addClass("show");
  } else {
    $(".cp_fixed_menu_wrap").removeClass("show");
  }
});

// Add Class On Comapny Dashboard Page Menu After Scroll Down
$(window).scroll(function () {
  if ($(this).scrollTop() > 480) {
    $(".dash_fixed_menu_wrap").addClass("show");
  } else {
    $(".dash_fixed_menu_wrap").removeClass("show");
  }
});

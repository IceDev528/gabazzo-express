// Enable Night Mode on The Page
$(document).ready(function () {
  $(".night_mode_icon").click(function () {
    let mode = localStorage.getItem("mode");

    if (mode === "dark") localStorage.setItem("mode", "light");
    else localStorage.setItem("mode", "dark");

    $(".night_mode_icon").toggleClass("active");
    $("body").toggleClass("night");
  });

  if (localStorage.getItem("mode") === "dark") {
    $(".night_mode_icon").toggleClass("active");
    $("body").toggleClass("night");
  }
});

/*	=============================================	*/

// Footer Responsive Menubar
$(document).ready(function () {
  $(".footer_nav_togger1").click(function () {
    $(".footer_nav_togger1").toggleClass("active");
  });
});
$(document).ready(function () {
  $(".footer_nav_togger2").click(function () {
    $(".footer_nav_togger2").toggleClass("active");
  });
});
$(document).ready(function () {
  $(".footer_nav_togger3").click(function () {
    $(".footer_nav_togger3").toggleClass("active");
  });
});
$(document).ready(function () {
  $(".footer_nav_togger4").click(function () {
    $(".footer_nav_togger4").toggleClass("active");
  });
});

/*	=============================================	*/

// Stop Bootstrap Dropdown Clicking Propagation
$(document).on("click", ".dropdown-menu", function (e) {
  if ($(this).hasClass("messages_dropdown")) {
    e.stopPropagation();
  }
});

// Stop Bootstrap Dropdown Clicking Propagation
$(document).on("click", ".dropdown-menu", function (e) {
  if ($(this).hasClass("balance-menu")) {
    e.stopPropagation();
  }
});

/*	=============================================	*/

// Hamburger Animations
$(document).ready(function () {
  // Hide/show animation hamburger function
  $(".navbar-toggler").on("click", function () {
    // This Line For Hamburger Animations
    $(".animated-icon1").toggleClass("open");
  });
});

// Hamburger Animations
$(document).ready(function () {
  // Hide/show animation hamburger function
  $(".navbar-togglerr").on("click", function () {
    // This Line For Hamburger Animations
    $(".animated-icon2").toggleClass("open");
  });
});

/*	=============================================	*/

//	For Cart Sidebar
$(document).ready(function () {
  $("#dismissCartSidebar").on("click", function () {
    $("#cartSidebar").removeClass("active");
  });

  $("#cartSidebarLink").on("click", function () {
    $("#cartSidebar").addClass("active");
  });
});

//	For My Account Menu For Desktop
$(document).ready(function () {
  $("#dismissMyAcActionLink").on("click", function () {
    $("#myAcContents").removeClass("active");
  });

  $("#myAcActionLink").on("click", function () {
    $("#myAcContents").addClass("active");
  });
});

//	For My Account Menu For Mobile
$(document).ready(function () {
  $("#dismissMyAcActionLinkMB").on("click", function () {
    $("#myAcContentsMB").removeClass("active");
  });

  $("#myAcActionLinkMB").on("click", function () {
    $("#myAcContentsMB").addClass("active");
  });
});

/*	=============================================	*/

// Control Two Responsive Bar When Click
$(document).ready(function () {
  $(".navbar-toggler").on("click", function () {
    $("#navb").removeClass("show");
    $(".animated-icon2").removeClass("open");
  });

  $(".navbar-togglerr").on("click", function () {
    $("#responsive-bar").removeClass("show");
    $(".animated-icon1").removeClass("open");
  });
});

/*	=============================================	*/

// Bootstrap Modal & Popover
$(document).ready(function () {
  $('[data-toggle="tooltip"]').tooltip();
  $('[data-toggle="popover"]').popover();
});

/*	=============================================	*/

/*	=============================================	*/

$(document).ready(function () {
  var calendar = $("#my-calendar");
  if (calendar.length) {
    $("#my-calendar").zabuto_calendar({
      cell_border: true,
      today: true,
      nav_icon: {
        prev: '<i class="fa fa-chevron-left"></i>',
        next: '<i class="fa fa-chevron-right"></i>',
      },
      legend: [
        { type: "block", label: "Event", classname: "bg-primary" },
        { type: "block", label: "Other", classname: "bg-warning" },
        { type: "block", label: "Estimates", classname: "bg-success" },
        { type: "block", label: "Occupied", classname: "bg-danger" },
      ],
    });
  }

  var cww = $(".chat-widget-wrap").outerHeight();
  var cwh = $(".chat-widget-header").outerHeight();
  var cwb = $(".chat-widget-body").outerHeight();
  var cwf = $(".chat-widget-footer").outerHeight();

  $(".chat-widget-wrap").css("margin-bottom", -(cwb + cwf));
  $(".chat-widget-header").on("click", function () {
    $(this).closest(".chat-widget-wrap").toggleClass("open");
  });
  $(".chat-widget-chat-profile").css("margin-bottom", -cwf);
  $(".chat-widget-new-chat").css({ "margin-top": -cwh, "margin-bottom": -cwf });

  $(".chat-widget-service-list").show();
  $(".chat-widget-service-list .list-group-item > a").on("click", function () {
    $(this).closest(".chat-widget-service-list").hide();
    $(".chat-widget-service-list-1").show();
  });
  $(".chat-widget-service-list-1 .list-group-item > a").on(
    "click",
    function () {
      $(this).closest(".chat-widget-service-list-1").hide();
      $(".chat-widget-chat-list").show();
    }
  );
  $(".chat-widget-service-list-1 .link-back").on("click", function () {
    $(this).closest(".chat-widget-service-list-1").hide();
    $(".chat-widget-service-list").show();
  });
  $(".chat-widget-chat-list .list-group-item > a").on("click", function () {
    $(this).closest(".chat-widget-chat-list").hide();
    $(".chat-widget-chat-profile").show();
  });
  $(".chat-widget-chat-list .link-back").on("click", function () {
    $(this).closest(".chat-widget-chat-list").hide();
    $(".chat-widget-service-list-1").show();
  });
  $(".chat-widget-chat-profile .link-back").on("click", function () {
    $(this).closest(".chat-widget-chat-profile").hide();
    $(".chat-widget-chat-list").show();
  });
  $(".chat-widget-footer > .btn").on("click", function () {
    $(this).closest(".chat-widget-body-inner").hide();
    $(".chat-widget-new-chat").show();
  });
  $(".chat-widget-new-chat .link-cancel").on("click", function () {
    $(this).closest(".chat-widget-new-chat").hide();
    $(".chat-widget-service-list").show();
  });
});

// Image upload preview
async function readURL(input) {
  if (input.files && input.files[0]) {
    var reader = new FileReader();

    reader.onload = function (e) {
      $("#blah").attr("src", e.target.result);
    };

    reader.readAsDataURL(input.files[0]);
    $("#" + input.id + 2).prepend(
      '<span style="margin-right: 2px; color: green; font-weight: bold;">Files attached successfully.</span>'
    );
    console.log(reader);
  }
}

$(window).on("scroll", function () {
  if ($(window).scrollTop() > 400) {
    $(".update_now_button_section").addClass("active");
  } else {
    $(".update_now_button_section").removeClass("active");
  }
});

$("#file-1").change(function () {
  readURL(this);
});

$(".inputfile").change(function () {
  readURL(this);
});

function getURL() {
  alert("The URL of this page is: " + window.location.href);
}

const myText = document.getElementById("myText");
const wordCount = document.getElementById("wordCount");
const myText2 = document.getElementById("myText2");
const wordCount2 = document.getElementById("wordCount2");
const myText3 = document.getElementById("myText3");
const wordCount3 = document.getElementById("wordCount3");
const myText4 = document.getElementById("myText4");
const wordCount4 = document.getElementById("wordCount4");
const myText5 = document.getElementById("myText5");
const wordCount5 = document.getElementById("wordCount5");
const myText6 = document.getElementById("myText6");
const wordCount6 = document.getElementById("wordCount6");

myText.addEventListener("keyup", function () {
  const characters = myText.value.split("");
  wordCount.innerText = characters.length;
});

myText2.addEventListener("keyup", function () {
  const characters = myText2.value.split("");
  wordCount2.innerText = characters.length;
});

myText3.addEventListener("keyup", function () {
  const characters = myText3.value.split("");
  wordCount3.innerText = characters.length;
});
myText4.addEventListener("keyup", function () {
  const characters = myText4.value.split("");
  wordCount4.innerText = characters.length;
});

myText5.addEventListener("keyup", function () {
  const characters = myText5.value.split("");
  wordCount5.innerText = characters.length;
});

myText6.addEventListener("keyup", function () {
  const characters = myText6.value.split("");
  wordCount6.innerText = characters.length;
});

$(document).ready(function () {
  // Configure/customize these variables.
  var showChar = 180; // How many characters are shown by default
  var ellipsestext = "...";
  var moretext = "Read more";
  var lesstext = "Read less";

  $(".more").each(function () {
    var content = $(this).html();

    if (content.length > showChar) {
      var c = content.substr(0, showChar);
      var h = content.substr(showChar, content.length - showChar);

      var html =
        c +
        '<span class="moreellipses">' +
        ellipsestext +
        '&nbsp;</span><span class="morecontent"><span>' +
        h +
        '</span>&nbsp;&nbsp;<a href="" class="morelink">' +
        moretext +
        "</a></span>";

      $(this).html(html);
    }
  });

  $(".morelink").click(function () {
    if ($(this).hasClass("less")) {
      $(this).removeClass("less");
      $(this).html(moretext);
    } else {
      $(this).addClass("less");
      $(this).html(lesstext);
    }
    $(this).parent().prev().toggle();
    $(this).prev().toggle();
    return false;
  });
});

$(document).ready(function () {
  // Configure/customize these variables.
  var showChara = 100; // How many characters are shown by default
  var ellipsestexta = "...";
  var moretexta = "more";
  var lesstexta = "less";

  $(".morea").each(function () {
    var content = $(this).html();

    if (content.length > showChara) {
      var c = content.substr(0, showChara);
      var h = content.substr(showChara, content.length - showChara);

      var html =
        c +
        '<span class="moreellipses">' +
        ellipsestexta +
        '&nbsp;</span><span class="morecontent"><span>' +
        h +
        '</span>&nbsp;&nbsp;<a href="" class="morelinka">' +
        moretexta +
        "</a></span>";

      $(this).html(html);
    }
  });

  $(".morelinka").click(function () {
    if ($(this).hasClass("less")) {
      $(this).removeClass("less");
      $(this).html(moretexta);
    } else {
      $(this).addClass("less");
      $(this).html(lesstexta);
    }
    $(this).parent().prev().toggle();
    $(this).prev().toggle();
    return false;
  });
});

var x1 = 0;
var x2 = 0;
var x3 = 0;
var x4 = 0;
var x5 = 0;
var languages = [];
var areas = [];
var products = [];
var services = [];
var tags = [];
let Langflag = 0,
  AreaFlag = 0,
  ServiceFlag = 0;

$("div").on("click", "i", async function (event) {
  let templang = [],
    tempAreas = [],
    tempServices = [];

  console.log("FIRED");

  $(this)
    .parent()
    .parent()
    .fadeOut(200, function () {
      $(this).remove();
      languages.splice(languages.indexOf(this.value), 1);
      products.splice(products.indexOf(this.value), 1);
      tags.splice(tags.indexOf(this.value), 1);
    });
  event.stopPropagation();

  if ($(this).parent()[0].id == "delLang") {
    //Language
    if (
      typeof document.getElementById("languages") != "undefined" &&
      (document.getElementById == "languages") != null &&
      Langflag
    ) {
      let temp = document.getElementsByName("languages[]");
      for (let i = 0; i < temp.length; i++) {
        templang.push(temp[i].value);
      }
    } else {
      templang = document.getElementById("tempLang");
      templang = templang.value.split(",");
      Langflag = 1;
    }

    await templang.splice(
      await templang.indexOf($(this).parent().parent()[0].id.trim()),
      1
    );

    console.log(templang);

    $("#flagLang").val("1");
    $("#deleteLang").empty();
    templang.forEach(function (language) {
      let input = document.createElement("input");
      input.setAttribute("type", "hidden");
      input.setAttribute("name", "languages[]");
      input.setAttribute("value", language);
      input.setAttribute("id", "languages");
      //append to form element that you want .
      document.getElementById("deleteLang").appendChild(input);
    });
  }

  if ($(this).parent()[0].id == "delAreas") {
    //AREAS
    if (
      typeof document.getElementById("areas") != "undefined" &&
      (document.getElementById == "areas") != null &&
      AreaFlag
    ) {
      let temp = document.getElementsByName("areas[]");
      for (let i = 0; i < temp.length; i++) {
        tempAreas.push(temp[i].value);
      }
    } else {
      tempAreas = document.getElementById("tempAreas");
      tempAreas = tempAreas.value.split(",");
      AreaFlag = 1;
    }

    console.log($(this).parent().parent()[0].id.trim(), tempAreas);

    await tempAreas.splice(
      await tempAreas.indexOf($(this).parent().parent()[0].id.trim()),
      1
    );

    console.log(tempAreas);

    languages = templang;

    $("#flagArea").val("1");
    $("#deleteAreas").empty();
    tempAreas.forEach(function (area) {
      let input = document.createElement("input");
      input.setAttribute("type", "hidden");
      input.setAttribute("name", "areas[]");
      input.setAttribute("value", area);
      input.setAttribute("id", "areas");
      //append to form element that you want .
      document.getElementById("deleteAreas").appendChild(input);
    });
  }

  if ($(this).parent()[0].id == "delService") {
    //SERVICES

    if (
      typeof document.getElementById("services") != "undefined" &&
      (document.getElementById == "services") != null &&
      ServiceFlag
    ) {
      let temp = document.getElementsByName("services[]");
      for (let i = 0; i < temp.length; i++) {
        tempServices.push(temp[i].value);
      }
    } else {
      tempServices = document.getElementById("tempService");
      tempServices = tempServices.value.split(",");
      ServiceFlag = 1;
    }

    await tempServices.splice(
      await tempServices.indexOf($(this).parent().parent()[0].id.trim()),
      1
    );

    $("#flagService").val("1");
    $("#deleteService").empty();
    tempServices.forEach(function (area) {
      let input = document.createElement("input");
      input.setAttribute("type", "hidden");
      input.setAttribute("name", "services[]");
      input.setAttribute("value", area);
      input.setAttribute("id", "services");
      //append to form element that you want .
      document.getElementById("deleteService").appendChild(input);
    });
  }
});

$(document).ready(function () {
  $(".add2").prop("disabled", true);
  $("#text2").keyup(function () {
    $(".add2").prop("disabled", this.value === "" ? true : false);
  });
});

$(document).ready(function () {
  $(".add3").prop("disabled", true);
  $("#text3").keyup(function () {
    $(".add3").prop("disabled", this.value === "" ? true : false);
  });
});

$(document).ready(function () {
  $(".add4").prop("disabled", true);
  $("#text4").keyup(function () {
    $(".add4").prop("disabled", this.value === "" ? true : false);
  });
});

$(document).ready(function () {
  $(".add5").prop("disabled", true);
  $("#text5").keyup(function () {
    $(".add5").prop("disabled", this.value === "" ? true : false);
  });
});

async function add_element_to_array_lang(prevlanguages) {
  prevlanguages = prevlanguages.split(",");

  $("#flagLang").val("1");

  languages[x1] = await document.getElementById("text1").value;
  x1++;

  let redudantarraylang = languages.concat(prevlanguages);

  $.each(redudantarraylang, function (i, el) {
    if ($.inArray(el, languages) === -1) languages.push(el);
  });

  var e = " ";

  let origLanguages = [];
  $.each(languages, function (i, el) {
    if ($.inArray(el, origLanguages) === -1) origLanguages.push(el);
  });

  for (var y = 0; y < origLanguages.length; y++) {
    // e += array[y] + "<br/>";
    if (origLanguages[y] != undefined && origLanguages[y] !== "") {
      e +=
        `<span id=${origLanguages[y]}>` +
        origLanguages[y] +
        "<a id='delLang' href='javascript:void(0)'> <i class='fa fa-times' aria-hidden='true'> </i> </a> </span>";
      document.getElementById("lang").innerHTML = e;
    }
  }

  origLanguages.forEach(function (language) {
    let input = document.createElement("input");

    input.setAttribute("type", "hidden");

    input.setAttribute("name", "languages[]");

    input.setAttribute("value", language);

    //append to form element that you want .
    document.getElementById("lang").appendChild(input);
  });
}

async function add_element_to_array_exp(prevAreas) {
  console.log(prevAreas);
  if (prevAreas.length <= 20) {
    $("#flagArea").val("1");

    areas[x2] = await document.getElementById("text2").value;
    x2++;

    let redudantarrayAreas = areas.concat(prevAreas);

    $.each(redudantarrayAreas, function (i, el) {
      if ($.inArray(el, areas) === -1) areas.push(el);
    });

    // document.getElementById("text2").value = "";
    var e = " ";

    let origAreas = [];
    $.each(areas, function (i, el) {
      if ($.inArray(el, origAreas) === -1) origAreas.push(el);
    });

    for (var y = 0; y < origAreas.length; y++) {
      // e += array[y] + "<br/>";
      if (origAreas[y] != undefined) {
        e +=
          `<span id=${origAreas[y]}>` +
          origAreas[y] +
          "<a  id='delService' href='javascript:void(0)'> <i class='fa fa-times' aria-hidden='true'> </i> </a> </span>";
      }
    }
    document.getElementById("exp").innerHTML = e;

    origAreas.forEach(function (area) {
      let input = document.createElement("input");

      input.setAttribute("type", "hidden");
      input.setAttribute("name", "areas[]");
      input.setAttribute("id", "areas");
      input.setAttribute("value", area);

      //append to form element that you want.
      document.getElementById("exp").appendChild(input);
    });

    $("#text2").val("");
  } else {
    $("#area-error").html("Only 20 or less Areas of Expertise are allowed");
  }
}

async function add_element_to_array_ser(prevServices) {
  if (services.length <= 20) {
    $("#flagService").val("1");

    services[x3] = await document.getElementById("text3").value;
    x3++;

    let redudantarrayServices = services.concat(prevServices);

    $.each(redudantarrayServices, function (i, el) {
      if ($.inArray(el, services) === -1) services.push(el);
    });

    // document.getElementById("text2").value = "";
    var e = " ";

    let origServices = [];
    $.each(services, function (i, el) {
      if ($.inArray(el, origServices) === -1) origServices.push(el);
    });

    // document.getElementById("text2").value = "";
    var e = " ";
    for (var y = 0; y < origServices.length; y++) {
      // e += array[y] + "<br/>";
      if (origServices[y] != undefined) {
        e +=
          `<span id="${origServices[y]}">` +
          origServices[y] +
          `<a id='delService' href='javascript:void(0)'> <i class='fa fa-times' aria-hidden='true'> </i> </a> </span>`;
      }
    }
    document.getElementById("ser").innerHTML = e;

    origServices.forEach(function (service) {
      let input = document.createElement("input");

      input.setAttribute("type", "hidden");

      input.setAttribute("name", "services[]");
      input.setAttribute("id", "services");
      input.setAttribute("value", service);

      //append to form element that you want .
      document.getElementById("ser").appendChild(input);
    });

    $("#text3").val("");
  } else {
    $("#serv-error").html("Only 20 or less Service Areas are allowed");
  }
}

async function add_element_to_array_pro() {
  products[x4] = await document.getElementById("text4").value;
  x4++;
  // document.getElementById("text2").value = "";
  var e = " ";
  for (var y = 0; y < products.length; y++) {
    // e += array[y] + "<br/>";
    if (products[y] != undefined) {
      e +=
        "<span>" +
        products[y] +
        "<a href='javascript:void(0)'> <i class='fa fa-times' aria-hidden='true'> </i> </a> </span>";
    }
  }
  document.getElementById("pro").innerHTML = e;

  products.forEach(function (product) {
    let input = document.createElement("input");

    input.setAttribute("type", "hidden");

    input.setAttribute("name", "products[]");

    input.setAttribute("value", product);

    //append to form element that you want .
    document.getElementById("exp").appendChild(input);
  });
}

async function add_element_to_array_tag() {
  tags[x5] = await document.getElementById("text5").value;
  x5++;
  // document.getElementById("text2").value = "";
  var e = " ";
  for (var y = 0; y < tags.length; y++) {
    // e += array[y] + "<br/>";
    if (tags[y] != undefined) {
      e +=
        "<span>" +
        tags[y] +
        "<a href='javascript:void(0)'> <i class='fa fa-times' aria-hidden='true'> </i> </a> </span>";
    }
  }
  document.getElementById("tag").innerHTML = e;

  tags.forEach(function (tag) {
    let input = document.createElement("input");

    input.setAttribute("type", "hidden");

    input.setAttribute("name", "tags[]");

    input.setAttribute("value", tag);

    //append to form element that you want .
    document.getElementById("exp").appendChild(input);
  });
}

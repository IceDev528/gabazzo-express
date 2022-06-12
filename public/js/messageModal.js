// Image upload preview
async function readURL(input) {
  if (input.files && input.files[0]) {
    var reader = new FileReader();

    reader.onload = function (e) {
      $("#blah").attr("src", e.target.result);
    };

    reader.readAsDataURL(input.files[0]);
    console.log(input.id);
    console.log(reader);
    $("#" + input.id + 2).prepend(
      '<span style="margin-right: 15px; color: green; font-weight: bold;">Files attached successfully.</span>'
    );
  }
}

$("#file-1").change(function () {
  console.log("file 1 called");
  readURL(this);
});

$(".inputfile").change(function () {
  console.log("input file called");
  readURL(this);
});

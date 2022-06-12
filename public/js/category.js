const service = document.getElementById("service");
const category = document.getElementById("category");
const service2 = document.getElementById("service2");
const category2 = document.getElementById("category2");
const filters = document.getElementsByClassName("filters");
// const myText = document.getElementById("myText");
// const wordCount = document.getElementById("wordCount");
const create = document.getElementById("create");

service.onchange = function () {
  // console.log(service[1].value);
  if (service.value === "Outdoor Work") {
    $("#category").html(
      "<option>--Select Service Category--</option> <option>Roofing Services</option> <option>Landscaping services</option>   <option>Junk Removal</option> <option>Masonry services</option>"
    );
  } else if (service.value === "Indoor Work") {
    $("#category").html(
      "<option>--Select Service Category--</option> <option>Plumbing Services</option> <option>HVAC Services</option>  <option>Pest Control</option>  <option>Painting Services</option>  <option>Flooring Services</option>  "
    );
  } else if (service.value === "Vehicle Services") {
    $("#category").html(
      "<option>--Select Service Category--</option> <option>Towing Services</option> <option>Vehicle Repair Shop</option>"
    );
  } else if (service.value === "Other Services") {
    $("#category").html(
      "<option>--Select Service Category--</option>   <option>Electrical Services</option> <option>Moving Services</option>  <option>Appliance Services</option> <option>Locksmith Services</option>"
    );
  } else {
    $("#category").html("<option>--Select Service Category--</option>");
  }
};

category.onchange = function () {
  if (category.value === "Roofing Services") {
    $(".filters").html(
      "<option>Inspection</option> <option>Repair</option> <option>Gutter & Downspout Cleaning or Maintenance</option> <option>Tuck Pointing</option> <option>Replace Roof Material</option>"
    );
  } else if (category.value === "Vehicle Repair Shop") {
    $(".filters").html(
      "<option>Oil & Fluid Change</option> <option>Mufflers & Exhaust</option> <option>Suspension Services</option> <option>Brake Change</option> <option>Engine Diagonistic Services/option> <option>Heating & Cooling</option> <option>Wheel & Tire Services</option> <option>Battery Services</option> <option>Check Engine Lights Service</option> <option>Fleet Services</option> <option>Air and Cabin Filter Replacement</option> <option>Wheel Balance and Rotation</option>"
    );
  } else if (category.value === "Landscaping services") {
    $(".filters").html(
      "<option>Patio</option> <option>Walkaway</option> <option>Retaining Wall</option> <option>Artificial Turf</option> <option>Driveway</option> <option>Boulders or Stoners</option> <option>Water Features</option> <option>Arbor and Trellis</option> <option>Decking</option> <option>Porches</option> <option>Other Hardscape Services</option> <option>Lay Grass or Sod</option> <option>Lay Artificial Turf</option> <option>Plant Trees or Shrubs</option> <option>Trim Trees or Shrubs</option> <option>Remove Trees or Shrubs</option> <option>Plant Flower Beds</option> <option>Apply Mulch</option> <option>Install or Repair Sprinklers</option> <option>Install or Repair Drainage</option> <option>Install or Repair Outdoor Lighting</option> <option>Remove Tree Stumps</option> <option>Other Softscape Services</option>"
    );
  } else if (category.value === "Junk Removal") {
    $(".filters").html(
      "<option>Furniture, Appliances, or Electronics</option> <option>Yard Waste, Construction debris or scrap metal</option> <option>Mixed Trash</option> <option>Enough to fill half of a pickup truck</option> <option>Enough to fill one pickup truck</option> <option>Enough to fill two pickup trucks</option> <option>Enough to fill three pickup trucks</option> <option>Enough to fill four pickup trucks</option>"
    );
  } else if (category.value === "Garage services") {
    $(".filters").html(
      "<option>Installation</option> <option>Repair</option> <option>Remodeling</option>"
    );
  } else if (category.value === "Pools, Spas and Hot Tubs") {
    $(".filters").html(
      "<option>Cleaning/Maintenance/Inspection</option> <option>installation</option> <option>Repairs</option>"
    );
  } else if (category.value === "Masonry services") {
    $(".filters").html(
      "<option>Repairs</option> <option>Installation</option>"
    );
  } else if (category.value === "Plumbing Services") {
    $(".filters").html(
      "<option>Repair</option> <option>Installation</option> <option>Inspection</option> <option>Cleaning</option>"
    );
  } else if (category.value === "HVAC Services") {
    $(".filters").html(
      "<option>Central Air Conditioning</option> <option>Duct And Vent Cleaning</option>"
    );
  } else if (category.value === "Pest Control") {
    $(".filters").html(
      "<option>Rodents</option> <option>Cockroaches</option> <option>Ants</option> <option>Bed Bugs</option> <option>Fleas or Mites</option> <option>Bees</option> <option>Spiders</option> <option>Hornets or Wasps</option> <option>Mosquitoes</option> <option>Ticks</option>"
    );
  } else if (category.value === "Painting Services") {
    $(".filters").html(
      "<option>Yes this is a new construction</option> <option>No this is not a new construction</option>"
    );
  } else if (category.value === "") {
    $(".filters").html(
      "<option>Installation</option> <option>Repair</option> <option>Cleaning</option>"
    );
  } else if (category.value === "Flooring Services") {
    $(".filters").html(
      "<option>Installation</option> <option>Repair</option> <option>Cleaning</option>"
    );
  } else if (category.value === "") {
    $(".filters").html("<option></option>");
  } else if (category.value === "Towing Services") {
    $(".filters").html(
      "<option>Flatbed Towing</option> <option>Wheel Lift Towing</option> <option>Exotic & Classic Car Towing</option> <option>Long Distance Towing</option>"
    );
  } else if (category.value === "Oil & Fluid Exchange") {
    $(".filters").html("<option>Oil & Fluid Exchange</option>");
  } else if (category.value === "Body Shop") {
    $(".filters").html("<option>Body Shop</option>");
  } else if (category.value === "Mufflers & Exhaust Services") {
    $(".filters").html("<option>Mufflers & Exhaust Services</option>");
  } else if (category.value === "Suspension Services") {
    $(".filters").html("<option>Suspension Services</option>");
  } else if (category.value === "Brake Change") {
    $(".filters").html("<option>Brake Change</option>");
  } else if (category.value === "Engine Diagnostic Services") {
    $(".filters").html("<option>Engine Diagnostic Services</option>");
  } else if (category.value === "Heating & Cooling") {
    $(".filters").html("<option>Heating & Cooling</option>");
  } else if (category.value === "Wheel & Tire Services") {
    $(".filters").html("<option>Wheel & Tire Services</option>");
  } else if (category.value === "Check Engine Light") {
    $(".filters").html("<option>Check Engine Light</option>");
  } else if (category.value === "Battery Services") {
    $(".filters").html("<option>Battery Services</option>");
  } else if (category.value === "Window Tinting") {
    $(".filters").html("<option>Window Tinting</option>");
  } else if (category.value === "Fleet Services") {
    $(".filters").html("<option>Fleet Services</option>");
  } else if (category.value === "Electrical Services") {
    $(".filters").html(
      "<option>Electrical & Wiring Repair</option> <option>Lighting Installation</option> <option>Fan Installation</option> <option>Switch and Outlet Repair</option> <option>Switch and Outlet Installation</option>"
    );
  } else if (category.value === "Moving Services") {
    $(".filters").html(
      "<option>Furniture assembly and disassembly</option> <option>Storage</option> <option>Piano Moving</option> <option>Pool table moving</option> <option>Packing</option> <option>Equipment Moving</option> <option>Safe or Security Box Mobinh</option> <option>Automobile moving</option>"
    );
  } else if (category.value === "Appliance Services") {
    $(".filters").html(
      "<option>Washer</option> <option>Dryer</option> <option>Refigerator</option> <option>Dishwasher</option> Oven/Stove</option> <option>Microwave</option> <option>Other, I need to talk to a pro</option>"
    );
  } else if (category.value === "Locksmith Services") {
    $(".filters").html(
      "<option>A lost key</option> <option>need a replacement key</option> <option>Install or replace current lock system</option> <option>Locked Out</option> <option>Re-Key Lock for different keys to work</option> <option>Repair Broken Lock</option> <option>Copy Keys</option> <option>Deadbolt</option> <option>Vehicle Lock</option> <option>Doorknob</option> <option>Mailbox</option> <option>Office furniture</option> <option>Electronic combination pad<//option> <option>Keyless remote</option> <option>Other</option>"
    );
  } else {
    $("#category").html("<option>--Select Filter--</option>");
  }
};

function addRow() {
  const div = document.createElement("div");

  div.className = "form-row";

  div.innerHTML = create.innerHTML;
  document.getElementById("content").appendChild(div);
}

function removeRow(input) {
  document.getElementById("content").removeChild(input.parentNode.parentNode);
}

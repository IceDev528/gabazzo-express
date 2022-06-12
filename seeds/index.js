require("dotenv").config();
const mongoose = require('mongoose');
const AvailableServices = require('../models/availableServices');

/*An array containing all the services*/
var services = [
    "Roofing Services",
    "Landscaping Services",
    "Junk Removal",
    "Masonry Services",
    "Plumbing Services",
    "HVAC Services",
    "Pest Control",
    "Painting Services",
    "Flooring Services",
    "Towing Services",
    "Oil & Fluid Exchange",
    "Body Shop",
    "Mufflers & Exhaust Services",
    "Suspension Services",
    "Brake Change",
    "Engine Diagnostic Services",
    "Heating & Cooling",
    "Wheel & Tire Services",
    "Check Engine Light",
    "Battery Services",
    "Window Tinting",
    "Fleet Services",
    "Electrical Services",
    "Moving Services",
    "Demolition Services",
    "Appliance Services",
    "Locksmith Services",
  ];

  mongoose.connect(process.env.mongoURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  mongoose.set("useCreateIndex", true);
  
  const db = mongoose.connection;
  db.on("error", console.error.bind(console, "connection error:"));
  db.once("open", () => {
    console.log("WE'RE CONNECTED!");
  });

const seedDb = async () => {
    for(let i=0;i<services.length;i++){
        let title = services[i].toLowerCase();
        await AvailableServices.create({
            title
        })
    }
}

seedDb().then(() => {
    mongoose.connection.close();
})
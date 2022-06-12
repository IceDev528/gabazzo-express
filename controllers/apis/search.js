if (process.env.NODE_ENV !== 'production') require('dotenv').config()
const User = require("../../models/users");
const AvailableServices = require("../../models/availableServices");
const mongoose = require("mongoose");
//connect to the database
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

exports.search = async (req, res, next) => {
  try {
    const { query } = req.query;
    const companies = User.aggregate([
      {
        $match: {
          companyName: {
            $regex: `^${query}`,
          },
        },
      },
      {
        $project: {
          searchKey: "$_id",
          value: "$companyName",
        },
      },
    ]);

    const services = AvailableServices.aggregate([
      {
        $match: {
          title: {
            $regex: `^${query}`,
          },
        },
      },
      {
        $project: {
          searchKey: "$_id",
          value: "$title",
        },
      },
    ]);

    const categories = db
      .collection("search_categories_view")
      .aggregate([
        {
          $match: {
            category: {
              $regex: new RegExp("^" + query, "i"),
            },
          },
        },
        {
          $project: {
            title: "$title",
            searchKey: "$_id",
            value: "$category",
          },
        },
      ])
      .toArray();

    const results = await Promise.all([companies, services, categories]);

    res.json({
      companySuggestions: results[0],
      serviceSuggestions: results[1],
      categorySuggestions: results[2],
    });
  } catch (e) {
    next(e);
  }
};

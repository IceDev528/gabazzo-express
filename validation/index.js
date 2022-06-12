const { body } = require("express-validator/check");

exports.validate = (method) => {
  switch (method) {
    case "putServices": {
      return [
        body(
          "teamInfo",
          "The Info should be less than or equal to 600 characters long."
        ).isLength({ max: 10 }),
      ];
    }
  }
};

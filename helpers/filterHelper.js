const generateQuery = (arr) => {
  return arr.reduce((result, item) => {
    const { key, value } = item;
    result[key] = value;
    return result;
  }, {});
};

exports.makeSearchParams = (query) => {
  const {
    languageFilter,
    emergencySeven,
    online,
    reviewFilter,
    minBudget,
    maxBudget,
    financingAvailable,
    verified,
    licensed,
    insured,
    bonded,
    location_distance,
    category,
  } = query;

  let searchParams = {};
  let keyValuePairs = [];

  /*
    companyInfo is the key to access the Company fields - Users modal
    filter is the key in the Services Model
  */

  if (category) searchParams.category = category.toLowerCase();

  if (online)
    keyValuePairs.push({
      key: "companyInfo.status",
      value: online,
    });

  if (languageFilter)
    keyValuePairs.push({
      key: "companyInfo.language",
      value: languageFilter,
    });

  if (verified)
    keyValuePairs.push({
      key: "companyInfo.isEmailVerified",
      value: verified,
    });

  // if (reviewFilter)
  //   keyValuePairs.push({
  //     key: "companyInfo.reviewFilter",
  //     value: reviewFilter,
  //   });

  if (financingAvailable)
    keyValuePairs.push({
      key: "companyInfo.isFinancingAvailable",
      value: financingAvailable,
    });

  if (licensed)
    keyValuePairs.push({
      key: "companyInfo.isLicensed",
      value: licensed,
    });

  if (insured)
    keyValuePairs.push({
      key: "companyInfo.isInsured",
      value: insured,
    });
  if (bonded)
    keyValuePairs.push({
      key: "companyInfo.isBonded",
      value: bonded,
    });

  if (minBudget) searchParams.priceTo = minBudget;
  if (maxBudget) searchParams.priceFrom = maxBudget;

  if (query["Service Type"])
    keyValuePairs.push({
      key: "filter.Service Type",
      value: query["Service Type"],
    });
  if (query["Material Type"])
    keyValuePairs.push({
      key: "filter.Material Type",
      value: query["Material Type"],
    });
  if (query["Property Type"])
    keyValuePairs.push({
      key: "filter.Property Type",
      value: query["Property Type"],
    });
  if (emergencySeven)
    keyValuePairs.push({
      key: "filter.Other Filters",
      value: "Emergency 24/7",
    });
  if (query["Pest Type"])
    keyValuePairs.push({
      key: "filter.Pest Type",
      value: query["Pest Type"],
    });
  if (query["Appliance Type"])
    keyValuePairs.push({
      key: "filter.Appliance Type",
      value: query["Appliance Type"],
    });
  if (query["Lock Type"])
    keyValuePairs.push({
      key: "filter.Lock Type",
      value: query["Lock Type"],
    });
  if (query["Junk Type"])
    keyValuePairs.push({
      key: "filter.Junk Type",
      value: query["Junk Type"],
    });
  if (query["Haul Size"])
    keyValuePairs.push({
      key: "filter.Haul Type",
      value: query["Haul Type"],
    });
  if (query["Type of Moving Truck"])
    keyValuePairs.push({
      key: "filter.Type of Moving Truck",
      value: query["Type of Moving Truck"],
    });
  if (query["Truck Tow Type"])
    keyValuePairs.push({
      key: "filter.Truck Tow Type",
      value: query["Truck Tow Type"],
    });
  if (query["Vehicle Type"])
    keyValuePairs.push({
      key: "filter.Vehicle Type",
      value: query["Vehicle Type"],
    });

  // Generating the query according to the document structure
  searchParams = {
    ...searchParams,
    ...generateQuery(keyValuePairs),
  };

  return searchParams;
};

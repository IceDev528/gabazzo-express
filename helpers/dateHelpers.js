exports.differenceInHours = (date1, date2) => {
  return Math.abs(date1 - date2) / 36e5;
};

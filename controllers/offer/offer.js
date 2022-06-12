const Offer = require("../../models/offer");
const Service = require("../../models/service");

exports.getMyOffers = async (req, res, next) => {
  const offers = await Offer.find({
    $or: [
      {
        sender: req.user.id,
      },
      {
        receiver: req.user.id,
      },
    ],
  });
  await res.status(200).json({
    offers,
  });
};

exports.getSingleOffer = async (req, res) => {
  const offer = await Offer.findById(req.params.id);
  await res.status(200).json({
    offer,
  });
};

exports.getOrderDetailsSinglePaymentPage = async (req, res) => {
  let offerId = req.params.id;
  const offer = await Offer.findById(offerId);
  const service = await Service.findById(offer.service);

  res.render("payment/single-payment/order-details-single-payment", {
    // title: "Order Details Single Payment",
    offer,
    service,
    offerId,
  });
};

exports.getConfirmAndSinglePay = async (req, res) => {
  let offerId = req.params.id;
  const offer = await Offer.findById(offerId);
  const service = await Service.findById(offer.service);

  res.render("payment/single-payment/confirm-and-pay", {
    // title: "Order Details Single Payment",
    paypalClientId: process.env.PAYPAL_CLIENT_ID,
    offer,
    service,
    offerId,
  });
};

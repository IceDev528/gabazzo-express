const stripe = require("stripe")(process.env.STRIPE_KEY);

const RefundPayment = async (charge) => {
  try {
    const refund = await stripe.refunds.create({
      charge: charge,
    });
    return refund;
  } catch (err) {
    throw err;
  }
};

module.exports = RefundPayment;

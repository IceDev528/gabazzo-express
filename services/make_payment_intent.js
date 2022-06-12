const stripe = require("stripe")(process.env.STRIPE_KEY);

const MakePaymentIntent = async (total, customer_id) => {
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: (parseFloat(total) * 100).toFixed(0),
      currency: "usd",
      payment_method_types: ["card"],
      customer: customer_id,
    });
    const result = await PaymentIntentAccept(paymentIntent.id);
    return paymentIntent.id;
  } catch (err) {
    throw err;
  }
};

const PaymentIntentAccept = async (paymentIntent_id) => {
  try {
    const paymentIntentAccept = await stripe.paymentIntents.confirm(
      paymentIntent_id,
      {
        payment_method: "pm_card_visa",
      }
    );
    return paymentIntentAccept;
  } catch (err) {
    throw err;
  }
};

module.exports = MakePaymentIntent;

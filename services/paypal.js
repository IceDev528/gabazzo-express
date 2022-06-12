var fetch = require("node-fetch");

const { PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET } = process.env;

const base_url_v1 = `https://api-m.sandbox.paypal.com/v1`;
const base_url_v2 = `https://api-m.sandbox.paypal.com/v2`;

console.log(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`);

exports.generatePaypalToken = () => {
  return fetch(`${base_url_v1}/oauth2/token`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Accept-Language": "en_US",
      Authorization: `Basic ${Buffer.from(
        `${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`
      ).toString("base64")}`,
    },
    body: "grant_type=client_credentials",
  });
};

exports.getPaypalOrderDetails = (order_id, token) => {
  return fetch(`${base_url_v2}/checkout/orders/${order_id}`, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });
};

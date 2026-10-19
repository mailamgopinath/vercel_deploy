// Talks to Razorpay. We call their web API directly (no extra package needed).
// Docs: https://razorpay.com/docs/api/orders/
//
// Needs two values in server/.env  (Razorpay dashboard > Account & Settings > API keys):
//   RAZORPAY_KEY_ID=rzp_test_xxxxxxxx
//   RAZORPAY_KEY_SECRET=xxxxxxxxxxxxxxxx      <- keep this secret, never put it in the React app

const crypto = require("crypto");

function getKeys() {
  const id = process.env.RAZORPAY_KEY_ID;
  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!id || !secret) {
    throw new Error("Online payment is not set up yet (the Razorpay keys are missing on the server)");
  }
  return { id, secret };
}

// Is online payment switched on? (the shop uses this to hide the option if not)
function isConfigured() {
  return Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);
}

// Send one request to Razorpay and return its answer.
async function razorpayRequest(method, path, body) {
  const { id, secret } = getKeys();

  const response = await fetch(`https://api.razorpay.com/v1${path}`, {
    method,
    headers: {
      Authorization: "Basic " + Buffer.from(`${id}:${secret}`).toString("base64"),
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error?.description || "Razorpay did not accept the request");
  }
  return data;
}

// Step 1 of paying: tell Razorpay "I expect a payment of this much".
// Razorpay works in paise (1 rupee = 100 paise).
function createRazorpayOrder(amountInRupees, receipt) {
  return razorpayRequest("POST", "/orders", {
    amount: amountInRupees * 100,
    currency: "INR",
    receipt: String(receipt),
  });
}

// All the payments tried against one Razorpay order.
async function fetchOrderPayments(razorpayOrderId) {
  const data = await razorpayRequest("GET", `/orders/${razorpayOrderId}/payments`);
  return data.items || [];
}

// Step 3 of paying: prove the payment is real.
// After paying, the browser gives us 3 values. Razorpay signs them with our secret key,
// so only a genuine payment produces a matching signature. A faked one will not match.
function isSignatureValid(razorpayOrderId, razorpayPaymentId, signature) {
  const { secret } = getKeys();
  const expected = crypto
    .createHmac("sha256", secret)
    .update(`${razorpayOrderId}|${razorpayPaymentId}`)
    .digest("hex");

  const a = Buffer.from(expected);
  const b = Buffer.from(String(signature || ""));
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

module.exports = { isConfigured, getKeys, createRazorpayOrder, fetchOrderPayments, isSignatureValid };

// Handles online orders that are still waiting for payment.
//
// Why this exists: a customer can start paying and then close the tab, lose internet,
// or pay but never return to our site. We must never (a) keep stock locked forever, or
// (b) cancel an order the customer actually paid for. So before cancelling anything
// we ask Razorpay whether a payment really went through.

const db = require("../db");
const { fetchOrderPayments } = require("./razorpay");
const { cancelUnpaidOrder, markOrderPaid } = require("./placeOrder");

const WAIT_MINUTES = 30; // how long an unpaid order may wait

// Ask Razorpay about one order. Returns:
//   "paid"    -> a payment was captured, the order is now marked paid
//   "unpaid"  -> Razorpay confirms nothing was paid
//   "unknown" -> we could not reach Razorpay (leave the order alone and try later)
async function checkWithRazorpay(order) {
  if (!order.razorpay_order_id) return "unpaid";
  try {
    const payments = await fetchOrderPayments(order.razorpay_order_id);
    const captured = payments.find((payment) => payment.status === "captured");
    if (captured) {
      await markOrderPaid(order.id, captured.id);
      return "paid";
    }
    return "unpaid";
  } catch (error) {
    return "unknown";
  }
}

// Cancel an unpaid order, but only if Razorpay confirms there is no payment.
async function cancelIfReallyUnpaid(order) {
  const result = await checkWithRazorpay(order);
  if (result === "unpaid") {
    await cancelUnpaidOrder(order.id);
  }
  return result;
}

// Clean up orders that have waited too long. Runs every few minutes (see server.js).
async function releaseStaleOrders() {
  const [orders] = await db.query(
    `SELECT * FROM orders
     WHERE status = 'awaiting_payment' AND created_at < (NOW() - INTERVAL ${WAIT_MINUTES} MINUTE)`
  );
  for (const order of orders) {
    await cancelIfReallyUnpaid(order);
  }
}

module.exports = { checkWithRazorpay, cancelIfReallyUnpaid, releaseStaleOrders };

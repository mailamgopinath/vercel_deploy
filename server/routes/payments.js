// Online payment with Razorpay. Everything except /config needs login.
//
//   GET  /api/payments/config         { enabled }               is online payment switched on? (no login needed)
//   POST /api/payments/create-order   the bag -> our order + a Razorpay order to pay
//   POST /api/payments/verify         check the payment is genuine, then confirm the order
//   POST /api/payments/cancel         the customer closed the payment window
//
// How paying works, step by step:
//   1. The shop calls create-order. We check the bag, save the order as "awaiting_payment"
//      (stock is reserved) and ask Razorpay for a payment order.
//   2. The browser opens Razorpay's payment window and the customer pays.
//   3. Razorpay hands the browser a payment id + signature. The shop sends them to verify.
//      We check the signature with our secret key. Only then is the order confirmed.

const express = require("express");
const db = require("../db");
const { loginRequired } = require("../middleware/auth");
const { createOrder, cancelUnpaidOrder, markOrderPaid } = require("../utils/placeOrder");
const { isConfigured, getKeys, createRazorpayOrder, isSignatureValid } = require("../utils/razorpay");
const { cancelIfReallyUnpaid, releaseStaleOrders } = require("../utils/unpaidOrders");

const router = express.Router();

// Lets the cart page know whether to offer "Pay online". Open to everyone.
router.get("/config", (req, res) => {
  res.json({ enabled: isConfigured() });
});

// Everything below needs the customer to be logged in.
router.use(loginRequired);

// ---- Step 1: create the order and the Razorpay payment order ----
router.post("/create-order", async (req, res) => {
  if (!isConfigured()) {
    return res.status(503).json({ message: "Online payment is not available right now. Please choose Cash on Delivery." });
  }

  // Free up stock held by old abandoned payments before checking stock.
  await releaseStaleOrders().catch(() => {});

  let order;
  try {
    order = await createOrder(req.user.id, req.body, { status: "awaiting_payment", paymentMethod: "razorpay" });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }

  try {
    const razorpayOrder = await createRazorpayOrder(order.total, `order_${order.orderId}`);
    await db.query("UPDATE orders SET razorpay_order_id = ? WHERE id = ?", [razorpayOrder.id, order.orderId]);

    res.status(201).json({
      orderId: order.orderId,
      razorpayOrderId: razorpayOrder.id,
      amount: razorpayOrder.amount, // in paise
      currency: razorpayOrder.currency,
      keyId: getKeys().id,          // the PUBLIC key id; the secret never leaves the server
    });
  } catch (error) {
    // Razorpay refused: nobody can pay for this order, so give the stock back.
    await cancelUnpaidOrder(order.orderId);
    res.status(502).json({ message: error.message });
  }
});

// ---- Step 3: the customer paid -- prove it is real ----
router.post("/verify", async (req, res) => {
  const { orderId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

  const [rows] = await db.query("SELECT * FROM orders WHERE id = ? AND user_id = ?", [orderId, req.user.id]);
  const order = rows[0];

  if (!order || order.razorpay_order_id !== razorpay_order_id) {
    return res.status(404).json({ message: "Order not found" });
  }

  // Already confirmed earlier (for example by a double click)? Nothing more to do.
  if (order.payment_status === "paid") {
    return res.json({ orderId: order.id, message: "Payment confirmed" });
  }

  if (!isSignatureValid(razorpay_order_id, razorpay_payment_id, razorpay_signature)) {
    return res.status(400).json({ message: "Payment could not be verified. If money was deducted, please contact us with your payment id." });
  }

  const changed = await markOrderPaid(order.id, razorpay_payment_id);
  if (!changed) {
    // The order was cancelled (for example the payment window sat open too long).
    return res.status(409).json({ message: `This order expired before the payment reached us. If money was deducted, please contact us and quote payment id ${razorpay_payment_id}.` });
  }

  res.json({ orderId: order.id, message: "Payment confirmed" });
});

// ---- The customer closed the payment window without paying ----
router.post("/cancel", async (req, res) => {
  const [rows] = await db.query(
    "SELECT * FROM orders WHERE id = ? AND user_id = ? AND status = 'awaiting_payment'",
    [req.body.orderId, req.user.id]
  );
  const order = rows[0];
  if (!order) return res.json({ cancelled: false });

  // Closing the window right after paying must not cancel a paid order,
  // so we ask Razorpay first.
  const result = await cancelIfReallyUnpaid(order);
  res.json({ cancelled: result === "unpaid", paid: result === "paid" });
});

module.exports = router;

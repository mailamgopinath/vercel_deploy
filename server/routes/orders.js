// Orders. Every route needs login.
//   POST /api/orders              place an order from the cart
//   GET  /api/orders              my past orders
//   POST /api/orders/:id/return   ask to return a delivered order

const express = require("express");
const db = require("../db");
const { loginRequired } = require("../middleware/auth");
const { createOrder } = require("../utils/placeOrder");

const router = express.Router();

router.use(loginRequired);

// ---- PLACE AN ORDER (Cash on Delivery) ----
// The frontend sends:
//   { address: "...", coupon: "SAVE10" (optional),
//     items: [ { productId: 1, quantity: 2, size: "M", color: "Black" }, ... ] }
// The checking and saving is done by utils/placeOrder.js (shared with online payment).
// Paying online with Razorpay goes through routes/payments.js instead.
router.post("/", async (req, res) => {
  try {
    const order = await createOrder(req.user.id, req.body, { status: "placed", paymentMethod: "cod" });
    res.status(201).json(order);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// ---- MY ORDERS ----
router.get("/", async (req, res) => {
  const [orders] = await db.query(
    `SELECT orders.*, returns.status AS return_status
     FROM orders
     LEFT JOIN returns ON returns.order_id = orders.id
     WHERE orders.user_id = ? AND orders.status <> 'awaiting_payment'
     ORDER BY orders.created_at DESC`,
    [req.user.id]
  );

  for (const order of orders) {
    const [items] = await db.query(
      `SELECT order_items.quantity, order_items.price, products.name, products.image
       FROM order_items
       JOIN products ON products.id = order_items.product_id
       WHERE order_items.order_id = ?`,
      [order.id]
    );
    order.items = items;
  }
  res.json(orders);
});

// ---- ASK TO RETURN AN ORDER ----
// Only your own, already delivered orders. One request per order.
router.post("/:id/return", async (req, res) => {
  const { reason } = req.body;
  if (!reason || !reason.trim()) {
    return res.status(400).json({ message: "Please tell us why you want to return it" });
  }

  const [orders] = await db.query(
    "SELECT * FROM orders WHERE id = ? AND user_id = ?",
    [req.params.id, req.user.id]
  );
  const order = orders[0];

  if (!order) return res.status(404).json({ message: "Order not found" });
  if (order.status !== "delivered") {
    return res.status(400).json({ message: "Only delivered orders can be returned" });
  }

  const [existing] = await db.query("SELECT id FROM returns WHERE order_id = ?", [order.id]);
  if (existing.length > 0) {
    return res.status(409).json({ message: "A return was already requested for this order" });
  }

  await db.query(
    "INSERT INTO returns (order_id, user_id, reason) VALUES (?, ?, ?)",
    [order.id, req.user.id, reason]
  );
  res.status(201).json({ message: "Return requested" });
});

module.exports = router;

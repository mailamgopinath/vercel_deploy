// Admin: return and refund requests.
//   GET /api/admin/returns            all requests
//   PUT /api/admin/returns/:id        { status: "approved" | "rejected" | "refunded" }
//
// A request moves like this:   requested -> approved -> refunded
//                              requested -> rejected
// "Refunded" puts the items back in stock and marks the order as "returned".
// NOTE: this store has no payment gateway yet, so "refunded" only records that you
// sent the money back -- you still return the money yourself.

const express = require("express");
const db = require("../db");
const { loginRequired, adminOnly } = require("../middleware/auth");
const { restoreStock } = require("../utils/products");

const router = express.Router();
router.use(loginRequired, adminOnly);

// For each current status, which new statuses are allowed.
const allowedNext = {
  requested: ["approved", "rejected"],
  approved: ["refunded"],
  rejected: [],
  refunded: [],
};

router.get("/", async (req, res) => {
  const [returns] = await db.query(
    `SELECT returns.*, orders.total AS order_total, users.name AS customer_name, users.email AS customer_email
     FROM returns
     JOIN orders ON orders.id = returns.order_id
     JOIN users ON users.id = returns.user_id
     ORDER BY returns.created_at DESC`
  );
  res.json(returns);
});

router.put("/:id", async (req, res) => {
  const { status } = req.body;

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const [rows] = await connection.query("SELECT * FROM returns WHERE id = ? FOR UPDATE", [req.params.id]);
    const request = rows[0];
    if (!request) throw new Error("Return request not found");

    if (!allowedNext[request.status].includes(status)) {
      throw new Error(`A ${request.status} request can't become ${status}`);
    }

    if (status === "refunded") {
      const [orders] = await connection.query("SELECT total FROM orders WHERE id = ?", [request.order_id]);
      await restoreStock(request.order_id, connection);
      await connection.query("UPDATE orders SET status = 'returned' WHERE id = ?", [request.order_id]);
      await connection.query("UPDATE returns SET status = ?, refund_amount = ? WHERE id = ?", [status, orders[0].total, request.id]);
    } else {
      await connection.query("UPDATE returns SET status = ? WHERE id = ?", [status, request.id]);
    }

    await connection.commit();
    res.json({ message: "Return updated" });
  } catch (error) {
    await connection.rollback();
    res.status(400).json({ message: error.message });
  } finally {
    connection.release();
  }
});

module.exports = router;

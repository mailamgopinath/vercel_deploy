// Admin: moderate customer reviews.
//   GET    /api/admin/reviews        all reviews
//   PUT    /api/admin/reviews/:id    { status: "visible" | "hidden" }
//   DELETE /api/admin/reviews/:id

const express = require("express");
const db = require("../db");
const { loginRequired, adminOnly } = require("../middleware/auth");
const { recalcRating } = require("../utils/products");

const router = express.Router();
router.use(loginRequired, adminOnly);

router.get("/", async (req, res) => {
  const [reviews] = await db.query(
    `SELECT reviews.*, products.name AS product_name, users.name AS user_name
     FROM reviews
     JOIN products ON products.id = reviews.product_id
     JOIN users ON users.id = reviews.user_id
     ORDER BY reviews.created_at DESC`
  );
  res.json(reviews);
});

router.put("/:id", async (req, res) => {
  const { status } = req.body;
  if (status !== "visible" && status !== "hidden") {
    return res.status(400).json({ message: "Status must be visible or hidden" });
  }

  const [rows] = await db.query("SELECT product_id FROM reviews WHERE id = ?", [req.params.id]);
  if (rows.length === 0) return res.status(404).json({ message: "Review not found" });

  await db.query("UPDATE reviews SET status = ? WHERE id = ?", [status, req.params.id]);
  await recalcRating(rows[0].product_id);
  res.json({ message: "Review updated" });
});

router.delete("/:id", async (req, res) => {
  const [rows] = await db.query("SELECT product_id FROM reviews WHERE id = ?", [req.params.id]);
  if (rows.length === 0) return res.status(404).json({ message: "Review not found" });

  await db.query("DELETE FROM reviews WHERE id = ?", [req.params.id]);
  await recalcRating(rows[0].product_id);
  res.json({ message: "Review deleted" });
});

module.exports = router;

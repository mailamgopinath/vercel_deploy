// Product reviews that customers write and read.
//   GET  /api/reviews?productId=3    visible reviews of a product
//   POST /api/reviews                { productId, rating (1-5), comment }   -- login needed

const express = require("express");
const db = require("../db");
const { loginRequired } = require("../middleware/auth");
const { recalcRating } = require("../utils/products");

const router = express.Router();

router.get("/", async (req, res) => {
  const [reviews] = await db.query(
    `SELECT reviews.id, reviews.rating, reviews.comment, reviews.created_at, users.name AS user_name
     FROM reviews
     JOIN users ON users.id = reviews.user_id
     WHERE reviews.product_id = ? AND reviews.status = 'visible'
     ORDER BY reviews.created_at DESC`,
    [req.query.productId]
  );
  res.json(reviews);
});

router.post("/", loginRequired, async (req, res) => {
  const { productId, comment } = req.body;
  const rating = Number(req.body.rating);

  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return res.status(400).json({ message: "Rating must be from 1 to 5" });
  }

  const [products] = await db.query("SELECT id FROM products WHERE id = ?", [productId]);
  if (products.length === 0) return res.status(404).json({ message: "Product not found" });

  try {
    await db.query(
      "INSERT INTO reviews (product_id, user_id, rating, comment) VALUES (?, ?, ?, ?)",
      [productId, req.user.id, rating, comment || null]
    );
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ message: "You already reviewed this product" });
    }
    throw error;
  }

  await recalcRating(productId); // keep the product's star rating up to date
  res.status(201).json({ message: "Thanks for your review" });
});

module.exports = router;

// Wishlist (the heart button). Every route needs login.
//   GET    /api/wishlist               my saved products
//   POST   /api/wishlist/:productId    save a product
//   DELETE /api/wishlist/:productId    remove a product

const express = require("express");
const db = require("../db");
const { loginRequired } = require("../middleware/auth");

const router = express.Router();

// Every route below needs the user to be logged in.
router.use(loginRequired);

router.get("/", async (req, res) => {
  const [products] = await db.query(
    `SELECT products.* FROM wishlist
     JOIN products ON products.id = wishlist.product_id
     WHERE wishlist.user_id = ?`,
    [req.user.id]
  );
  res.json(products);
});

router.post("/:productId", async (req, res) => {
  // INSERT IGNORE = do nothing if it is already saved.
  await db.query(
    "INSERT IGNORE INTO wishlist (user_id, product_id) VALUES (?, ?)",
    [req.user.id, req.params.productId]
  );
  res.status(201).json({ message: "Saved" });
});

router.delete("/:productId", async (req, res) => {
  await db.query(
    "DELETE FROM wishlist WHERE user_id = ? AND product_id = ?",
    [req.user.id, req.params.productId]
  );
  res.json({ message: "Removed" });
});

module.exports = router;

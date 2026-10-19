// Small helpers that keep product numbers correct. Used by several routes.

const db = require("../db");

// If a product has size/color variants, its stock is the total of them.
async function recalcStock(productId, connection = db) {
  const [[row]] = await connection.query(
    "SELECT COUNT(*) AS variants, COALESCE(SUM(stock), 0) AS total FROM product_variants WHERE product_id = ?",
    [productId]
  );
  if (row.variants > 0) {
    await connection.query("UPDATE products SET stock = ? WHERE id = ?", [row.total, productId]);
  }
}

// Put an order's items back into stock (used when an order is cancelled or refunded).
async function restoreStock(orderId, connection = db) {
  const [items] = await connection.query("SELECT * FROM order_items WHERE order_id = ?", [orderId]);

  for (const item of items) {
    await connection.query("UPDATE products SET stock = stock + ? WHERE id = ?", [item.quantity, item.product_id]);

    // If this exact size + color is tracked as a variant, restore that too.
    if (item.size && item.color) {
      await connection.query(
        "UPDATE product_variants SET stock = stock + ? WHERE product_id = ? AND size = ? AND color = ?",
        [item.quantity, item.product_id, item.size, item.color]
      );
    }
  }
}

// A product's star rating = the average of its visible reviews.
async function recalcRating(productId) {
  const [[row]] = await db.query(
    "SELECT COUNT(*) AS count, AVG(rating) AS average FROM reviews WHERE product_id = ? AND status = 'visible'",
    [productId]
  );
  if (row.count > 0) {
    await db.query("UPDATE products SET rating = ? WHERE id = ?", [Number(row.average).toFixed(1), productId]);
  }
}

module.exports = { recalcStock, restoreStock, recalcRating };

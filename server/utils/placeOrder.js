// The one place that turns a shopping bag into an order.
// Used for Cash on Delivery (routes/orders.js) and for online payment (routes/payments.js).

const db = require("../db");
const { couponProblem } = require("./coupon");
const { restoreStock } = require("./products");

// Check the bag, work out the price, save the order and reserve the stock.
//   body:    { address, items: [{ productId, quantity, size, color }], coupon }
//   options: { status, paymentMethod }
// Returns { orderId, total }. Throws an Error with a friendly message if anything is wrong.
//
// We IGNORE any price the frontend might send and read the real price from
// the database. Otherwise someone could buy a shirt for Rs. 1.
async function createOrder(userId, body, { status = "placed", paymentMethod = "cod" } = {}) {
  const { address, items, coupon } = body;

  if (!address || !Array.isArray(items) || items.length === 0) {
    throw new Error("Address and at least one item are required");
  }

  // A transaction = "all or nothing". If anything fails, we undo every step,
  // so we never end up with half an order.
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    let subtotal = 0;
    const lines = []; // the checked items, with real prices

    for (const item of items) {
      const [rows] = await connection.query(
        "SELECT * FROM products WHERE id = ? FOR UPDATE", // lock the row while we check stock
        [item.productId]
      );
      const product = rows[0];
      const quantity = Number(item.quantity);

      if (!product || product.status !== "active") {
        throw new Error(`Product ${item.productId} is not available`);
      }
      if (!Number.isInteger(quantity) || quantity < 1) {
        throw new Error(`Invalid quantity for ${product.name}`);
      }
      if (product.stock < quantity) {
        throw new Error(`Only ${product.stock} left of ${product.name}`);
      }

      // Does the admin track stock for this exact size + color? If so, check it too.
      let variant = null;
      if (item.size && item.color) {
        const [variants] = await connection.query(
          "SELECT * FROM product_variants WHERE product_id = ? AND size = ? AND color = ? FOR UPDATE",
          [product.id, item.size, item.color]
        );
        variant = variants[0] || null;
        if (variant && variant.stock < quantity) {
          throw new Error(`Only ${variant.stock} left of ${product.name} (${item.size}, ${item.color})`);
        }
      }

      subtotal += product.price * quantity;
      lines.push({ product, quantity, variant, size: item.size || null, color: item.color || null });
    }

    // Coupon: looked up in the database and checked.
    let discount = 0;
    let couponCode = null;
    if (coupon) {
      const [coupons] = await connection.query("SELECT * FROM coupons WHERE code = ? FOR UPDATE", [coupon]);
      const problem = couponProblem(coupons[0], subtotal);
      if (problem) throw new Error(problem);

      discount = Math.round((subtotal * coupons[0].discount_percent) / 100);
      couponCode = coupons[0].code;
      await connection.query("UPDATE coupons SET used_count = used_count + 1 WHERE id = ?", [coupons[0].id]);
    }

    // Delivery is free for items worth Rs. 999 or more, otherwise Rs. 80.
    const delivery = subtotal >= 999 ? 0 : 80;
    const total = subtotal - discount + delivery;

    // Save the order.
    const [order] = await connection.query(
      `INSERT INTO orders (user_id, subtotal, discount, delivery, coupon_code, total, address, status, payment_method)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [userId, subtotal, discount, delivery, couponCode, total, address, status, paymentMethod]
    );

    // Save each item, and reduce the stock.
    for (const line of lines) {
      await connection.query(
        "INSERT INTO order_items (order_id, product_id, quantity, price, size, color) VALUES (?, ?, ?, ?, ?, ?)",
        [order.insertId, line.product.id, line.quantity, line.product.price, line.size, line.color]
      );
      await connection.query("UPDATE products SET stock = stock - ? WHERE id = ?", [line.quantity, line.product.id]);
      if (line.variant) {
        await connection.query("UPDATE product_variants SET stock = stock - ? WHERE id = ?", [line.quantity, line.variant.id]);
      }
    }

    await connection.commit(); // everything worked -- save it for real
    return { orderId: order.insertId, total };
  } catch (error) {
    await connection.rollback(); // something failed -- undo everything
    throw error;
  } finally {
    connection.release(); // always give the connection back
  }
}

// An online order that was never paid: cancel it and give the stock (and coupon) back.
// Returns true if it was cancelled, false if it wasn't waiting for payment any more.
async function cancelUnpaidOrder(orderId) {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const [rows] = await connection.query(
      "SELECT * FROM orders WHERE id = ? AND status = 'awaiting_payment' FOR UPDATE",
      [orderId]
    );
    const order = rows[0];
    if (!order) {
      await connection.rollback();
      return false;
    }

    await restoreStock(order.id, connection);
    if (order.coupon_code) {
      await connection.query("UPDATE coupons SET used_count = GREATEST(used_count - 1, 0) WHERE code = ?", [order.coupon_code]);
    }
    await connection.query("UPDATE orders SET status = 'cancelled', payment_status = 'failed' WHERE id = ?", [order.id]);

    await connection.commit();
    return true;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

// The payment arrived: the order becomes a normal "placed" order.
// Returns true if it changed, false if it was already handled.
async function markOrderPaid(orderId, paymentId) {
  const [result] = await db.query(
    `UPDATE orders SET status = 'placed', payment_status = 'paid', razorpay_payment_id = ?
     WHERE id = ? AND status = 'awaiting_payment'`,
    [paymentId, orderId]
  );
  return result.affectedRows > 0;
}

module.exports = { createOrder, cancelUnpaidOrder, markOrderPaid };

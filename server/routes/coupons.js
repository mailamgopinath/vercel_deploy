// Lets the cart check a coupon code before the customer pays.
//   POST /api/coupons/validate    { code, subtotal }  ->  { code, percent, discount }

const express = require("express");
const db = require("../db");
const { couponProblem } = require("../utils/coupon");

const router = express.Router();

router.post("/validate", async (req, res) => {
  const { code, subtotal } = req.body;

  const [rows] = await db.query("SELECT * FROM coupons WHERE code = ?", [String(code || "").trim().toUpperCase()]);
  const coupon = rows[0];

  const problem = couponProblem(coupon, Number(subtotal) || 0);
  if (problem) return res.status(400).json({ message: problem });

  res.json({
    code: coupon.code,
    percent: coupon.discount_percent,
    discount: Math.round((Number(subtotal) * coupon.discount_percent) / 100),
  });
});

module.exports = router;

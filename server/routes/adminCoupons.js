// Admin: coupon codes.
//   GET /api/admin/coupons   POST   PUT /:id   DELETE /:id

const express = require("express");
const db = require("../db");
const { loginRequired, adminOnly } = require("../middleware/auth");

const router = express.Router();
router.use(loginRequired, adminOnly);

// Turn the form data into clean values, or return an error text.
function readCouponForm(body) {
  const code = String(body.code || "").trim().toUpperCase();
  const percent = Number(body.discount_percent);

  if (!code) return { error: "Code is required" };
  if (!(percent >= 1 && percent <= 90)) return { error: "Discount must be between 1 and 90 percent" };

  return {
    values: [
      code,
      percent,
      Number(body.min_order) || 0,
      body.max_uses === "" || body.max_uses == null ? null : Number(body.max_uses),
      body.expires_at || null,
      body.active === false || body.active === 0 || body.active === "0" ? 0 : 1,
    ],
  };
}

router.get("/", async (req, res) => {
  const [coupons] = await db.query("SELECT * FROM coupons ORDER BY id DESC");
  res.json(coupons);
});

router.post("/", async (req, res) => {
  const { values, error } = readCouponForm(req.body);
  if (error) return res.status(400).json({ message: error });

  try {
    await db.query(
      "INSERT INTO coupons (code, discount_percent, min_order, max_uses, expires_at, active) VALUES (?, ?, ?, ?, ?, ?)",
      values
    );
    res.status(201).json({ message: "Coupon added" });
  } catch (err) {
    if (err.code === "ER_DUP_ENTRY") return res.status(409).json({ message: "That code already exists" });
    throw err;
  }
});

router.put("/:id", async (req, res) => {
  const { values, error } = readCouponForm(req.body);
  if (error) return res.status(400).json({ message: error });

  try {
    await db.query(
      "UPDATE coupons SET code=?, discount_percent=?, min_order=?, max_uses=?, expires_at=?, active=? WHERE id=?",
      [...values, req.params.id]
    );
    res.json({ message: "Coupon updated" });
  } catch (err) {
    if (err.code === "ER_DUP_ENTRY") return res.status(409).json({ message: "That code already exists" });
    throw err;
  }
});

router.delete("/:id", async (req, res) => {
  await db.query("DELETE FROM coupons WHERE id = ?", [req.params.id]);
  res.json({ message: "Coupon deleted" });
});

module.exports = router;

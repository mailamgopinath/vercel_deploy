// Homepage banners that customers see.
//   GET /api/banners    only the active ones, in order
// (The admin manages them in routes/adminBanners.js)

const express = require("express");
const db = require("../db");

const router = express.Router();

router.get("/", async (req, res) => {
  const [banners] = await db.query("SELECT * FROM banners WHERE active = 1 ORDER BY sort_order, id");
  res.json(banners);
});

module.exports = router;

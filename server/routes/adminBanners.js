// Admin: homepage banners.
//   GET /api/admin/banners   POST   PUT /:id   DELETE /:id
// A banner picture is uploaded in a form field called "image" (or give an image_url).

const express = require("express");
const db = require("../db");
const upload = require("../middleware/upload");
const { loginRequired, adminOnly } = require("../middleware/auth");

const router = express.Router();
router.use(loginRequired, adminOnly);

router.get("/", async (req, res) => {
  const [banners] = await db.query("SELECT * FROM banners ORDER BY sort_order, id");
  res.json(banners);
});

router.post("/", upload.single("image"), async (req, res) => {
  const { title, subtitle, link, sort_order, active, image_url } = req.body;
  if (!title) return res.status(400).json({ message: "Title is required" });

  const image = req.file ? `/uploads/${req.file.filename}` : image_url || null;

  await db.query(
    "INSERT INTO banners (title, subtitle, image, link, sort_order, active) VALUES (?, ?, ?, ?, ?, ?)",
    [title, subtitle || null, image, link || null, Number(sort_order) || 0, active === "0" ? 0 : 1]
  );
  res.status(201).json({ message: "Banner added" });
});

router.put("/:id", upload.single("image"), async (req, res) => {
  const [rows] = await db.query("SELECT * FROM banners WHERE id = ?", [req.params.id]);
  if (rows.length === 0) return res.status(404).json({ message: "Banner not found" });

  const { title, subtitle, link, sort_order, active, image_url } = req.body;
  if (!title) return res.status(400).json({ message: "Title is required" });

  // New file wins, then a typed address, otherwise keep the old picture.
  const image = req.file ? `/uploads/${req.file.filename}` : image_url || rows[0].image;

  await db.query(
    "UPDATE banners SET title=?, subtitle=?, image=?, link=?, sort_order=?, active=? WHERE id=?",
    [title, subtitle || null, image, link || null, Number(sort_order) || 0, active === "0" ? 0 : 1, req.params.id]
  );
  res.json({ message: "Banner updated" });
});

router.delete("/:id", async (req, res) => {
  await db.query("DELETE FROM banners WHERE id = ?", [req.params.id]);
  res.json({ message: "Banner deleted" });
});

module.exports = router;

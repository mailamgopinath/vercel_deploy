// Picture upload setup (multer), shared by the admin routes.
// Uploaded pictures are saved into the "uploads" folder with a unique name.

const multer = require("multer");
const path = require("path");

const storage = multer.diskStorage({
  destination: "uploads/",
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + Math.round(Math.random() * 1e6) + path.extname(file.originalname));
  },
});

module.exports = multer({ storage });

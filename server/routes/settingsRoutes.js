const express = require("express");
const settingsController = require("../controllers/settingsController");
const verifyToken = require("../middleware/authMiddleware");

const router = express.Router();
router.use(verifyToken);
router.use((req, res, next) => {
    if (req.user.role !== "admin") {
        return res.status(403).json({
            status: false,
            message: "Administrator access required."
        });
    }
    return next();
});

router.get("/deductions", settingsController.getSettings);
router.put("/deductions", settingsController.updateSettings);

module.exports = router;

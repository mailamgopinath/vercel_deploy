const express = require("express");
const monthlyReportController = require("../controllers/monthlyReportController");
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

router.get("/", monthlyReportController.getMonthlyReport);

module.exports = router;

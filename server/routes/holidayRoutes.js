const express = require("express");
const holidayController = require("../controllers/holidayController");
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

router.get("/", holidayController.getHolidays);
router.post("/", holidayController.createHoliday);
router.delete("/:id", holidayController.deleteHoliday);

module.exports = router;

const express = require("express");
const attendanceController = require("../controllers/attendanceController");
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

router.get("/records", attendanceController.getAttendanceRecords);
router.get("/", attendanceController.getAttendance);
router.put("/", attendanceController.saveAttendance);

module.exports = router;

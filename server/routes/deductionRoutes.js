const express = require("express");
const deductionController = require("../controllers/deductionController");
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

router.get("/calculate", deductionController.getCalculation);
router.post("/calculate", deductionController.saveCalculation);
router.get("/history", deductionController.getHistory);
router.patch("/:id", deductionController.correctDeduction);

module.exports = router;

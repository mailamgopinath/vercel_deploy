const express = require("express");
const employeeController = require("../controllers/employeeController");
const verifyToken = require("../middleware/authMiddleware");
const uploadEmployeeImage = require("../middleware/uploadEmployeeImage");

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

router.get("/", employeeController.getEmployees);
router.get("/departments", employeeController.getDepartments);
router.get("/:id", employeeController.getEmployee);
router.post("/", uploadEmployeeImage, employeeController.createEmployee);
router.put("/:id", uploadEmployeeImage, employeeController.updateEmployee);
router.delete("/:id", employeeController.deleteEmployee);

module.exports = router;

const employeeModel = require("../models/employeeModel");

const fields = [
    "employee_code",
    "name",
    "email",
    "phone",
    "department",
    "designation",
    "gender",
    "date_of_joining",
    "basic_monthly_salary",
    "status"
];

const removeUploadedImage = async (req) => {
    if (!req.file) {
        return;
    }

    try {
        await require("fs/promises").unlink(req.file.path);
    } catch (error) {
        if (error.code !== "ENOENT") {
            console.error("Unable to remove rejected employee image:", error.message);
        }
    }
};

const validateEmployee = (body) => {
    const employee = {};
    for (const field of fields) {
        if (
            field !== "basic_monthly_salary" &&
            body[field] !== undefined &&
            body[field] !== null &&
            typeof body[field] !== "string"
        ) {
            return { error: `${field} must be text.` };
        }

        employee[field] =
            typeof body[field] === "string" ? body[field].trim() : body[field];
    }

    if (
        !employee.employee_code ||
        !employee.name ||
        !employee.email ||
        !employee.department
    ) {
        return { error: "Employee code, name, email, and department are required." };
    }

    if (
        employee.employee_code.length > 50 ||
        employee.name.length > 255 ||
        employee.email.length > 255 ||
        employee.department.length > 255 ||
        (employee.phone && employee.phone.length > 30) ||
        (employee.designation && employee.designation.length > 150)
    ) {
        return { error: "One or more employee fields exceed the allowed length." };
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(employee.email)) {
        return { error: "Enter a valid email address." };
    }

    if (
        employee.status !== undefined &&
        !["active", "inactive"].includes(employee.status)
    ) {
        return { error: "Status must be active or inactive." };
    }

    if (
        employee.basic_monthly_salary === undefined ||
        employee.basic_monthly_salary === ""
    ) {
        employee.basic_monthly_salary = 0;
    } else {
        employee.basic_monthly_salary = Number(employee.basic_monthly_salary);
    }

    if (
        !Number.isFinite(employee.basic_monthly_salary) ||
        employee.basic_monthly_salary < 0
    ) {
        return { error: "Monthly salary must be a valid non-negative amount." };
    }

    if (employee.date_of_joining) {
        const date = new Date(`${employee.date_of_joining}T00:00:00Z`);
        if (
            Number.isNaN(date.getTime()) ||
            date.toISOString().slice(0, 10) !== employee.date_of_joining
        ) {
            return { error: "Joining date must be a valid date in YYYY-MM-DD format." };
        }
    } else {
        employee.date_of_joining = null;
    }

    employee.phone ||= null;
    employee.designation ||= null;
    employee.gender ||= null;
    employee.status ||= "active";
    employee.profile_image = null;

    return { employee };
};

const handleDatabaseError = (res, error) => {
    if (error.code === "ER_DUP_ENTRY") {
        return res.status(409).json({
            status: false,
            message: "Employee code or email already exists."
        });
    }

    console.error("Employee management error:", error.message);
    return res.status(500).json({
        status: false,
        message: "Unable to complete the employee request."
    });
};

const getEmployees = async (req, res) => {
    const page = Math.max(Number.parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(
        Math.max(Number.parseInt(req.query.limit, 10) || 10, 1),
        100
    );
    const status = ["active", "inactive", "deleted", "all"].includes(
        req.query.status
    )
        ? req.query.status
        : "all";

    try {
        const result = await employeeModel.listEmployees({
            search: typeof req.query.search === "string" ? req.query.search.trim() : "",
            department:
                typeof req.query.department === "string"
                    ? req.query.department.trim()
                    : "",
            status,
            limit,
            offset: (page - 1) * limit
        });

        return res.json({
            status: true,
            data: {
                employees: result.employees,
                pagination: {
                    page,
                    limit,
                    total: result.total,
                    totalPages: Math.ceil(result.total / limit)
                }
            }
        });
    } catch (error) {
        return handleDatabaseError(res, error);
    }
};

const getDepartments = async (req, res) => {
    try {
        const departments = await employeeModel.listDepartments();
        return res.json({ status: true, data: departments });
    } catch (error) {
        return handleDatabaseError(res, error);
    }
};

const getEmployee = async (req, res) => {
    try {
        const employee = await employeeModel.findEmployeeById(req.params.id);
        if (!employee || employee.status === "deleted") {
            return res.status(404).json({
                status: false,
                message: "Employee not found."
            });
        }

        return res.json({ status: true, data: employee });
    } catch (error) {
        return handleDatabaseError(res, error);
    }
};

const createEmployee = async (req, res) => {
    const { employee, error } = validateEmployee(req.body);
    if (error) {
        await removeUploadedImage(req);
        return res.status(400).json({ status: false, message: error });
    }

    employee.profile_image = req.file
        ? `/uploads/employees/${req.file.filename}`
        : null;

    try {
        const created = await employeeModel.createEmployee(employee);
        return res.status(201).json({
            status: true,
            message: "Employee created successfully.",
            data: created
        });
    } catch (dbError) {
        await removeUploadedImage(req);
        return handleDatabaseError(res, dbError);
    }
};

const updateEmployee = async (req, res) => {
    const { employee, error } = validateEmployee(req.body);
    if (error) {
        await removeUploadedImage(req);
        return res.status(400).json({ status: false, message: error });
    }

    try {
        const existing = await employeeModel.findEmployeeById(req.params.id);
        if (!existing || existing.status === "deleted") {
            await removeUploadedImage(req);
            return res.status(404).json({
                status: false,
                message: "Employee not found."
            });
        }

        employee.profile_image = req.file
            ? `/uploads/employees/${req.file.filename}`
            : existing.profile_image;
        const updated = await employeeModel.updateEmployee(
            req.params.id,
            employee
        );

        if (!updated || updated.status === "deleted") {
            return res.status(404).json({
                status: false,
                message: "Employee not found."
            });
        }

        return res.json({
            status: true,
            message: "Employee updated successfully.",
            data: updated
        });
    } catch (dbError) {
        await removeUploadedImage(req);
        return handleDatabaseError(res, dbError);
    }
};

const deleteEmployee = async (req, res) => {
    try {
        const deleted = await employeeModel.softDeleteEmployee(req.params.id);
        if (!deleted) {
            return res.status(404).json({
                status: false,
                message: "Employee not found."
            });
        }

        return res.json({
            status: true,
            message: "Employee marked as deleted."
        });
    } catch (error) {
        return handleDatabaseError(res, error);
    }
};

module.exports = {
    getEmployees,
    getDepartments,
    getEmployee,
    createEmployee,
    updateEmployee,
    deleteEmployee
};

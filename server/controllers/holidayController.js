const holidayModel = require("../models/holidayModel");

const isValidDate = (value) => {
    if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        return false;
    }
    const date = new Date(`${value}T00:00:00Z`);
    return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
};

const getHolidays = async (req, res) => {
    try {
        const [holidays, departments] = await Promise.all([
            holidayModel.listHolidays(),
            holidayModel.listDepartments()
        ]);
        return res.json({ status: true, data: { holidays, departments } });
    } catch (error) {
        console.error("Holiday list error:", error.message);
        return res.status(500).json({
            status: false,
            message: "Unable to load holiday records."
        });
    }
};

const createHoliday = async (req, res) => {
    const { date, name, department = "" } = req.body;
    if (
        !isValidDate(date) ||
        typeof name !== "string" ||
        !name.trim() ||
        name.trim().length > 150 ||
        typeof department !== "string" ||
        department.trim().length > 150
    ) {
        return res.status(400).json({
            status: false,
            message: "Provide a valid date, holiday name, and optional department."
        });
    }
    try {
        const result = await holidayModel.createHoliday({
            date,
            name: name.trim(),
            department: department.trim()
        });
        if (result.duplicate) {
            return res.status(409).json({
                status: false,
                message: "This holiday is already configured."
            });
        }
        return res.status(201).json({
            status: true,
            message: "Holiday added.",
            data: { id: result.id }
        });
    } catch (error) {
        console.error("Holiday create error:", error.message);
        return res.status(500).json({
            status: false,
            message: "Unable to add holiday."
        });
    }
};

const deleteHoliday = async (req, res) => {
    if (!/^\d+$/.test(req.params.id)) {
        return res.status(400).json({
            status: false,
            message: "Holiday ID must be numeric."
        });
    }
    try {
        if (!(await holidayModel.deleteHoliday(req.params.id))) {
            return res.status(404).json({
                status: false,
                message: "Holiday not found."
            });
        }
        return res.json({ status: true, message: "Holiday removed." });
    } catch (error) {
        console.error("Holiday delete error:", error.message);
        return res.status(500).json({
            status: false,
            message: "Unable to remove holiday."
        });
    }
};

module.exports = { getHolidays, createHoliday, deleteHoliday };

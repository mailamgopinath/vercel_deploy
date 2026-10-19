const deductionModel = require("../models/deductionModel");

const parsePeriod = (query) => {
    const month = Number(query.month);
    const year = Number(query.year);
    if (
        !Number.isInteger(month) ||
        month < 1 ||
        month > 12 ||
        !Number.isInteger(year) ||
        year < 2000 ||
        year > 9999
    ) {
        return null;
    }
    return { month, year };
};

const getCalculation = async (req, res) => {
    const period = parsePeriod(req.query);
    if (!period) {
        return res.status(400).json({
            status: false,
            message: "Provide a valid month (1-12) and year."
        });
    }
    try {
        const result = await deductionModel.calculateDeductions(
            period.year,
            period.month
        );
        return res.json({ status: true, data: result });
    } catch (error) {
        console.error("Deduction calculation error:", error.message);
        return res.status(500).json({
            status: false,
            message: "Unable to calculate deductions."
        });
    }
};

const saveCalculation = async (req, res) => {
    const period = parsePeriod(req.body);
    const employeeIds = req.body.employee_ids;
    const remarks = req.body.remarks || "";
    if (
        !period ||
        (employeeIds !== undefined &&
            (!Array.isArray(employeeIds) ||
                employeeIds.some(
                    (id) => !Number.isSafeInteger(id) || id <= 0
                ))) ||
        typeof remarks !== "string" ||
        remarks.length > 500
    ) {
        return res.status(400).json({
            status: false,
            message: "Provide a valid period, employee selection, and remarks."
        });
    }
    try {
        const calculation = await deductionModel.calculateDeductions(
            period.year,
            period.month,
            employeeIds
        );
        if (calculation.deductions.length === 0) {
            return res.status(400).json({
                status: false,
                message: "No active employees were selected for calculation."
            });
        }
        const saved = await deductionModel.saveDeductions(
            calculation.deductions,
            req.user.id,
            remarks.trim()
        );
        return res.status(201).json({
            status: true,
            message: `Saved deductions for ${saved} employee(s).`,
            data: { saved }
        });
    } catch (error) {
        if (error.code === "ER_DUP_ENTRY") {
            return res.status(409).json({
                status: false,
                message: "A deduction record already exists for an employee in this month."
            });
        }
        console.error("Deduction save error:", error.message);
        return res.status(500).json({
            status: false,
            message: "Unable to save deduction records."
        });
    }
};

const getHistory = async (req, res) => {
    const { employeeId, month, year, department } = req.query;
    const parsedMonth = month === undefined ? null : Number(month);
    const parsedYear = year === undefined ? null : Number(year);
    const parsedEmployee = employeeId === undefined ? null : Number(employeeId);
    if (
        (parsedMonth !== null &&
            (!Number.isInteger(parsedMonth) ||
                parsedMonth < 1 ||
                parsedMonth > 12)) ||
        (parsedYear !== null &&
            (!Number.isInteger(parsedYear) ||
                parsedYear < 2000 ||
                parsedYear > 9999)) ||
        (parsedEmployee !== null &&
            (!Number.isSafeInteger(parsedEmployee) || parsedEmployee <= 0)) ||
        (department !== undefined && typeof department !== "string")
    ) {
        return res.status(400).json({
            status: false,
            message: "One or more deduction history filters are invalid."
        });
    }
    try {
        const history = await deductionModel.listDeductions({
            employeeId: parsedEmployee,
            month: parsedMonth,
            year: parsedYear,
            department: department?.trim()
        });
        return res.json({ status: true, data: history });
    } catch (error) {
        console.error("Deduction history error:", error.message);
        return res.status(500).json({
            status: false,
            message: "Unable to load deduction history."
        });
    }
};

const correctDeduction = async (req, res) => {
    const amount = req.body.deduction_amount;
    const remarks = req.body.remarks;
    if (
        typeof amount !== "number" ||
        !Number.isFinite(amount) ||
        amount < 0 ||
        amount > 9999999999.99 ||
        typeof remarks !== "string" ||
        !remarks.trim() ||
        remarks.trim().length > 500
    ) {
        return res.status(400).json({
            status: false,
            message: "Provide a valid corrected amount and a reason for the correction."
        });
    }
    try {
        const result = await deductionModel.correctDeduction(
            req.params.id,
            Number(amount.toFixed(2)),
            remarks.trim(),
            req.user.id
        );
        if (result.notFound) {
            return res.status(404).json({
                status: false,
                message: "Deduction record not found."
            });
        }
        return res.json({
            status: true,
            message: "Deduction corrected and audit log recorded."
        });
    } catch (error) {
        console.error("Deduction correction error:", error.message);
        return res.status(500).json({
            status: false,
            message: "Unable to correct deduction record."
        });
    }
};

module.exports = {
    getCalculation,
    saveCalculation,
    getHistory,
    correctDeduction
};

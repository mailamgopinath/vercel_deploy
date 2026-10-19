const attendanceModel = require("../models/attendanceModel");

const attendanceStatuses = new Set(["Present", "Absent", "Half Day"]);

const isValidDate = (value) => {
    if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        return false;
    }

    const parsed = new Date(`${value}T00:00:00Z`);
    return (
        !Number.isNaN(parsed.getTime()) &&
        parsed.toISOString().slice(0, 10) === value
    );
};

const isValidTime = (value) =>
    value === null ||
    value === "" ||
    (typeof value === "string" &&
        /^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/.test(value));

const getAttendance = async (req, res) => {
    const { date, search = "" } = req.query;
    if (!isValidDate(date)) {
        return res.status(400).json({
            status: false,
            message: "A valid attendance date in YYYY-MM-DD format is required."
        });
    }
    if (typeof search !== "string") {
        return res.status(400).json({
            status: false,
            message: "Search must be text."
        });
    }

    try {
        const employees = await attendanceModel.listAttendanceForDate(
            date,
            search.trim()
        );
        return res.json({
            status: true,
            data: { date, employees }
        });
    } catch (error) {
        console.error("Attendance list error:", error.message);
        return res.status(500).json({
            status: false,
            message: "Unable to load attendance records."
        });
    }
};

const getAttendanceRecords = async (req, res) => {
    const { startDate, endDate, search = "" } = req.query;
    if (!isValidDate(startDate) || !isValidDate(endDate)) {
        return res.status(400).json({
            status: false,
            message: "Valid startDate and endDate values in YYYY-MM-DD format are required."
        });
    }
    if (startDate > endDate) {
        return res.status(400).json({
            status: false,
            message: "Start date must be on or before end date."
        });
    }
    if (typeof search !== "string") {
        return res.status(400).json({
            status: false,
            message: "Search must be text."
        });
    }

    try {
        const records = await attendanceModel.listAttendanceRecords({
            startDate,
            endDate,
            search: search.trim()
        });
        return res.json({
            status: true,
            data: { startDate, endDate, records }
        });
    } catch (error) {
        console.error("Attendance records error:", error.message);
        return res.status(500).json({
            status: false,
            message: "Unable to load attendance list."
        });
    }
};

const saveAttendance = async (req, res) => {
    const { date, records } = req.body;
    if (!isValidDate(date)) {
        return res.status(400).json({
            status: false,
            message: "A valid attendance date in YYYY-MM-DD format is required."
        });
    }
    if (!Array.isArray(records) || records.length === 0) {
        return res.status(400).json({
            status: false,
            message: "Provide at least one marked attendance record."
        });
    }

    const seenEmployeeIds = new Set();
    for (const record of records) {
        if (
            !record ||
            !Number.isSafeInteger(record.employee_id) ||
            record.employee_id <= 0 ||
            seenEmployeeIds.has(record.employee_id)
        ) {
            return res.status(400).json({
                status: false,
                message: "Each employee must have one valid attendance record."
            });
        }
        seenEmployeeIds.add(record.employee_id);

        if (!attendanceStatuses.has(record.status)) {
            return res.status(400).json({
                status: false,
                message: "Attendance status must be Present, Absent, or Half Day."
            });
        }
        if (!isValidTime(record.check_in) || !isValidTime(record.check_out)) {
            return res.status(400).json({
                status: false,
                message: "Check-in and check-out must be valid 24-hour times."
            });
        }
        if (
            record.remarks !== undefined &&
            record.remarks !== null &&
            (typeof record.remarks !== "string" || record.remarks.length > 1000)
        ) {
            return res.status(400).json({
                status: false,
                message: "Remarks must be text no longer than 1000 characters."
            });
        }
    }

    try {
        const result = await attendanceModel.saveAttendanceForDate(
            date,
            records.map((record) => ({
                employee_id: record.employee_id,
                status: record.status,
                check_in: record.check_in || null,
                check_out: record.check_out || null,
                remarks: record.remarks?.trim() || null
            }))
        );

        if (result.invalidEmployee) {
            return res.status(400).json({
                status: false,
                message: "Attendance can only be saved for active employees."
            });
        }

        return res.json({
            status: true,
            message: `Saved attendance for ${result.saved} employee(s).`,
            data: { saved: result.saved }
        });
    } catch (error) {
        console.error("Attendance save error:", error.message);
        return res.status(500).json({
            status: false,
            message: "Unable to save attendance records."
        });
    }
};

module.exports = {
    getAttendance,
    getAttendanceRecords,
    saveAttendance
};

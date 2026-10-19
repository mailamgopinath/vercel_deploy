const monthlyReportModel = require("../models/monthlyReportModel");

const getMonthlyReport = async (req, res) => {
    const month = Number(req.query.month);
    const year = Number(req.query.year);
    if (
        !Number.isInteger(month) ||
        month < 1 ||
        month > 12 ||
        !Number.isInteger(year) ||
        year < 2000 ||
        year > 9999
    ) {
        return res.status(400).json({
            status: false,
            message: "Provide a valid month (1-12) and year."
        });
    }

    try {
        const settings = await monthlyReportModel.getSettings();
        const report = await monthlyReportModel.getMonthlyReport({
            year,
            month,
            lateAfter: String(settings.late_after),
            halfDayPayableFactor:
                1 - Number(settings.half_day_multiplier)
        });
        return res.json({
            status: true,
            data: { ...report, settings }
        });
    } catch (error) {
        console.error("Monthly attendance report error:", error.message);
        return res.status(500).json({
            status: false,
            message: "Unable to create monthly attendance report."
        });
    }
};

module.exports = { getMonthlyReport };

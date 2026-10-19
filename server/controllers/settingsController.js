const settingsModel = require("../models/settingsModel");

const getSettings = async (req, res) => {
    try {
        return res.json({
            status: true,
            data: await settingsModel.getSettings()
        });
    } catch (error) {
        console.error("Settings load error:", error.message);
        return res.status(500).json({
            status: false,
            message: "Unable to load deduction settings."
        });
    }
};

const updateSettings = async (req, res) => {
    const body = req.body;
    const numericFields = [
        "working_days_per_month",
        "working_hours_per_day",
        "half_day_multiplier",
        "absent_multiplier",
        "late_deduction_amount"
    ];
    if (
        numericFields.some(
            (field) =>
                typeof body[field] !== "number" ||
                !Number.isFinite(body[field]) ||
                body[field] < 0
        ) ||
        body.working_days_per_month <= 0 ||
        body.working_days_per_month > 31 ||
        body.working_hours_per_day <= 0 ||
        body.working_hours_per_day > 24 ||
        body.half_day_multiplier > 1 ||
        body.absent_multiplier > 2 ||
        body.late_deduction_amount > 1000000 ||
        !["fixed_working_days", "calendar_days"].includes(body.per_day_method) ||
        typeof body.late_deduction_enabled !== "boolean" ||
        typeof body.late_after !== "string" ||
        !/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/.test(body.late_after)
    ) {
        return res.status(400).json({
            status: false,
            message: "One or more deduction settings are invalid."
        });
    }

    try {
        const settings = await settingsModel.updateSettings(
            body,
            req.user.id
        );
        return res.json({
            status: true,
            message: "Deduction settings saved.",
            data: settings
        });
    } catch (error) {
        console.error("Settings update error:", error.message);
        return res.status(500).json({
            status: false,
            message: "Unable to save deduction settings."
        });
    }
};

module.exports = { getSettings, updateSettings };

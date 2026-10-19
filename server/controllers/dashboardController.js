const dashboardModel = require("../models/dashboardModel");

const getDashboard = async (req, res) => {
    try {
        const summary = await dashboardModel.getSummary();

        const attendance =
            await dashboardModel.getRecentAttendance();
        const trends = await dashboardModel.getAttendanceTrends();

        return res.status(200).json({
            status: true,
            message: "Dashboard data fetched successfully",
            data: {
                summary,
                attendance,
                trends
            }
        });
    } catch (error) {
        console.error("Dashboard error:", error.message);

        return res.status(500).json({
            status: false,
            message: "Failed to fetch dashboard data"
        });
    }
};

module.exports = {
    getDashboard
};
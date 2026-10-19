const db = require("../config/db");

const getSummary = async () => {
    const sql = `
        SELECT
            (SELECT COUNT(*)
             FROM employees
             WHERE status = 'active') AS totalEmployees,

            (SELECT COUNT(*)
             FROM attendance a
             JOIN employees e ON e.id = a.employee_id
             WHERE a.attendance_date = CURDATE()
               AND a.status = 'Present'
               AND e.status = 'active') AS presentToday,

            (SELECT COUNT(*)
             FROM attendance a
             JOIN employees e ON e.id = a.employee_id
             WHERE a.attendance_date = CURDATE()
               AND a.status = 'Absent'
               AND e.status = 'active') AS absentToday,

            (SELECT COUNT(*)
             FROM attendance a
             JOIN employees e ON e.id = a.employee_id
             WHERE a.attendance_date = CURDATE()
               AND a.status = 'Half Day'
               AND e.status = 'active') AS halfDayToday,

            (SELECT COUNT(*)
             FROM attendance a
             JOIN employees e ON e.id = a.employee_id
             WHERE a.attendance_date = CURDATE()
               AND a.status = 'Present'
               AND a.check_out IS NOT NULL
               AND e.status = 'active') AS checkedOutToday,

            (SELECT COUNT(*)
             FROM attendance a
             JOIN employees e ON e.id = a.employee_id
             WHERE a.attendance_date = CURDATE()
               AND a.status = 'Present'
               AND a.check_out IS NULL
               AND e.status = 'active') AS missingCheckoutToday,

            (SELECT COUNT(*)
             FROM attendance a
             JOIN employees e ON e.id = a.employee_id
             CROSS JOIN attendance_settings s
             WHERE a.attendance_date = CURDATE()
               AND a.status = 'Present'
               AND a.check_in > s.late_after
               AND e.status = 'active'
               AND s.id = 1) AS lateToday,

            (SELECT COALESCE(SUM(deduction_amount), 0)
             FROM monthly_deductions
             WHERE month = MONTH(CURDATE())
               AND year = YEAR(CURDATE())) AS monthlyDeductions
    `;

    const [rows] = await db.execute(sql);

    return rows[0];
};

const getAttendanceTrends = async () => {
    const sql = `
        SELECT
            a.attendance_date AS date,
            SUM(
                a.status = 'Present'
                AND a.check_in IS NOT NULL
                AND a.check_in <= s.late_after
                AND e.status = 'active'
            ) AS on_time_count,
            SUM(
                a.status = 'Present'
                AND a.check_in > s.late_after
                AND e.status = 'active'
            ) AS late_count,
            COALESCE(SUM(
                CASE
                    WHEN a.status = 'Present'
                         AND a.check_in IS NOT NULL
                         AND a.check_out IS NOT NULL
                         AND e.status = 'active'
                    THEN GREATEST(
                        (
                            CASE
                                WHEN a.check_out >= a.check_in
                                THEN TIME_TO_SEC(TIMEDIFF(a.check_out, a.check_in))
                                ELSE TIME_TO_SEC(TIMEDIFF(a.check_out, a.check_in)) + 86400
                            END
                        ) / 3600 - s.working_hours_per_day,
                        0
                    )
                    ELSE 0
                END
            ), 0) AS overtime_hours
        FROM attendance a
        JOIN employees e ON e.id = a.employee_id
        CROSS JOIN attendance_settings s
        WHERE a.attendance_date BETWEEN DATE_SUB(CURDATE(), INTERVAL 6 DAY)
                                    AND CURDATE()
          AND s.id = 1
        GROUP BY a.attendance_date
        ORDER BY a.attendance_date
    `;
    const [rows] = await db.execute(sql);
    return rows;
};

const getRecentAttendance = async () => {
    const sql = `
        SELECT
            e.employee_code,
            e.name,
            e.department,
            a.attendance_date,
            a.status,
            a.check_in,
            a.check_out
        FROM attendance a
        JOIN employees e ON e.id = a.employee_id
        WHERE a.attendance_date = CURDATE()
        ORDER BY a.id DESC
        LIMIT 10
    `;

    const [rows] = await db.execute(sql);

    return rows;
};

module.exports = {
    getSummary,
    getAttendanceTrends,
    getRecentAttendance
};
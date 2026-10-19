const db = require("../config/db");

const listAttendanceForDate = async (date, search) => {
    const values = [date];
    let searchCondition = "";

    if (search) {
        searchCondition = "AND (e.name LIKE ? OR e.employee_code LIKE ?)";
        values.push(`%${search}%`, `%${search}%`);
    }

    const [rows] = await db.execute(
        `SELECT
            e.id AS employee_id,
            e.employee_code,
            e.name,
            e.department,
            a.id AS attendance_id,
            a.status AS attendance_status,
            a.check_in,
            a.check_out,
            a.remarks
         FROM employees e
         LEFT JOIN attendance a
           ON a.employee_id = e.id AND a.attendance_date = ?
         WHERE e.status = 'active' ${searchCondition}
         ORDER BY e.name, e.employee_code`,
        values
    );

    return rows;
};

const listAttendanceRecords = async ({ startDate, endDate, search }) => {
    const values = [startDate, endDate];
    let searchCondition = "";

    if (search) {
        searchCondition = "AND (e.name LIKE ? OR e.employee_code LIKE ?)";
        values.push(`%${search}%`, `%${search}%`);
    }

    const [rows] = await db.execute(
        `SELECT
            a.id,
            e.employee_code,
            e.name,
            e.department,
            a.attendance_date,
            a.status AS attendance_status,
            a.check_in,
            a.check_out,
            CASE
                WHEN a.check_in IS NOT NULL AND a.check_out IS NOT NULL
                THEN ROUND(
                    MOD(
                        TIME_TO_SEC(a.check_out) -
                            TIME_TO_SEC(a.check_in) + 86400,
                        86400
                    ) / 3600,
                    2
                )
                ELSE NULL
            END AS working_hours,
            a.remarks
         FROM attendance a
         JOIN employees e ON e.id = a.employee_id
         WHERE a.attendance_date BETWEEN ? AND ?
           ${searchCondition}
         ORDER BY a.attendance_date DESC, e.name, e.employee_code`,
        values
    );

    return rows;
};

const saveAttendanceForDate = async (date, records) => {
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        const employeeIds = records.map((record) => record.employee_id);
        const placeholders = employeeIds.map(() => "?").join(", ");
        const [employees] = await connection.execute(
            `SELECT id
             FROM employees
             WHERE status = 'active' AND id IN (${placeholders})
             FOR UPDATE`,
            employeeIds
        );

        if (employees.length !== employeeIds.length) {
            await connection.rollback();
            return { invalidEmployee: true };
        }

        for (const record of records) {
            await connection.execute(
                `INSERT INTO attendance (
                    employee_id, attendance_date, status, check_in, check_out, remarks
                ) VALUES (?, ?, ?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE
                    status = VALUES(status),
                    check_in = VALUES(check_in),
                    check_out = VALUES(check_out),
                    remarks = VALUES(remarks)`,
                [
                    record.employee_id,
                    date,
                    record.status,
                    record.check_in,
                    record.check_out,
                    record.remarks
                ]
            );
        }

        await connection.commit();
        return { saved: records.length };
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
};

module.exports = {
    listAttendanceForDate,
    listAttendanceRecords,
    saveAttendanceForDate
};

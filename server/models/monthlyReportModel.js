const db = require("../config/db");
const settingsModel = require("./settingsModel");

const getMonthlyReport = async ({
    year,
    month,
    lateAfter,
    halfDayPayableFactor = 0.5
}) => {
    const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
    const endDate = `${year}-${String(month).padStart(2, "0")}-${String(
        new Date(year, month, 0).getDate()
    ).padStart(2, "0")}`;

    const [employees] = await db.execute(
        `SELECT
            e.id AS employee_id,
            e.employee_code,
            e.name,
            e.department,
            e.basic_monthly_salary,
            e.status
         FROM employees e
         WHERE e.status <> 'deleted'
         ORDER BY e.name, e.employee_code`
    );

    const [attendance] = await db.execute(
        `SELECT
            a.employee_id,
            a.attendance_date,
            a.status,
            a.check_in,
            a.check_out,
            CASE
                WHEN a.check_in IS NOT NULL AND a.check_out IS NOT NULL
                THEN MOD(
                    TIME_TO_SEC(a.check_out) - TIME_TO_SEC(a.check_in) + 86400,
                    86400
                ) / 3600
                ELSE NULL
            END AS working_hours
         FROM attendance a
         WHERE a.attendance_date BETWEEN ? AND ?
         ORDER BY a.employee_id, a.attendance_date`,
        [startDate, endDate]
    );

    const [holidays] = await db.execute(
        `SELECT h.holiday_date, d.name AS department
         FROM holidays h
         LEFT JOIN departments d ON d.id = h.department_id
         WHERE h.holiday_date BETWEEN ? AND ?`,
        [startDate, endDate]
    );

    const attendanceByEmployee = new Map();
    for (const row of attendance) {
        if (!attendanceByEmployee.has(row.employee_id)) {
            attendanceByEmployee.set(row.employee_id, []);
        }
        attendanceByEmployee.get(row.employee_id).push(row);
    }

    const globalHolidays = new Set(
        holidays
            .filter((holiday) => !holiday.department)
            .map((holiday) => String(holiday.holiday_date).slice(0, 10))
    );
    const holidaysByDepartment = new Map();
    for (const holiday of holidays) {
        if (!holiday.department) {
            continue;
        }
        if (!holidaysByDepartment.has(holiday.department)) {
            holidaysByDepartment.set(holiday.department, new Set());
        }
        holidaysByDepartment
            .get(holiday.department)
            .add(String(holiday.holiday_date).slice(0, 10));
    }
    const report = employees.map((employee) => {
        const entries = attendanceByEmployee.get(employee.employee_id) || [];
        const row = {
            ...employee,
            present_days: 0,
            absent_days: 0,
            half_days: 0,
            late_arrivals: 0,
            working_hours: 0,
            deductible_half_days: 0,
            deductible_absent_by_date: new Map()
        };

        for (const entry of entries) {
            const status = String(entry.status).toLowerCase();
            const entryDate = String(entry.attendance_date).slice(0, 10);
            const entryDay = new Date(`${entryDate}T00:00:00Z`).getUTCDay();
            const isHoliday =
                globalHolidays.has(entryDate) ||
                holidaysByDepartment.get(employee.department)?.has(entryDate);
            if (status === "present") {
                row.present_days += 1;
            } else if (status === "absent") {
                row.absent_days += 1;
                if (entryDay !== 0 && entryDay !== 6 && !isHoliday) {
                    row.deductible_absent_by_date.set(entryDate, true);
                }
            } else if (status === "half day") {
                row.half_days += 1;
                if (entryDay !== 0 && entryDay !== 6 && !isHoliday) {
                    row.deductible_half_days += 1;
                }
            }

            if (entry.check_in && String(entry.check_in) > lateAfter) {
                row.late_arrivals += 1;
            }
            if (entry.working_hours !== null) {
                row.working_hours += Number(entry.working_hours);
            }
        }

        row.working_hours = Number(row.working_hours.toFixed(2));
        row.deductible_absent_days =
            row.deductible_absent_by_date.size;
        delete row.deductible_absent_by_date;
        row.payable_days =
            row.present_days +
            row.half_days * halfDayPayableFactor;
        return row;
    });

    return { startDate, endDate, employees: report };
};

const getSettings = async () => {
    return settingsModel.getSettings();
};

module.exports = { getMonthlyReport, getSettings };

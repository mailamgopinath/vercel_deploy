const db = require("../config/db");
const monthlyReportModel = require("./monthlyReportModel");
const settingsModel = require("./settingsModel");

const calculateDeductions = async (year, month, employeeIds) => {
    const settings = await settingsModel.getSettings();
    const report = await monthlyReportModel.getMonthlyReport({
        year,
        month,
        lateAfter: String(settings.late_after),
        halfDayPayableFactor: 1 - Number(settings.half_day_multiplier)
    });
    const daysInMonth = new Date(year, month, 0).getDate();
    const divisor =
        settings.per_day_method === "calendar_days"
            ? daysInMonth
            : Number(settings.working_days_per_month);
    const selectedIds = employeeIds ? new Set(employeeIds) : null;

    const deductions = report.employees
        .filter(
            (employee) =>
                employee.status === "active" &&
                (!selectedIds || selectedIds.has(employee.employee_id))
        )
        .map((employee) => {
            const monthlySalary = Number(employee.basic_monthly_salary || 0);
            const perDaySalary = divisor > 0 ? monthlySalary / divisor : 0;
            const absentDeduction =
                employee.deductible_absent_days *
                Number(settings.absent_multiplier) *
                perDaySalary;
            const halfDayDeduction =
                employee.deductible_half_days *
                Number(settings.half_day_multiplier) *
                perDaySalary;
            const lateDeduction = settings.late_deduction_enabled
                ? employee.late_arrivals *
                  Number(settings.late_deduction_amount)
                : 0;
            const totalDeduction = Number(
                (
                    absentDeduction +
                    halfDayDeduction +
                    lateDeduction
                ).toFixed(2)
            );

            return {
                employee_id: employee.employee_id,
                employee_code: employee.employee_code,
                name: employee.name,
                department: employee.department,
                month,
                year,
                monthly_salary: monthlySalary,
                total_working_days: divisor,
                present_days: employee.present_days,
                absent_days: employee.absent_days,
                deductible_absent_days: employee.deductible_absent_days,
                payable_days: employee.payable_days,
                half_days: employee.half_days,
                deductible_half_days: employee.deductible_half_days,
                late_arrivals: employee.late_arrivals,
                working_hours: employee.working_hours,
                per_day_salary: Number(perDaySalary.toFixed(2)),
                absent_deduction: Number(absentDeduction.toFixed(2)),
                half_day_deduction: Number(halfDayDeduction.toFixed(2)),
                late_deduction: Number(lateDeduction.toFixed(2)),
                deduction_amount: totalDeduction
            };
        });

    return { deductions, settings };
};

const saveDeductions = async (deductions, userId, remarks) => {
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();
        for (const deduction of deductions) {
            const [result] = await connection.execute(
                `INSERT INTO monthly_deductions (
                    employee_id, month, year, monthly_salary,
                    deduction_amount, calculation_details, remarks, created_by
                 ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    deduction.employee_id,
                    deduction.month,
                    deduction.year,
                    deduction.monthly_salary,
                    deduction.deduction_amount,
                    JSON.stringify(deduction),
                    remarks || null,
                    userId
                ]
            );
            await connection.execute(
                `INSERT INTO audit_logs (
                    user_id, action, entity_type, entity_id, new_values
                 ) VALUES (?, 'create', 'monthly_deduction', ?, ?)`,
                [
                    userId,
                    result.insertId,
                    JSON.stringify({
                        employee_id: deduction.employee_id,
                        month: deduction.month,
                        year: deduction.year,
                        deduction_amount: deduction.deduction_amount
                    })
                ]
            );
        }
        await connection.commit();
        return deductions.length;
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
};

const listDeductions = async ({ employeeId, month, year, department }) => {
    const conditions = [];
    const values = [];
    if (employeeId) {
        conditions.push("md.employee_id = ?");
        values.push(employeeId);
    }
    if (month) {
        conditions.push("md.month = ?");
        values.push(month);
    }
    if (year) {
        conditions.push("md.year = ?");
        values.push(year);
    }
    if (department) {
        conditions.push("e.department = ?");
        values.push(department);
    }
    const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
    const [rows] = await db.execute(
        `SELECT
            md.id, md.employee_id, e.employee_code, e.name AS employee_name,
            e.department, md.month, md.year, md.monthly_salary,
            md.deduction_amount, md.calculation_details, md.remarks,
            md.created_at, u.name AS created_by_name
         FROM monthly_deductions md
         JOIN employees e ON e.id = md.employee_id
         LEFT JOIN users u ON u.id = md.created_by
         ${where}
         ORDER BY md.year DESC, md.month DESC, e.name`,
        values
    );
    return rows;
};

const correctDeduction = async (id, deductionAmount, remarks, userId) => {
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();
        const [rows] = await connection.execute(
            "SELECT * FROM monthly_deductions WHERE id = ? FOR UPDATE",
            [id]
        );
        const previous = rows[0];
        if (!previous) {
            await connection.rollback();
            return { notFound: true };
        }
        const calculationDetails =
            typeof previous.calculation_details === "string"
                ? JSON.parse(previous.calculation_details)
                : previous.calculation_details || {};
        const correctedDetails = {
            ...calculationDetails,
            calculated_deduction_amount:
                calculationDetails.deduction_amount ??
                previous.deduction_amount,
            deduction_amount: deductionAmount,
            correction_reason: remarks
        };
        await connection.execute(
            `UPDATE monthly_deductions
             SET deduction_amount = ?, calculation_details = ?, remarks = ?
             WHERE id = ?`,
            [
                deductionAmount,
                JSON.stringify(correctedDetails),
                remarks,
                id
            ]
        );
        await connection.execute(
            `INSERT INTO audit_logs (
                user_id, action, entity_type, entity_id, old_values, new_values
             ) VALUES (?, 'correction', 'monthly_deduction', ?, ?, ?)`,
            [
                userId,
                id,
                JSON.stringify({
                    deduction_amount: previous.deduction_amount,
                    remarks: previous.remarks
                }),
                JSON.stringify({ deduction_amount: deductionAmount, remarks })
            ]
        );
        await connection.commit();
        return { updated: true };
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
};

module.exports = {
    calculateDeductions,
    saveDeductions,
    listDeductions,
    correctDeduction
};

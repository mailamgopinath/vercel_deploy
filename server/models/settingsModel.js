const db = require("../config/db");

const getSettings = async () => {
    await db.execute(
        "INSERT IGNORE INTO attendance_settings (id) VALUES (1)"
    );
    const [rows] = await db.execute(
        `SELECT id, working_days_per_month, working_hours_per_day,
                per_day_method, half_day_multiplier, absent_multiplier,
                late_deduction_enabled, late_after, late_deduction_amount,
                updated_at
         FROM attendance_settings
         WHERE id = 1`
    );
    return rows[0];
};

const updateSettings = async (settings, userId) => {
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();
        const [previousRows] = await connection.execute(
            `SELECT id, working_days_per_month, working_hours_per_day,
                    per_day_method, half_day_multiplier, absent_multiplier,
                    late_deduction_enabled, late_after,
                    late_deduction_amount
             FROM attendance_settings
             WHERE id = 1
             FOR UPDATE`
        );
        const previous = previousRows[0];
        await connection.execute(
            `UPDATE attendance_settings
             SET working_days_per_month = ?,
                 working_hours_per_day = ?,
                 per_day_method = ?,
                 half_day_multiplier = ?,
                 absent_multiplier = ?,
                 late_deduction_enabled = ?,
                 late_after = ?,
                 late_deduction_amount = ?
             WHERE id = 1`,
            [
                settings.working_days_per_month,
                settings.working_hours_per_day,
                settings.per_day_method,
                settings.half_day_multiplier,
                settings.absent_multiplier,
                settings.late_deduction_enabled,
                settings.late_after,
                settings.late_deduction_amount
            ]
        );
        await connection.execute(
            `INSERT INTO audit_logs (
                user_id, action, entity_type, entity_id, old_values, new_values
             ) VALUES (?, 'update', 'attendance_settings', 1, ?, ?)`,
            [userId, JSON.stringify(previous), JSON.stringify(settings)]
        );
        await connection.commit();
        return getSettings();
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
};

module.exports = { getSettings, updateSettings };

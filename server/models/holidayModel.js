const db = require("../config/db");

const listHolidays = async () => {
    const [rows] = await db.execute(
        `SELECT h.id, h.holiday_date, h.name, d.name AS department
         FROM holidays h
         LEFT JOIN departments d ON d.id = h.department_id
         ORDER BY h.holiday_date DESC, h.name`
    );
    return rows;
};

const listDepartments = async () => {
    const [rows] = await db.execute(
        `SELECT DISTINCT department AS name
         FROM employees
         WHERE department IS NOT NULL AND department <> ''
           AND status <> 'deleted'
         ORDER BY department`
    );
    return rows.map((row) => row.name);
};

const createHoliday = async ({ date, name, department }) => {
    let departmentId = null;
    if (department) {
        await db.execute(
            "INSERT IGNORE INTO departments (name) VALUES (?)",
            [department]
        );
        const [departments] = await db.execute(
            "SELECT id FROM departments WHERE name = ? LIMIT 1",
            [department]
        );
        departmentId = departments[0].id;
    }

    const [existing] = await db.execute(
        `SELECT id FROM holidays
         WHERE holiday_date = ?
           AND name = ?
           AND department_id <=> ?
         LIMIT 1`,
        [date, name, departmentId]
    );
    if (existing.length > 0) {
        return { duplicate: true };
    }

    const [result] = await db.execute(
        "INSERT INTO holidays (holiday_date, name, department_id) VALUES (?, ?, ?)",
        [date, name, departmentId]
    );
    return { id: result.insertId };
};

const deleteHoliday = async (id) => {
    const [result] = await db.execute("DELETE FROM holidays WHERE id = ?", [id]);
    return result.affectedRows > 0;
};

module.exports = { listHolidays, listDepartments, createHoliday, deleteHoliday };

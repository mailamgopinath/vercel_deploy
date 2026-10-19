const db = require("../config/db");

const employeeFields = `
    id,
    employee_code,
    name,
    email,
    phone,
    department,
    designation,
    gender,
    date_of_joining,
    basic_monthly_salary,
    profile_image,
    status
`;

const listEmployees = async ({ search, department, status, limit, offset }) => {
    const conditions = [];
    const values = [];

    if (search) {
        conditions.push("(name LIKE ? OR employee_code LIKE ?)");
        values.push(`%${search}%`, `%${search}%`);
    }

    if (department) {
        conditions.push("department = ?");
        values.push(department);
    }

    if (status === "deleted") {
        conditions.push("status = 'deleted'");
    } else if (status === "active" || status === "inactive") {
        conditions.push("status = ?");
        values.push(status);
    } else {
        conditions.push("status IN ('active', 'inactive')");
    }

    const where = `WHERE ${conditions.join(" AND ")}`;
    const [[{ total }]] = await db.execute(
        `SELECT COUNT(*) AS total FROM employees ${where}`,
        values
    );
    const [employees] = await db.execute(
        `SELECT ${employeeFields}
         FROM employees
         ${where}
         ORDER BY id DESC
         LIMIT ? OFFSET ?`,
        [...values, limit, offset]
    );

    return { employees, total };
};

const findEmployeeById = async (id) => {
    const [rows] = await db.execute(
        `SELECT ${employeeFields} FROM employees WHERE id = ? LIMIT 1`,
        [id]
    );

    return rows[0];
};

const createEmployee = async (employee) => {
    const [result] = await db.execute(
        `INSERT INTO employees (
            employee_code, name, email, phone, department, designation,
            gender, date_of_joining, basic_monthly_salary, profile_image, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
            employee.employee_code,
            employee.name,
            employee.email,
            employee.phone,
            employee.department,
            employee.designation,
            employee.gender,
            employee.date_of_joining,
            employee.basic_monthly_salary,
            employee.profile_image,
            employee.status
        ]
    );

    return findEmployeeById(result.insertId);
};

const updateEmployee = async (id, employee) => {
    await db.execute(
        `UPDATE employees
         SET employee_code = ?, name = ?, email = ?, phone = ?,
             department = ?, designation = ?, gender = ?, date_of_joining = ?,
             basic_monthly_salary = ?, profile_image = ?, status = ?
         WHERE id = ? AND status <> 'deleted'`,
        [
            employee.employee_code,
            employee.name,
            employee.email,
            employee.phone,
            employee.department,
            employee.designation,
            employee.gender,
            employee.date_of_joining,
            employee.basic_monthly_salary,
            employee.profile_image,
            employee.status,
            id
        ]
    );

    return findEmployeeById(id);
};

const softDeleteEmployee = async (id) => {
    const [result] = await db.execute(
        "UPDATE employees SET status = 'deleted' WHERE id = ? AND status <> 'deleted'",
        [id]
    );

    return result.affectedRows > 0;
};

const listDepartments = async () => {
    const [rows] = await db.execute(
        `SELECT DISTINCT department
         FROM employees
         WHERE department IS NOT NULL AND department <> ''
           AND status <> 'deleted'
         ORDER BY department`
    );

    return rows.map((row) => row.department);
};

module.exports = {
    listEmployees,
    findEmployeeById,
    createEmployee,
    updateEmployee,
    softDeleteEmployee,
    listDepartments
};

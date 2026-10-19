const db = require("./db");

const ensureEmployeeColumn = async (name, definition) => {
    const [columns] = await db.execute(
        `SELECT COLUMN_NAME
         FROM information_schema.COLUMNS
         WHERE TABLE_SCHEMA = DATABASE()
           AND TABLE_NAME = 'employees'
           AND COLUMN_NAME = ?`,
        [name]
    );

    if (columns.length === 0) {
        await db.query(`ALTER TABLE employees ADD COLUMN ${name} ${definition}`);
    }
};

const ensureEmployeeIndex = async (name, columns) => {
    const [indexes] = await db.execute(
        `SELECT INDEX_NAME
         FROM information_schema.STATISTICS
         WHERE TABLE_SCHEMA = DATABASE()
           AND TABLE_NAME = 'employees'
           AND INDEX_NAME = ?`,
        [name]
    );

    if (indexes.length === 0) {
        await db.query(`CREATE UNIQUE INDEX ${name} ON employees (${columns})`);
    }
};

const ensureAttendanceIndex = async () => {
    const [indexes] = await db.execute(
        `SELECT INDEX_NAME
         FROM information_schema.STATISTICS
         WHERE TABLE_SCHEMA = DATABASE()
           AND TABLE_NAME = 'attendance'
           AND INDEX_NAME = 'uq_attendance_employee_date'`
    );

    if (indexes.length > 0) {
        return;
    }

    const [[{ duplicateGroups }]] = await db.query(
        `SELECT COUNT(*) AS duplicateGroups
         FROM (
             SELECT employee_id, attendance_date
             FROM attendance
             GROUP BY employee_id, attendance_date
             HAVING COUNT(*) > 1
         ) duplicates`
    );

    if (duplicateGroups > 0) {
        throw new Error(
            `Cannot add attendance uniqueness constraint: ${duplicateGroups} employee/date pair(s) have duplicate records. Resolve duplicates before restarting.`
        );
    }

    await db.query(
        `CREATE UNIQUE INDEX uq_attendance_employee_date
         ON attendance (employee_id, attendance_date)`
    );
};

const ensureMonthlyDeductionIndex = async () => {
    const [indexes] = await db.execute(
        `SELECT INDEX_NAME
         FROM information_schema.STATISTICS
         WHERE TABLE_SCHEMA = DATABASE()
           AND TABLE_NAME = 'monthly_deductions'
           AND INDEX_NAME = 'uq_monthly_deduction_employee_month_year'`
    );
    if (indexes.length > 0) {
        return;
    }

    const [[{ duplicateGroups }]] = await db.query(
        `SELECT COUNT(*) AS duplicateGroups
         FROM (
             SELECT employee_id, month, year
             FROM monthly_deductions
             GROUP BY employee_id, month, year
             HAVING COUNT(*) > 1
         ) duplicates`
    );
    if (duplicateGroups > 0) {
        throw new Error(
            `Cannot add monthly deduction uniqueness constraint: ${duplicateGroups} employee/month pair(s) have duplicate records. Resolve duplicates before restarting.`
        );
    }

    await db.query(
        `CREATE UNIQUE INDEX uq_monthly_deduction_employee_month_year
         ON monthly_deductions (employee_id, month, year)`
    );
};

const ensureColumn = async (tableName, columnName, definition) => {
    const [columns] = await db.execute(
        `SELECT COLUMN_NAME
         FROM information_schema.COLUMNS
         WHERE TABLE_SCHEMA = DATABASE()
           AND TABLE_NAME = ?
           AND COLUMN_NAME = ?`,
        [tableName, columnName]
    );

    if (columns.length === 0) {
        await db.query(
            `ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${definition}`
        );
    }
};

const ensureForeignKey = async (tableName, constraintName, definition) => {
    const [constraints] = await db.execute(
        `SELECT CONSTRAINT_NAME
         FROM information_schema.REFERENTIAL_CONSTRAINTS
         WHERE CONSTRAINT_SCHEMA = DATABASE()
           AND TABLE_NAME = ?
           AND CONSTRAINT_NAME = ?`,
        [tableName, constraintName]
    );

    if (constraints.length === 0) {
        await db.query(
            `ALTER TABLE ${tableName} ADD CONSTRAINT ${constraintName} ${definition}`
        );
    }
};

const initializeDatabase = async () => {
    await db.query(`
        CREATE TABLE IF NOT EXISTS departments (
            id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(150) NOT NULL UNIQUE,
            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        )
    `);

    await db.query(`
        CREATE TABLE IF NOT EXISTS employees (
            id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
            employee_code VARCHAR(50) NOT NULL UNIQUE,
            name VARCHAR(255) NOT NULL,
            department VARCHAR(255) NULL,
            status VARCHAR(20) NOT NULL DEFAULT 'active'
        )
    `);

    await ensureEmployeeColumn("email", "VARCHAR(255) NULL");
    await ensureEmployeeColumn("phone", "VARCHAR(30) NULL");
    await ensureEmployeeColumn("designation", "VARCHAR(150) NULL");
    await ensureEmployeeColumn("gender", "VARCHAR(30) NULL");
    await ensureEmployeeColumn("date_of_joining", "DATE NULL");
    await ensureEmployeeColumn(
        "basic_monthly_salary",
        "DECIMAL(12, 2) NOT NULL DEFAULT 0"
    );
    await ensureEmployeeColumn("profile_image", "VARCHAR(255) NULL");
    await ensureEmployeeIndex("uq_employees_email", "email");

    await db.query(`
        CREATE TABLE IF NOT EXISTS attendance (
            id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
            employee_id INT NOT NULL,
            attendance_date DATE NOT NULL,
            status VARCHAR(20) NOT NULL,
            check_in TIME NULL,
            check_out TIME NULL,
            remarks TEXT NULL,
            UNIQUE KEY uq_attendance_employee_date (employee_id, attendance_date),
            CONSTRAINT fk_attendance_employee
                FOREIGN KEY (employee_id) REFERENCES employees(id)
        )
    `);

    const [attendanceRemarks] = await db.execute(
        `SELECT COLUMN_NAME
         FROM information_schema.COLUMNS
         WHERE TABLE_SCHEMA = DATABASE()
           AND TABLE_NAME = 'attendance'
           AND COLUMN_NAME = 'remarks'`
    );
    if (attendanceRemarks.length === 0) {
        await db.query("ALTER TABLE attendance ADD COLUMN remarks TEXT NULL");
    }
    await ensureAttendanceIndex();

    await db.query(`
        CREATE TABLE IF NOT EXISTS monthly_deductions (
            id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
            employee_id INT NOT NULL,
            month TINYINT UNSIGNED NOT NULL,
            year SMALLINT UNSIGNED NOT NULL,
            monthly_salary DECIMAL(12, 2) NOT NULL DEFAULT 0,
            deduction_amount DECIMAL(12, 2) NOT NULL DEFAULT 0,
            calculation_details JSON NULL,
            remarks VARCHAR(500) NULL,
            created_by INT NULL,
            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            CONSTRAINT fk_monthly_deductions_employee
                FOREIGN KEY (employee_id) REFERENCES employees(id),
            CONSTRAINT fk_monthly_deductions_user
                FOREIGN KEY (created_by) REFERENCES users(id),
            UNIQUE KEY uq_monthly_deduction_employee_month_year
                (employee_id, month, year)
        )
    `);

    await ensureColumn(
        "monthly_deductions",
        "monthly_salary",
        "DECIMAL(12, 2) NOT NULL DEFAULT 0"
    );
    await ensureColumn("monthly_deductions", "calculation_details", "JSON NULL");
    await ensureColumn("monthly_deductions", "remarks", "VARCHAR(500) NULL");
    await ensureColumn("monthly_deductions", "created_by", "INT NULL");
    await ensureColumn(
        "monthly_deductions",
        "created_at",
        "TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP"
    );
    await ensureForeignKey(
        "monthly_deductions",
        "fk_monthly_deductions_user",
        "FOREIGN KEY (created_by) REFERENCES users(id)"
    );
    await ensureMonthlyDeductionIndex();

    await db.query(`
        CREATE TABLE IF NOT EXISTS attendance_settings (
            id TINYINT UNSIGNED NOT NULL PRIMARY KEY,
            working_days_per_month DECIMAL(5, 2) NOT NULL DEFAULT 26,
            working_hours_per_day DECIMAL(4, 2) NOT NULL DEFAULT 8,
            per_day_method ENUM('fixed_working_days', 'calendar_days')
                NOT NULL DEFAULT 'fixed_working_days',
            half_day_multiplier DECIMAL(4, 2) NOT NULL DEFAULT 0.5,
            absent_multiplier DECIMAL(4, 2) NOT NULL DEFAULT 1,
            late_deduction_enabled BOOLEAN NOT NULL DEFAULT FALSE,
            late_after TIME NOT NULL DEFAULT '09:00:00',
            late_deduction_amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
            updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
                ON UPDATE CURRENT_TIMESTAMP
        )
    `);
    await db.query(`
        INSERT IGNORE INTO attendance_settings (id) VALUES (1)
    `);

    await db.query(`
        CREATE TABLE IF NOT EXISTS holidays (
            id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
            holiday_date DATE NOT NULL,
            name VARCHAR(150) NOT NULL,
            department_id INT NULL,
            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            CONSTRAINT fk_holidays_department
                FOREIGN KEY (department_id) REFERENCES departments(id),
            INDEX idx_holidays_date (holiday_date)
        )
    `);

    await db.query(`
        CREATE TABLE IF NOT EXISTS audit_logs (
            id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
            user_id INT NULL,
            action VARCHAR(100) NOT NULL,
            entity_type VARCHAR(100) NOT NULL,
            entity_id BIGINT NOT NULL,
            old_values JSON NULL,
            new_values JSON NULL,
            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            CONSTRAINT fk_audit_logs_user
                FOREIGN KEY (user_id) REFERENCES users(id),
            INDEX idx_audit_logs_entity (entity_type, entity_id),
            INDEX idx_audit_logs_created_at (created_at)
        )
    `);
};

module.exports = initializeDatabase;

const db = require("../config/db");

const findUserByEmail = async (email) => {
    const sql = `
        SELECT id, name, email, password, role, status
        FROM users
        WHERE email = ?
        LIMIT 1
    `;

    const [rows] = await db.execute(sql, [email]);

    return rows[0];
};

module.exports = {
    findUserByEmail
};
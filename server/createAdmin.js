require("dotenv").config();

const bcrypt = require("bcrypt");
const db = require("./config/db");

async function createAdmin() {
    const name = "Admin";
    const email = "admin@example.com";
    const password = "Admin@123";

    try {
        const hashedPassword = await bcrypt.hash(password, 12);

        const sql = `
            INSERT INTO users (name, email, password, role, status)
            VALUES (?, ?, ?, 'admin', 'active')
        `;

        await db.execute(sql, [
            name,
            email,
            hashedPassword
        ]);

        console.log("Admin account created successfully");
    } catch (error) {
        console.error("Unable to create admin:", error.message);
    } finally {
        await db.end();
    }
}

createAdmin();
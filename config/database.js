const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcryptjs');

const dbPath = path.resolve(__dirname, '../database.sqlite');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error connecting to database:', err);
    } else {
        console.log('Connected to SQLite database');
        initializeDatabase();
    }
});

db.run('PRAGMA foreign_keys = ON');

function runQuery(query) {
    return new Promise((resolve, reject) => {
        db.run(query, (err) => {
            if (err) {
                console.error('Error running query:', query, err);
                reject(err);
            } else {
                resolve();
            }
        });
    });
}

async function initializeDatabase() {
    try {
        await runQuery(`CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            role TEXT NOT NULL,
            last_company_id INTEGER,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);
        console.log('Users table created or already exists');

        await runQuery(`CREATE TABLE IF NOT EXISTS companies (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            cnpj TEXT UNIQUE,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            created_by INTEGER,
            FOREIGN KEY(created_by) REFERENCES users(id)
        )`);
        console.log('Companies table created or already exists');

        await runQuery(`CREATE TABLE IF NOT EXISTS user_companies (
            user_id INTEGER,
            company_id INTEGER,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY(company_id) REFERENCES companies(id) ON DELETE CASCADE,
            PRIMARY KEY(user_id, company_id)
        )`);
        console.log('User-companies table created or already exists');

        await runQuery(`CREATE TABLE IF NOT EXISTS products (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            description TEXT,
            sku TEXT UNIQUE,
            cost_price DECIMAL(10,2) NOT NULL,
            selling_price DECIMAL(10,2) NOT NULL,
            quantity INTEGER DEFAULT 0,
            min_quantity INTEGER DEFAULT 0,
            unit_type TEXT NOT NULL,
            units_per_package INTEGER DEFAULT 1,
            category TEXT,
            company_id INTEGER NOT NULL,
            created_by INTEGER NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(company_id) REFERENCES companies(id) ON DELETE CASCADE,
            FOREIGN KEY(created_by) REFERENCES users(id)
        )`);
        console.log('Products table created or already exists');

        await runQuery(`CREATE TRIGGER IF NOT EXISTS update_products_timestamp 
            AFTER UPDATE ON products
            BEGIN
                UPDATE products SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
            END;
        `);
        console.log('Trigger for updating products timestamp created or already exists');

        await createMasterUser();
        console.log('Database initialized successfully');
    } catch (error) {
        console.error('Error initializing database:', error);
    }
}

function createMasterUser() {
    return new Promise((resolve, reject) => {
        db.get("SELECT * FROM users WHERE role = 'master'", [], async (err, row) => {
            if (err) {
                reject(err);
                return;
            }
            if (!row) {
                try {
                    const hashedPassword = await bcrypt.hash('master123', 10);
                    db.run(
                        `INSERT INTO users (username, password, role) VALUES ('master', ?, 'master')`,
                        [hashedPassword],
                        (err) => {
                            if (err) reject(err);
                            else {
                                console.log('Master user created successfully');
                                resolve();
                            }
                        }
                    );
                } catch (err) {
                    reject(err);
                }
            } else {
                console.log('Master user already exists');
                resolve();
            }
        });
    });
}

module.exports = db;

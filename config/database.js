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

function checkColumnExists(table, column) {
    return new Promise((resolve, reject) => {
        db.get(`PRAGMA table_info(${table})`, [], (err, rows) => {
            if (err) {
                reject(err);
                return;
            }
            const columnExists = rows && rows.some(row => row.name === column);
            resolve(columnExists);
        });
    });
}

async function initializeDatabase() {
    try {
        // 1. Criar tabela de usuários primeiro
        await runQuery(`CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            role TEXT NOT NULL,
            last_company_id INTEGER,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);

        // 2. Criar tabela de empresas
        await runQuery(`CREATE TABLE IF NOT EXISTS companies (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            cnpj TEXT UNIQUE,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            created_by INTEGER,
            FOREIGN KEY(created_by) REFERENCES users(id)
        )`);

        // 3. Criar tabela de relação usuário-empresa
        await runQuery(`CREATE TABLE IF NOT EXISTS user_companies (
            user_id INTEGER,
            company_id INTEGER,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY(company_id) REFERENCES companies(id) ON DELETE CASCADE,
            PRIMARY KEY(user_id, company_id)
        )`);

        // 4. Verificar se a coluna last_company_id já existe antes de tentar adicioná-la
        const hasLastCompanyId = await checkColumnExists('users', 'last_company_id');
        if (!hasLastCompanyId) {
            await runQuery(`PRAGMA foreign_keys=off;`);
            await runQuery(`ALTER TABLE users ADD COLUMN last_company_id INTEGER REFERENCES companies(id)`);
            await runQuery(`PRAGMA foreign_keys=on;`);
        }

        // 5. Criar usuário master se não existir
        db.get("SELECT * FROM users WHERE role = 'master'", [], async (err, row) => {
            if (err) {
                console.error('Error checking master user:', err);
                return;
            }
            
            if (!row) {
                try {
                    const hashedPassword = await bcrypt.hash('master123', 10);
                    db.run(`INSERT INTO users (username, password, role) 
                           VALUES ('master', ?, 'master')`, 
                           [hashedPassword]);
                    console.log('Master user created successfully');
                } catch (err) {
                    console.error('Error creating master user:', err);
                }
            }
        });

        console.log('Database initialized successfully');
    } catch (error) {
        console.error('Error initializing database:', error);
    }
}

// Habilitar foreign keys
db.run('PRAGMA foreign_keys = ON');

module.exports = db;
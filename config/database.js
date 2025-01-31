const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcryptjs');

const dbPath = path.resolve(__dirname, '../database.sqlite');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Erro ao conectar ao banco de dados:', err);
    } else {
        console.log('Conectado ao banco de dados SQLite');
        initializeDatabase();
    }
});

db.run('PRAGMA foreign_keys = ON');

function runQuery(query) {
    return new Promise((resolve, reject) => {
        db.run(query, (err) => {
            if (err) {
                console.error('Erro ao executar query:', query, err);
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
        console.log('Tabela de usuários criada ou já existe');

        await runQuery(`CREATE TABLE IF NOT EXISTS companies (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            cnpj TEXT UNIQUE,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            created_by INTEGER,
            FOREIGN KEY(created_by) REFERENCES users(id)
        )`);
        console.log('Tabela de empresas criada ou já existe');

        await runQuery(`CREATE TABLE IF NOT EXISTS user_companies (
            user_id INTEGER,
            company_id INTEGER,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY(company_id) REFERENCES companies(id) ON DELETE CASCADE,
            PRIMARY KEY(user_id, company_id)
        )`);
        console.log('Tabela de usuários-empresas criada ou já existe');

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
        console.log('Tabela de produtos criada ou já existe');

        await runQuery(`CREATE TABLE IF NOT EXISTS clients (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT,
            email TEXT,
            phone TEXT,
            cpf TEXT,
            birth_date TEXT,
            address TEXT,
            company_id INTEGER NOT NULL,
            created_by INTEGER NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(company_id) REFERENCES companies(id) ON DELETE CASCADE,
            FOREIGN KEY(created_by) REFERENCES users(id)
        )`);
        console.log('Tabela de clientes criada ou já existe');

        await runQuery(`CREATE TABLE IF NOT EXISTS sales (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            client_id INTEGER NOT NULL,
            company_id INTEGER NOT NULL,
            created_by INTEGER NOT NULL,
            total_amount DECIMAL(10,2) NOT NULL,
            sale_date DATETIME DEFAULT CURRENT_TIMESTAMP,
            status TEXT DEFAULT 'completed',
            notes TEXT,
            FOREIGN KEY(client_id) REFERENCES clients(id),
            FOREIGN KEY(company_id) REFERENCES companies(id),
            FOREIGN KEY(created_by) REFERENCES users(id)
        )`);
        console.log('Tabela de vendas criada ou já existe');

        await runQuery(`CREATE TABLE IF NOT EXISTS sale_items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            sale_id INTEGER NOT NULL,
            product_id INTEGER NOT NULL,
            quantity INTEGER NOT NULL,
            unit_price DECIMAL(10,2) NOT NULL,
            total_price DECIMAL(10,2) NOT NULL,
            FOREIGN KEY(sale_id) REFERENCES sales(id) ON DELETE CASCADE,
            FOREIGN KEY(product_id) REFERENCES products(id)
        )`);
        console.log('Tabela de itens de venda criada ou já existe');

        await runQuery(`CREATE TRIGGER IF NOT EXISTS update_product_quantity 
            AFTER INSERT ON sale_items
            BEGIN
                UPDATE products 
                SET quantity = quantity - NEW.quantity
                WHERE id = NEW.product_id;
            END;
        `);
        console.log('Trigger para atualização da quantidade de produtos criada');

        await runQuery(`CREATE TRIGGER IF NOT EXISTS update_products_timestamp 
            AFTER UPDATE ON products
            BEGIN
                UPDATE products SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
            END;
        `);
        console.log('Trigger para atualização de timestamp dos produtos criada ou já existe');

        await createMasterUser();
        console.log('Banco de dados inicializado com sucesso');
    } catch (error) {
        console.error('Erro ao inicializar o banco de dados:', error);
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
                                console.log('Usuário master criado com sucesso');
                                resolve();
                            }
                        }
                    );
                } catch (err) {
                    reject(err);
                }
            } else {
                console.log('Usuário master já existe');
                resolve();
            }
        });
    });
}

module.exports = db;

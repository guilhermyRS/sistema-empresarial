const db = require('../config/database');

class Client {
    static getAll() {
        return new Promise((resolve, reject) => {
            db.all('SELECT * FROM clients ORDER BY name', [], (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    }

    static getByCompanyId(companyId) {
        return new Promise((resolve, reject) => {
            db.all('SELECT * FROM clients WHERE company_id = ? ORDER BY name', [companyId], (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    }

    static getById(id) {
        return new Promise((resolve, reject) => {
            db.get('SELECT * FROM clients WHERE id = ?', [id], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
    }

    static create(clientData) {
        return new Promise((resolve, reject) => {
            const { name, email, phone, cpf, birth_date, address, company_id, created_by } = clientData;
            db.run(
                'INSERT INTO clients (name, email, phone, cpf, birth_date, address, company_id, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
                [name, email, phone, cpf, birth_date, address, company_id, created_by],
                function(err) {
                    if (err) reject(err);
                    else resolve(this.lastID);
                }
            );
        });
    }

    static update(id, clientData) {
        return new Promise((resolve, reject) => {
            const { name, email, phone, cpf, birth_date, address, company_id } = clientData;
            db.run(
                'UPDATE clients SET name = ?, email = ?, phone = ?, cpf = ?, birth_date = ?, address = ?, company_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
                [name, email, phone, cpf, birth_date, address, company_id, id],
                (err) => {
                    if (err) reject(err);
                    else resolve();
                }
            );
        });
    }

    static delete(id) {
        return new Promise((resolve, reject) => {
            db.run('DELETE FROM clients WHERE id = ?', [id], (err) => {
                if (err) reject(err);
                else resolve();
            });
        });
    }
}

module.exports = Client;
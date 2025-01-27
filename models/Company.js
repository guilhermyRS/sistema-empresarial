const db = require('../config/database');

class Company {
    static async create(companyData, userId) {
        const { name, cnpj } = companyData;

        return new Promise((resolve, reject) => {
            db.run(
                'INSERT INTO companies (name, cnpj, created_by) VALUES (?, ?, ?)',
                [name, cnpj, userId],
                function (err) {
                    if (err) {
                        if (err.message.includes('UNIQUE')) {
                            reject(new Error('CNPJ já cadastrado'));
                        } else {
                            reject(err);
                        }
                    }
                    resolve(this.lastID);
                }
            );
        });
    }

    static async getUserCompany(userId) {
        return new Promise((resolve, reject) => {
            const query = `
                SELECT c.*, u.last_company_id
                FROM companies c
                JOIN user_companies uc ON c.id = uc.company_id
                JOIN users u ON u.id = uc.user_id
                WHERE uc.user_id = ?
                AND c.id = u.last_company_id
            `;

            db.get(query, [userId], (err, row) => {
                if (err) reject(err);
                if (!row) {
                    // Se não encontrar com last_company_id, pega a primeira empresa do usuário
                    const fallbackQuery = `
                        SELECT c.*
                        FROM companies c
                        JOIN user_companies uc ON c.id = uc.company_id
                        WHERE uc.user_id = ?
                        LIMIT 1
                    `;
                    db.get(fallbackQuery, [userId], (err, fallbackRow) => {
                        if (err) reject(err);
                        resolve(fallbackRow);
                    });
                } else {
                    resolve(row);
                }
            });
        });
    }

    static async addUserToCompany(userId, companyId) {
        return new Promise((resolve, reject) => {
            db.serialize(() => {
                db.run('BEGIN TRANSACTION');

                // Adicionar usuário à empresa
                db.run(
                    'INSERT INTO user_companies (user_id, company_id) VALUES (?, ?)',
                    [userId, companyId],
                    (err) => {
                        if (err) {
                            db.run('ROLLBACK');
                            return reject(err);
                        }

                        // Atualizar a última empresa do usuário
                        db.run(
                            'UPDATE users SET last_company_id = ? WHERE id = ?',
                            [companyId, userId],
                            (err) => {
                                if (err) {
                                    db.run('ROLLBACK');
                                    return reject(err);
                                }

                                db.run('COMMIT');
                                resolve();
                            }
                        );
                    }
                );
            });
        });
    }

    static async removeUserFromCompany(userId, companyId) {
        return new Promise((resolve, reject) => {
            db.run(
                'DELETE FROM user_companies WHERE user_id = ? AND company_id = ?',
                [userId, companyId],
                (err) => {
                    if (err) reject(err);
                    resolve();
                }
            );
        });
    }

    static async getAll() {
        return new Promise((resolve, reject) => {
            db.all(`
                SELECT c.*, COUNT(uc.user_id) as user_count 
                FROM companies c 
                LEFT JOIN user_companies uc ON c.id = uc.company_id 
                GROUP BY c.id
                ORDER BY c.name
            `, [], (err, rows) => {
                if (err) reject(err);
                resolve(rows);
            });
        });
    }

    static async getById(id) {
        return new Promise((resolve, reject) => {
            db.get(`
                SELECT c.*, 
                       (SELECT COUNT(*) FROM user_companies uc WHERE uc.company_id = c.id) as user_count
                FROM companies c 
                WHERE c.id = ?
            `, [id], (err, row) => {
                if (err) reject(err);
                resolve(row);
            });
        });
    }

    static async getCompanyUsers(companyId) {
        return new Promise((resolve, reject) => {
            db.all(`
                SELECT u.id, u.username, u.role 
                FROM users u 
                JOIN user_companies uc ON u.id = uc.user_id 
                WHERE uc.company_id = ? AND u.role = 'admin'
                ORDER BY u.username
            `, [companyId], (err, rows) => {
                if (err) reject(err);
                resolve(rows);
            });
        });
    }

    static async getUserCurrentCompany(userId) {
        return new Promise((resolve, reject) => {
            const query = `
                SELECT c.* 
                FROM companies c
                JOIN user_companies uc ON c.id = uc.company_id
                JOIN users u ON u.id = uc.user_id
                WHERE u.id = ? AND u.last_company_id = c.id
            `;

            db.get(query, [userId], (err, row) => {
                if (err) reject(err);
                resolve(row);
            });
        });
    }

    static async getUserCompanies(userId) {
        return new Promise((resolve, reject) => {
            const query = `
                SELECT c.*, 
                       CASE WHEN u.last_company_id = c.id THEN 1 ELSE 0 END as is_current
                FROM companies c
                JOIN user_companies uc ON c.id = uc.company_id
                JOIN users u ON u.id = uc.user_id
                WHERE u.id = ?
                ORDER BY c.name
            `;

            db.all(query, [userId], (err, rows) => {
                if (err) reject(err);
                resolve(rows);
            });
        });
    }

    static async setUserLastCompany(userId, companyId) {
        return new Promise((resolve, reject) => {
            db.run(
                'UPDATE users SET last_company_id = ? WHERE id = ?',
                [companyId, userId],
                (err) => {
                    if (err) reject(err);
                    resolve();
                }
            );
        });
    }
}

module.exports = Company;
const db = require('../config/database');
const bcrypt = require('bcryptjs');

class User {

    static async getAvailableAdmins(companyId) {
        return new Promise((resolve, reject) => {
            const query = `
                SELECT u.id, u.username 
                FROM users u 
                WHERE u.role = 'admin' 
                AND u.id NOT IN (
                    SELECT user_id 
                    FROM user_companies 
                    WHERE company_id = ?
                )
                ORDER BY u.username
            `;
            
            db.all(query, [companyId], (err, rows) => {
                if (err) reject(err);
                resolve(rows);
            });
        });
    }
    static async findByUsername(username) {
        return new Promise((resolve, reject) => {
            db.get('SELECT * FROM users WHERE username = ?', [username], (err, row) => {
                if (err) reject(err);
                resolve(row);
            });
        });
    }

    static async findById(id) {
        return new Promise((resolve, reject) => {
            db.get('SELECT * FROM users WHERE id = ?', [id], (err, row) => {
                if (err) reject(err);
                resolve(row);
            });
        });
    }

    static async create(userData) {
        const { username, password, role } = userData;
        
        if (!username || !password || !role) {
            throw new Error('Username, password e role são obrigatórios');
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        return new Promise((resolve, reject) => {
            db.run(
                'INSERT INTO users (username, password, role) VALUES (?, ?, ?)',
                [username, hashedPassword, role],
                function(err) {
                    if (err) {
                        if (err.message.includes('UNIQUE')) {
                            reject(new Error('Username já existe'));
                        } else {
                            reject(err);
                        }
                    }
                    resolve(this.lastID);
                }
            );
        });
    }

    static async getAll() {
        return new Promise((resolve, reject) => {
            db.all('SELECT id, username, role, created_at FROM users', [], (err, rows) => {
                if (err) reject(err);
                resolve(rows);
            });
        });
    }

    static async update(id, userData) {
        const updates = [];
        const values = [];

        if (userData.username) {
            updates.push('username = ?');
            values.push(userData.username);
        }

        if (userData.password) {
            updates.push('password = ?');
            values.push(await bcrypt.hash(userData.password, 10));
        }

        if (userData.role) {
            updates.push('role = ?');
            values.push(userData.role);
        }

        if (userData.last_company_id !== undefined) {
            updates.push('last_company_id = ?');
            values.push(userData.last_company_id);
        }

        if (updates.length === 0) {
            throw new Error('Nenhum dado para atualizar');
        }

        values.push(id);

        return new Promise((resolve, reject) => {
            db.run(
                `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
                values,
                (err) => {
                    if (err) reject(err);
                    resolve();
                }
            );
        });
    }

    static async delete(id) {
        return new Promise((resolve, reject) => {
            // Não permite deletar o último usuário master
            db.get("SELECT COUNT(*) as count FROM users WHERE role = 'master'", [], (err, row) => {
                if (err) {
                    reject(err);
                    return;
                }

                db.get("SELECT role FROM users WHERE id = ?", [id], (err, user) => {
                    if (err) {
                        reject(err);
                        return;
                    }

                    if (user && user.role === 'master' && row.count <= 1) {
                        reject(new Error('Cannot delete the last master user'));
                        return;
                    }

                    db.run('DELETE FROM users WHERE id = ?', [id], (err) => {
                        if (err) reject(err);
                        else resolve();
                    });
                });
            });
        });
    }
}

module.exports = User;
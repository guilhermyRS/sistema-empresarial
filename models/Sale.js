const db = require('../config/database');

class Sale {
    static async create(saleData, items) {
        return new Promise((resolve, reject) => {
            db.serialize(() => {
                db.run('BEGIN TRANSACTION');

                db.run(
                    `INSERT INTO sales (client_id, company_id, created_by, total_amount, notes)
                     VALUES (?, ?, ?, ?, ?)`,
                    [
                        saleData.client_id,
                        saleData.company_id,
                        saleData.created_by,
                        saleData.total_amount,
                        saleData.notes
                    ],
                    function (err) {
                        if (err) {
                            db.run('ROLLBACK');
                            return reject(err);
                        }

                        const saleId = this.lastID;
                        let completed = 0;
                        let failed = false;

                        items.forEach((item) => {
                            db.run(
                                `INSERT INTO sale_items (sale_id, product_id, quantity, unit_price, total_price)
                                 VALUES (?, ?, ?, ?, ?)`,
                                [
                                    saleId,
                                    item.product_id,
                                    item.quantity,
                                    item.unit_price,
                                    item.quantity * item.unit_price
                                ],
                                (err) => {
                                    if (err) {
                                        failed = true;
                                        db.run('ROLLBACK');
                                        return reject(err);
                                    }

                                    completed++;
                                    if (completed === items.length && !failed) {
                                        db.run('COMMIT');
                                        resolve(saleId);
                                    }
                                }
                            );
                        });
                    }
                );
            });
        });
    }

    static async getAll(filters = {}) {
        return new Promise((resolve, reject) => {
            let query = `
                SELECT s.*, 
                       c.name as client_name,
                       u.username as seller_name,
                       comp.name as company_name
                FROM sales s
                JOIN clients c ON s.client_id = c.id
                JOIN users u ON s.created_by = u.id
                JOIN companies comp ON s.company_id = comp.id
                WHERE 1=1
            `;
            const params = [];

            if (filters.company_id) {
                query += ' AND s.company_id = ?';
                params.push(filters.company_id);
            }

            if (filters.start_date) {
                query += ' AND s.sale_date >= ?';
                params.push(filters.start_date);
            }

            if (filters.end_date) {
                query += ' AND s.sale_date <= ?';
                params.push(filters.end_date);
            }

            query += ' ORDER BY s.sale_date DESC';

            db.all(query, params, (err, rows) => {
                if (err) reject(err);
                resolve(rows);
            });
        });
    }

    static async getById(id) {
        return new Promise((resolve, reject) => {
            db.get(
                `SELECT s.*, 
                        c.name as client_name,
                        u.username as seller_name,
                        comp.name as company_name
                 FROM sales s
                 JOIN clients c ON s.client_id = c.id
                 JOIN users u ON s.created_by = u.id
                 JOIN companies comp ON s.company_id = comp.id
                 WHERE s.id = ?`,
                [id],
                (err, sale) => {
                    if (err) return reject(err);
                    
                    if (!sale) return resolve(null);
    
                    // Converter valores numéricos
                    sale.total_amount = Number(sale.total_amount);
    
                    // Get sale items
                    db.all(
                        `SELECT si.*, p.name as product_name, p.sku
                         FROM sale_items si
                         JOIN products p ON si.product_id = p.id
                         WHERE si.sale_id = ?`,
                        [id],
                        (err, items) => {
                            if (err) return reject(err);
                            
                            // Converter valores numéricos dos itens
                            sale.items = items.map(item => ({
                                ...item,
                                quantity: Number(item.quantity),
                                unit_price: Number(item.unit_price),
                                total_price: Number(item.total_price)
                            }));
                            
                            resolve(sale);
                        }
                    );
                }
            );
        });
    }

    static async delete(id) {
        return new Promise((resolve, reject) => {
            db.serialize(() => {
                db.run('BEGIN TRANSACTION');

                // First get the sale items to restore product quantities
                db.all(
                    `SELECT product_id, quantity FROM sale_items WHERE sale_id = ?`,
                    [id],
                    (err, items) => {
                        if (err) {
                            db.run('ROLLBACK');
                            return reject(err);
                        }

                        // Restore product quantities
                        items.forEach(item => {
                            db.run(
                                `UPDATE products 
                                 SET quantity = quantity + ? 
                                 WHERE id = ?`,
                                [item.quantity, item.product_id]
                            );
                        });

                        // Delete the sale (cascade will handle sale_items)
                        db.run(
                            'DELETE FROM sales WHERE id = ?',
                            [id],
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
}

module.exports = Sale;
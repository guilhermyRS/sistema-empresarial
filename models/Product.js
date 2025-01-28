const db = require('../config/database');

class Product {
    static async create(productData, userId) {
        const {
            name, description, sku, cost_price, selling_price,
            quantity, min_quantity, unit_type, units_per_package,
            category, company_id
        } = productData;

        return new Promise((resolve, reject) => {
            db.run(
                `INSERT INTO products (
                    name, description, sku, cost_price, selling_price,
                    quantity, min_quantity, unit_type, units_per_package,
                    category, company_id, created_by
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    name, description, sku, cost_price, selling_price,
                    quantity, min_quantity, unit_type, units_per_package,
                    category, company_id, userId
                ],
                function (err) {
                    if (err) {
                        if (err.message.includes('UNIQUE')) {
                            reject(new Error('SKU já cadastrado'));
                        } else {
                            reject(err);
                        }
                    }
                    resolve(this.lastID);
                }
            );
        });
    }

    static async update(id, productData) {
        const {
            name, description, sku, cost_price, selling_price,
            quantity, min_quantity, unit_type, units_per_package,
            category, company_id
        } = productData;
    
        return new Promise((resolve, reject) => {
            const query = `
                UPDATE products SET 
                    name = ?, 
                    description = ?, 
                    sku = ?, 
                    cost_price = ?, 
                    selling_price = ?,
                    quantity = ?, 
                    min_quantity = ?, 
                    unit_type = ?, 
                    units_per_package = ?,
                    category = ?,
                    company_id = ?
                WHERE id = ?
            `;
    
            db.run(
                query,
                [
                    name, 
                    description, 
                    sku, 
                    cost_price, 
                    selling_price,
                    quantity, 
                    min_quantity, 
                    unit_type, 
                    units_per_package,
                    category,
                    company_id, // Adicionando company_id na atualização
                    id
                ],
                (err) => {
                    if (err) {
                        if (err.message.includes('UNIQUE')) {
                            reject(new Error('SKU já cadastrado'));
                        } else {
                            reject(err);
                        }
                    }
                    resolve();
                }
            );
        });
    }
    static async delete(id) {
        return new Promise((resolve, reject) => {
            db.run('DELETE FROM products WHERE id = ?', [id], (err) => {
                if (err) reject(err);
                resolve();
            });
        });
    }

    static async getAll(filters = {}) {
        let query = `
            SELECT p.*, c.name as company_name, u.username as created_by_username
            FROM products p
            JOIN companies c ON p.company_id = c.id
            JOIN users u ON p.created_by = u.id
            WHERE 1=1
        `;
        const params = [];

        if (filters.company_id) {
            query += ' AND p.company_id = ?';
            params.push(filters.company_id);
        }

        if (filters.category) {
            query += ' AND p.category = ?';
            params.push(filters.category);
        }

        query += ' ORDER BY p.name';

        return new Promise((resolve, reject) => {
            db.all(query, params, (err, rows) => {
                if (err) reject(err);
                resolve(rows);
            });
        });
    }

    static async getById(id) {
        return new Promise((resolve, reject) => {
            db.get(
                `SELECT p.*, c.name as company_name, u.username as created_by_username
                FROM products p
                JOIN companies c ON p.company_id = c.id
                JOIN users u ON p.created_by = u.id
                WHERE p.id = ?`,
                [id],
                (err, row) => {
                    if (err) reject(err);
                    resolve(row);
                }
            );
        });
    }

    static async getDashboardStats(companyId = null) {
        return new Promise((resolve, reject) => {
            let whereClause = companyId ? 'WHERE company_id = ?' : '';
            const params = companyId ? [companyId] : [];

            const query = `
                SELECT 
                    COUNT(*) as total_products,
                    SUM(quantity) as total_inventory,
                    SUM(quantity * cost_price) as total_inventory_cost,
                    SUM(quantity * selling_price) as potential_revenue,
                    SUM(quantity * (selling_price - cost_price)) as potential_profit,
                    AVG(selling_price - cost_price) as avg_profit_per_unit,
                    COUNT(CASE WHEN quantity <= min_quantity THEN 1 END) as low_stock_count,
                    SUM(CASE WHEN quantity = 0 THEN 1 ELSE 0 END) as out_of_stock_count
                FROM products
                ${whereClause}
            `;

            db.get(query, params, (err, stats) => {
                if (err) reject(err);
                resolve(stats);
            });
        });
    }

    static async getTopProducts(companyId = null, limit = 5) {
        return new Promise((resolve, reject) => {
            let whereClause = companyId ? 'WHERE company_id = ?' : '';
            const params = companyId ? [companyId, limit] : [limit];

            const query = `
                SELECT 
                    name,
                    quantity,
                    selling_price,
                    (selling_price - cost_price) as profit_margin,
                    ((selling_price - cost_price) / cost_price * 100) as margin_percentage
                FROM products
                ${whereClause}
                ORDER BY (selling_price - cost_price) * quantity DESC
                LIMIT ?
            `;

            db.all(query, params, (err, rows) => {
                if (err) reject(err);
                resolve(rows);
            });
        });
    }

    static async getCategoryStats(companyId = null) {
        return new Promise((resolve, reject) => {
            let whereClause = companyId ? 'WHERE company_id = ?' : '';
            const params = companyId ? [companyId] : [];

            const query = `
                SELECT 
                    category,
                    COUNT(*) as product_count,
                    SUM(quantity) as total_quantity,
                    SUM(quantity * cost_price) as total_cost,
                    SUM(quantity * selling_price) as total_potential_revenue
                FROM products
                ${whereClause}
                GROUP BY category
                ORDER BY total_potential_revenue DESC
            `;

            db.all(query, params, (err, rows) => {
                if (err) reject(err);
                resolve(rows);
            });
        });
    }
}

module.exports = Product;
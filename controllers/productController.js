const Product = require('../models/Product');
const Company = require('../models/Company');

class ProductController {
    static async list(req, res) {
        try {
            const filters = {};

            // Se for admin, filtrar apenas produtos da empresa atual
            if (req.session.user.role === 'admin' && req.session.user.companyId) {
                filters.company_id = req.session.user.companyId;
            }

            const products = await Product.getAll(filters);
            res.render('products/list', {
                products,
                userRole: req.session.user.role
            });
        } catch (error) {
            console.error('Error listing products:', error);
            res.status(500).render('error', { message: 'Error fetching products' });
        }
    }

    static async create(req, res) {
        try {
            if (req.method === 'GET') {
                const companies = req.session.user.role === 'master'
                    ? await Company.getAll()
                    : [await Company.getUserCompany(req.session.user.id)];

                return res.render('products/create', {
                    companies,
                    error: null,
                    userRole: req.session.user.role
                });
            }

            const productData = {
                ...req.body,
                company_id: req.session.user.role === 'master'
                    ? req.body.company_id
                    : req.session.user.companyId
            };

            await Product.create(productData, req.session.user.id);
            res.redirect('/products');
        } catch (error) {
            console.error('Error creating product:', error);
            const companies = req.session.user.role === 'master'
                ? await Company.getAll()
                : [await Company.getUserCompany(req.session.user.id)];

            res.status(500).render('products/create', {
                companies,
                error: error.message,
                userRole: req.session.user.role
            });
        }
    }

    static async update(req, res) {
        try {
            const productId = req.params.id;
    
            if (req.method === 'GET') {
                const product = await Product.getById(productId);
                
                // Verificar permissão
                if (req.session.user.role === 'admin' && 
                    product.company_id !== req.session.user.companyId) {
                    return res.status(403).render('error', { 
                        message: 'Acesso negado' 
                    });
                }
    
                const companies = req.session.user.role === 'master' 
                    ? await Company.getAll()
                    : [await Company.getUserCompany(req.session.user.id)];
    
                return res.render('products/edit', { 
                    product,
                    companies,
                    error: null,
                    userRole: req.session.user.role
                });
            }
    
            // Verificar se é POST/PUT
            if (req.method === 'POST' || req.method === 'PUT') {
                const product = await Product.getById(productId);
                
                // Verificar permissão
                if (req.session.user.role === 'admin' && 
                    product.company_id !== req.session.user.companyId) {
                    return res.status(403).render('error', { 
                        message: 'Acesso negado' 
                    });
                }
    
                // Preparar dados para atualização
                const updateData = {
                    ...req.body,
                    // Se for master, usa a company_id do form, senão mantém a atual
                    company_id: req.session.user.role === 'master' 
                        ? req.body.company_id 
                        : product.company_id
                };
    
                await Product.update(productId, updateData);
                return res.redirect('/products');
            }
        } catch (error) {
            console.error('Error updating product:', error);
            const companies = req.session.user.role === 'master' 
                ? await Company.getAll()
                : [await Company.getUserCompany(req.session.user.id)];
    
            res.status(500).render('products/edit', { 
                product: await Product.getById(req.params.id),
                companies,
                error: error.message,
                userRole: req.session.user.role
            });
        }
    }

    static async delete(req, res) {
        try {
            // Verificar se o usuário é master
            if (req.session.user.role !== 'master') {
                return res.status(403).render('error', {
                    message: 'Apenas usuários master podem deletar produtos'
                });
            }

            await Product.delete(req.params.id);
            res.redirect('/products');
        } catch (error) {
            console.error('Error deleting product:', error);
            res.status(500).render('error', { message: 'Error deleting product' });
        }
    }

    static async dashboard(req, res) {
        try {
            const companyId = req.session.user.role === 'admin' 
                ? req.session.user.companyId 
                : null;
    
            const [stats, topProducts, categoryStats] = await Promise.all([
                Product.getDashboardStats(companyId),
                Product.getTopProducts(companyId),
                Product.getCategoryStats(companyId)
            ]);
    
            // Adicionar cálculos adicionais se necessário
            stats.potential_profit = parseFloat(stats.potential_revenue) - parseFloat(stats.total_inventory_cost);
            stats.avg_profit_per_unit = stats.total_products > 0 
                ? stats.potential_profit / stats.total_products 
                : 0;
    
            res.render('dashboard', {
                stats,
                topProducts,
                categoryStats,
                userRole: req.session.user.role
            });
        } catch (error) {
            console.error('Error loading dashboard:', error);
            res.status(500).render('error', { message: 'Error loading dashboard' });
        }
    }
}

module.exports = ProductController;
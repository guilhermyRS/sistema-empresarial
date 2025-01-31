const Sale = require('../models/Sale');
const Client = require('../models/Client');
const Product = require('../models/Product');
const Company = require('../models/Company'); // Adicione esta linha

class SaleController {
    static async list(req, res) {
        try {
            const filters = {};
            if (req.session.user.role === 'admin') {
                filters.company_id = req.session.user.companyId;
            }

            const sales = await Sale.getAll(filters);
            res.render('sales/list', {
                sales,
                userRole: req.session.user.role
            });
        } catch (error) {
            console.error('Error listing sales:', error);
            res.status(500).render('error', { message: 'Error fetching sales' });
        }
    }

    static async create(req, res) {
        try {
            if (req.method === 'GET') {
                // Definir o company_id baseado no papel do usuário
                const companyId = req.session.user.role === 'admin' 
                    ? req.session.user.companyId 
                    : null;

                // Buscar clientes e produtos da empresa correta
                let clients, products;
                
                if (req.session.user.role === 'admin') {
                    // Para admin, buscar apenas dados da sua empresa
                    clients = await Client.getAll({ company_id: companyId });
                    products = await Product.getAll({ company_id: companyId });
                } else if (req.session.user.role === 'master') {
                    // Para master, buscar todos os dados
                    const [allClients, allProducts, companies] = await Promise.all([
                        Client.getAll(),
                        Product.getAll(),
                        Company.getAll()
                    ]);
                    clients = allClients;
                    products = allProducts;
                    res.locals.companies = companies; // Disponibilizar empresas para o template
                }

                return res.render('sales/create', {
                    clients: clients || [],
                    products: products || [],
                    error: null,
                    userRole: req.session.user.role,
                    companies: res.locals.companies || []
                });
            }

            // Handle POST
            const { client_id, items, notes, company_id } = req.body;
            
            // Determinar company_id correto
            const saleCompanyId = req.session.user.role === 'admin' 
                ? req.session.user.companyId 
                : (company_id || null);

            if (!saleCompanyId) {
                throw new Error('Company ID is required');
            }

            const saleItems = Array.isArray(items) ? items : [items];
            
            // Calculate total amount
            let total_amount = 0;
            for (const item of saleItems) {
                total_amount += parseFloat(item.quantity) * parseFloat(item.unit_price);
            }

            const saleData = {
                client_id,
                company_id: saleCompanyId,
                created_by: req.session.user.id,
                total_amount,
                notes
            };

            await Sale.create(saleData, saleItems);
            res.redirect('/sales');
        } catch (error) {
            console.error('Error creating sale:', error);
            
            // Recuperar dados novamente para re-renderizar o formulário
            const companyId = req.session.user.role === 'admin' 
                ? req.session.user.companyId 
                : null;

            let clients, products, companies;
            
            if (req.session.user.role === 'admin') {
                [clients, products] = await Promise.all([
                    Client.getAll({ company_id: companyId }),
                    Product.getAll({ company_id: companyId })
                ]);
            } else if (req.session.user.role === 'master') {
                [clients, products, companies] = await Promise.all([
                    Client.getAll(),
                    Product.getAll(),
                    Company.getAll()
                ]);
            }

            res.status(500).render('sales/create', {
                clients: clients || [],
                products: products || [],
                error: error.message,
                userRole: req.session.user.role,
                companies: companies || []
            });
        }
    }

    static async create(req, res) {
        try {
            if (req.method === 'GET') {
                // Inicializar variáveis
                let clients = [];
                let products = [];
                let companies = [];
                
                // Determinar o company_id baseado no papel do usuário
                const companyId = req.session.user.role === 'admin' 
                    ? req.session.user.companyId 
                    : null;

                // Buscar dados baseado no papel do usuário
                if (req.session.user.role === 'admin') {
                    // Para admin, buscar apenas dados da sua empresa
                    [clients, products] = await Promise.all([
                        Client.getAll({ company_id: companyId }),
                        Product.getAll({ company_id: companyId })
                    ]);
                } else if (req.session.user.role === 'master') {
                    // Para master, buscar todos os dados e incluir empresas
                    [clients, products, companies] = await Promise.all([
                        Client.getAll(),
                        Product.getAll(),
                        Company.getAll()
                    ]);
                }

                return res.render('sales/create', {
                    clients,
                    products,
                    companies, // Sempre passar companies, mesmo que vazio
                    error: null,
                    userRole: req.session.user.role
                });
            }

            // Handle POST
            const { client_id, items, notes, company_id } = req.body;
            
            // Determinar company_id correto
            const saleCompanyId = req.session.user.role === 'admin' 
                ? req.session.user.companyId 
                : (company_id || null);

            if (!saleCompanyId) {
                throw new Error('É necessário selecionar uma empresa');
            }

            // Validar se há itens
            if (!items || (Array.isArray(items) && items.length === 0)) {
                throw new Error('É necessário adicionar pelo menos um produto');
            }

            const saleItems = Array.isArray(items) ? items : [items];
            
            // Calcular valor total
            let total_amount = 0;
            for (const item of saleItems) {
                const quantity = parseFloat(item.quantity) || 0;
                const unit_price = parseFloat(item.unit_price) || 0;
                total_amount += quantity * unit_price;
            }

            const saleData = {
                client_id,
                company_id: saleCompanyId,
                created_by: req.session.user.id,
                total_amount,
                notes
            };

            await Sale.create(saleData, saleItems);
            res.redirect('/sales');
        } catch (error) {
            console.error('Error creating sale:', error);
            
            // Em caso de erro, recuperar todos os dados novamente
            let clients = [];
            let products = [];
            let companies = [];
            
            try {
                if (req.session.user.role === 'admin') {
                    [clients, products] = await Promise.all([
                        Client.getAll({ company_id: req.session.user.companyId }),
                        Product.getAll({ company_id: req.session.user.companyId })
                    ]);
                } else if (req.session.user.role === 'master') {
                    [clients, products, companies] = await Promise.all([
                        Client.getAll(),
                        Product.getAll(),
                        Company.getAll()
                    ]);
                }
            } catch (fetchError) {
                console.error('Error fetching data:', fetchError);
            }

            res.status(500).render('sales/create', {
                clients,
                products,
                companies, // Sempre passar companies, mesmo que vazio
                error: error.message || 'Erro ao criar venda',
                userRole: req.session.user.role
            });
        }
    }
    static async detail(req, res) {
        try {
            const sale = await Sale.getById(req.params.id);
            
            if (!sale) {
                return res.status(404).render('error', { 
                    message: 'Venda não encontrada' 
                });
            }

            // Verificar permissão
            if (req.session.user.role === 'admin' && 
                sale.company_id !== req.session.user.companyId) {
                return res.status(403).render('error', { 
                    message: 'Acesso negado' 
                });
            }

            res.render('sales/detail', {
                sale,
                userRole: req.session.user.role
            });
        } catch (error) {
            console.error('Error getting sale:', error);
            res.status(500).render('error', { 
                message: 'Error fetching sale details' 
            });
        }
    }

    static async delete(req, res) {
        try {
            await Sale.delete(req.params.id);
            res.redirect('/sales');
        } catch (error) {
            console.error('Error deleting sale:', error);
            res.status(500).render('error', { 
                message: 'Error deleting sale' 
            });
        }
    }
}

module.exports = SaleController;
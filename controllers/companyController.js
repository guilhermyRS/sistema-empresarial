const Company = require('../models/Company');
const User = require('../models/User');

class CompanyController {
    static async list(req, res) {
        try {
            const companies = await Company.getAll();
            res.render('companies/list', { 
                companies,
                userRole: req.session.user.role
            });
        } catch (error) {
            res.status(500).render('error', { message: 'Erro ao listar empresas' });
        }
    }

    static async create(req, res) {
        try {
            if (req.method === 'GET') {
                return res.render('companies/create');
            }

            const companyId = await Company.create(req.body, req.session.user.id);
            res.redirect('/companies');
        } catch (error) {
            res.status(500).render('companies/create', { error: error.message });
        }
    }

    static async manage(req, res) {
        try {
            const companyId = req.params.id;
            
            // Buscar dados da empresa
            const company = await Company.getById(companyId);
            if (!company) {
                return res.status(404).render('error', { 
                    message: 'Empresa não encontrada' 
                });
            }

            // Buscar usuários da empresa
            const companyUsers = await Company.getCompanyUsers(companyId);
            
            // Buscar admins disponíveis
            const availableUsers = await User.getAvailableAdmins(companyId);

            res.render('companies/manage', {
                company,
                companyUsers,
                availableUsers,
                error: null
            });
        } catch (error) {
            console.error('Erro ao gerenciar empresa:', error);
            res.status(500).render('error', { 
                message: 'Erro ao gerenciar empresa: ' + error.message 
            });
        }
    }
    static async addUser(req, res) {
        try {
            const { userId, companyId } = req.body;
            
            if (!userId || !companyId) {
                throw new Error('Usuário e empresa são obrigatórios');
            }
    
            // Adicionar usuário à empresa
            await Company.addUserToCompany(userId, companyId);
    
            // Definir esta empresa como a empresa atual do usuário
            await User.update(userId, { last_company_id: companyId });
    
            res.redirect(`/companies/manage/${companyId}`);
        } catch (error) {
            console.error('Erro ao adicionar usuário:', error);
            const company = await Company.getById(req.body.companyId);
            const companyUsers = await Company.getCompanyUsers(req.body.companyId);
            const availableUsers = await User.getAvailableAdmins(req.body.companyId);
    
            res.render('companies/manage', {
                company,
                companyUsers,
                availableUsers,
                error: 'Erro ao adicionar usuário: ' + error.message
            });
        }
    }


    static async removeUser(req, res) {
        try {
            const { userId, companyId } = req.params;
            
            if (!userId || !companyId) {
                throw new Error('Usuário e empresa são obrigatórios');
            }

            await Company.removeUserFromCompany(userId, companyId);
            res.redirect(`/companies/manage/${companyId}`);
        } catch (error) {
            console.error('Erro ao remover usuário:', error);
            res.status(500).render('error', { 
                message: 'Erro ao remover usuário: ' + error.message 
            });
        }
    }

    static async selectCompany(req, res) {
        try {
            if (req.method === 'GET') {
                const companies = await Company.getUserCompanies(req.session.user.id);
                return res.render('companies/select', { companies });
            }
    
            const { companyId } = req.body;
            if (!companyId) {
                throw new Error('ID da empresa é obrigatório');
            }
    
            // Atualizar a empresa atual do usuário
            await User.update(req.session.user.id, { last_company_id: companyId });
            
            // Atualizar a sessão
            req.session.user.last_company_id = companyId;
            
            // Buscar dados atualizados da empresa
            const company = await Company.getById(companyId);
            if (!company) {
                throw new Error('Empresa não encontrada');
            }
    
            res.redirect('/dashboard');
        } catch (error) {
            console.error('Erro ao selecionar empresa:', error);
            const companies = await Company.getUserCompanies(req.session.user.id);
            res.render('companies/select', { 
                companies,
                error: 'Erro ao selecionar empresa: ' + error.message 
            });
        }
    }
}

module.exports = CompanyController;
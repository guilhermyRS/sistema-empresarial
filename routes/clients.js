const express = require('express');
const router = express.Router();
const Client = require('../models/Client');
const Company = require('../models/Company'); // Certifique-se de importar o modelo Company
const { isAuthenticated } = require('../middleware/auth');

// Middleware para verificar se o usuário está autenticado
router.use(isAuthenticated);

// Listar clientes
router.get('/', async (req, res) => {
    try {
        let clients;
        if (req.session.user.role === 'master') {
            clients = await Client.getAll();
        } else {
            const companyId = req.session.selectedCompany?.id || res.locals.currentCompany?.id;
            if (!companyId) {
                return res.redirect('/companies/select');
            }
            clients = await Client.getByCompanyId(companyId);
        }
        res.render('clients/index', { clients });
    } catch (error) {
        res.status(500).render('error', { message: 'Erro ao carregar clientes' });
    }
});

// Formulário para novo cliente
router.get('/new', async (req, res) => {
    try {
        const companies = req.session.user.role === 'master' ? await Company.getAll() : await Company.getUserCompanies(req.session.user.id);
        res.render('clients/new', { client: {}, companies });
    } catch (error) {
        res.status(500).render('error', { message: 'Erro ao carregar formulário' });
    }
});

// Criar cliente
router.post('/', async (req, res) => {
    try {
        const companyId = req.body.company_id || req.session.selectedCompany?.id || res.locals.currentCompany?.id;
        if (!companyId) {
            return res.status(400).render('error', { message: 'Empresa não selecionada' });
        }
        await Client.create({
            ...req.body,
            company_id: companyId,
            created_by: req.session.user.id
        });
        res.redirect('/clients');
    } catch (error) {
        res.status(500).render('error', { message: 'Erro ao criar cliente' });
    }
});

// Formulário para editar cliente
router.get('/:id/edit', async (req, res) => {
    try {
        const client = await Client.getById(req.params.id);
        if (!client) {
            return res.status(404).render('error', { message: 'Cliente não encontrado' });
        }
        const companies = req.session.user.role === 'master' ? await Company.getAll() : await Company.getUserCompanies(req.session.user.id);
        res.render('clients/edit', { client, companies });
    } catch (error) {
        res.status(500).render('error', { message: 'Erro ao carregar cliente' });
    }
});

// Atualizar cliente
router.put('/:id', async (req, res) => {
    try {
        await Client.update(req.params.id, req.body);
        res.redirect('/clients');
    } catch (error) {
        res.status(500).render('error', { message: 'Erro ao atualizar cliente' });
    }
});

// Deletar cliente
router.delete('/:id', async (req, res) => {
    try {
        await Client.delete(req.params.id);
        res.redirect('/clients');
    } catch (error) {
        res.status(500).render('error', { message: 'Erro ao excluir cliente' });
    }
});

// Ver detalhes do cliente
router.get('/:id', async (req, res) => {
    try {
        const client = await Client.getById(req.params.id);
        if (!client) {
            return res.status(404).render('error', { message: 'Cliente não encontrado' });
        }
        res.render('clients/show', { client });
    } catch (error) {
        res.status(500).render('error', { message: 'Erro ao carregar cliente' });
    }
});

module.exports = router;
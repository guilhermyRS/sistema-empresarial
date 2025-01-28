const express = require('express');
const router = express.Router();
const ProductController = require('../controllers/productController');
const { isAuthenticated, hasCompanyAccess } = require('../middleware/auth');

// Aplicar middleware de autenticação em todas as rotas
router.use(isAuthenticated);
router.use(hasCompanyAccess);

// Adicionar esta rota
router.get('/dashboard', ProductController.dashboard);

// Rotas de produtos
router.get('/', ProductController.list);
router.get('/create', ProductController.create);
router.post('/create', ProductController.create);
router.get('/edit/:id', ProductController.update);
router.put('/:id', ProductController.update);
router.delete('/:id', ProductController.delete);

module.exports = router;
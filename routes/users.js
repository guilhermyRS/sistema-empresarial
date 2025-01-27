const express = require('express');
const router = express.Router();
const UserController = require('../controllers/userController');
const { isAuthenticated, isMaster } = require('../middleware/auth');

// Aplicar middleware de autenticação em todas as rotas
router.use(isAuthenticated);

// Rotas de usuários
router.get('/', UserController.list);

// Rotas que requerem privilégios de master
router.get('/create', isMaster, UserController.create);
router.post('/create', isMaster, UserController.create);
router.get('/edit/:id', isMaster, UserController.update);
router.put('/:id', isMaster, UserController.update);
router.delete('/:id', isMaster, UserController.delete);

module.exports = router;
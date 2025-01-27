const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/authController');

// Rotas de autenticação
router.post('/login', AuthController.login);
router.get('/logout', AuthController.logout);

module.exports = router;
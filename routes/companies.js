const express = require('express');
const router = express.Router();
const CompanyController = require('../controllers/companyController');
const { isAuthenticated, isMaster } = require('../middleware/auth');

router.use(isAuthenticated);

// Rotas básicas
router.get('/', CompanyController.list);

// Rotas que requerem privilégios de master
router.get('/create', isMaster, CompanyController.create);
router.post('/create', isMaster, CompanyController.create);
router.get('/manage/:id', isMaster, CompanyController.manage);
router.post('/adduser', isMaster, CompanyController.addUser);
router.delete('/removeuser/:companyId/:userId', isMaster, CompanyController.removeUser);

// Seleção de empresa
router.post('/select', CompanyController.selectCompany);

module.exports = router;
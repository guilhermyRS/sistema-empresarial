const express = require('express');
const router = express.Router();
const CompanyController = require('../controllers/companyController');
const { isAuthenticated, isMaster } = require('../middleware/auth');

// Middleware to check if user is authenticated
router.use(isAuthenticated);

// Basic routes
router.get('/', CompanyController.list);

// Routes that require master privileges
router.get('/create', isMaster, CompanyController.create);
router.post('/create', isMaster, CompanyController.create);
router.get('/manage/:id', isMaster, CompanyController.manage);
router.post('/adduser', isMaster, CompanyController.addUser);
router.delete('/removeuser/:companyId/:userId', isMaster, CompanyController.removeUser);

// Select company
router.get('/select', CompanyController.selectCompany);
router.post('/select', CompanyController.selectCompany);

module.exports = router;
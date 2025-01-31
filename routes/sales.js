const express = require('express');
const router = express.Router();
const SaleController = require('../controllers/saleController');
const { isAuthenticated, hasCompanyAccess } = require('../middleware/auth');

router.use(isAuthenticated);
router.use(hasCompanyAccess);

router.get('/', SaleController.list);
router.get('/create', SaleController.create);
router.post('/create', SaleController.create);
router.get('/:id', SaleController.detail);
router.delete('/:id', SaleController.delete);

module.exports = router;
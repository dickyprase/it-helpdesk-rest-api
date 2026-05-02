const { Router } = require('express');
const CategoryController = require('../controllers/categoryController');
const { authenticate } = require('../middleware/authMiddleware');

const router = Router();

router.use(authenticate);
router.get('/', CategoryController.getAll);

module.exports = router;

const { Router } = require('express');
const UserController = require('../controllers/userController');
const { authenticate, requireRole } = require('../middleware/authMiddleware');
const { createUserRules, updateUserRules } = require('../validators/userValidator');

const router = Router();

router.use(authenticate);
router.use(requireRole('MANAGER'));

router.get('/', UserController.getAll);
router.get('/:id', UserController.getById);
router.post('/', createUserRules, UserController.create);
router.put('/:id', updateUserRules, UserController.update);
router.patch('/:id/toggle-active', UserController.toggleActive);

module.exports = router;

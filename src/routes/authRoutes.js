const { Router } = require('express');
const AuthController = require('../controllers/authController');
const { authenticate } = require('../middleware/authMiddleware');
const { loginRules, registerRules } = require('../validators/authValidator');

const router = Router();

router.post('/login', loginRules, AuthController.login);
router.post('/register', registerRules, AuthController.register);
router.post('/logout', AuthController.logout);
router.get('/me', authenticate, AuthController.me);

module.exports = router;

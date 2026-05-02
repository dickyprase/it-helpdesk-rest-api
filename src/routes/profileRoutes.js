const { Router } = require('express');
const ProfileController = require('../controllers/profileController');
const { authenticate } = require('../middleware/authMiddleware');
const { updateProfileRules, changePasswordRules } = require('../validators/profileValidator');

const router = Router();

router.use(authenticate);
router.get('/', ProfileController.getProfile);
router.put('/', updateProfileRules, ProfileController.updateProfile);
router.put('/password', changePasswordRules, ProfileController.changePassword);

module.exports = router;

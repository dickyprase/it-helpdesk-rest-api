const { Router } = require('express');
const LeaderboardController = require('../controllers/leaderboardController');
const { authenticate, requireRole } = require('../middleware/authMiddleware');

const router = Router();

router.use(authenticate);
router.use(requireRole('STAFF', 'MANAGER'));

router.get('/', LeaderboardController.getLeaderboard);
router.get('/periods', LeaderboardController.getPeriods);
router.get('/:staffId', LeaderboardController.getStaffStats);

module.exports = router;

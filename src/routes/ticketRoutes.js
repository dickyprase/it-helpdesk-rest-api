const { Router } = require('express');
const TicketController = require('../controllers/ticketController');
const { authenticate, requireRole } = require('../middleware/authMiddleware');
const { createTicketRules, unclaimRules, assignRules, statusRules, pendingRules, resolveRules, difficultyRules } = require('../validators/ticketValidator');

const router = Router();

router.use(authenticate);

router.get('/', TicketController.getAll);
router.get('/staff-list', TicketController.getStaffList);
router.get('/:id', TicketController.getById);
router.post('/', requireRole('USER'), createTicketRules, TicketController.create);
router.post('/:id/claim', requireRole('STAFF', 'MANAGER'), TicketController.claim);
router.post('/:id/unclaim', requireRole('STAFF'), unclaimRules, TicketController.unclaim);
router.post('/:id/assign', requireRole('MANAGER'), assignRules, TicketController.assign);
router.patch('/:id/status', requireRole('MANAGER'), statusRules, TicketController.updateStatus);
router.patch('/:id/pending', requireRole('STAFF'), pendingRules, TicketController.setPending);
router.patch('/:id/resolve', requireRole('STAFF'), resolveRules, TicketController.resolve);
router.patch('/:id/difficulty', requireRole('MANAGER'), difficultyRules, TicketController.setDifficulty);

module.exports = router;

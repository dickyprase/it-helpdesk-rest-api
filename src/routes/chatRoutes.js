const { Router } = require('express');
const ChatController = require('../controllers/chatController');
const { authenticate } = require('../middleware/authMiddleware');
const { sendMessageRules } = require('../validators/chatValidator');

const router = Router();

router.use(authenticate);
router.get('/:ticketId', ChatController.getMessages);
router.post('/:ticketId', sendMessageRules, ChatController.sendMessage);

module.exports = router;

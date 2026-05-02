const ChatModel = require('../models/chatModel');
const { validationResult } = require('express-validator');

const ChatController = {
  async getMessages(req, res, next) {
    try {
      const messages = await ChatModel.findByTicketId(req.params.ticketId);
      res.json({ error: false, data: messages });
    } catch (err) { next(err); }
  },

  async sendMessage(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ error: true, message: errors.array()[0].msg });
      const msg = await ChatModel.create({
        ticketId: req.params.ticketId,
        senderId: req.user.id,
        message: req.body.message,
      });
      res.status(201).json({ error: false, data: msg });
    } catch (err) { next(err); }
  },
};

module.exports = ChatController;

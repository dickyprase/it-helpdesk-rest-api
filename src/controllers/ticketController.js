const TicketModel = require('../models/ticketModel');
const UserModel = require('../models/userModel');
const { validationResult } = require('express-validator');

const TicketController = {
  async getAll(req, res, next) {
    try {
      const filters = { ...req.query };
      // USER can only see their own tickets
      if (req.user.role === 'USER') {
        filters.user_id = req.user.id;
      }
      const tickets = await TicketModel.findAll(filters);
      res.json({ error: false, data: tickets });
    } catch (err) { next(err); }
  },

  async getById(req, res, next) {
    try {
      const ticket = await TicketModel.findById(req.params.id);
      if (!ticket) return res.status(404).json({ error: true, message: 'Tiket tidak ditemukan' });
      // USER can only see their own tickets
      if (req.user.role === 'USER' && ticket.user_id !== req.user.id) {
        return res.status(403).json({ error: true, message: 'Anda tidak memiliki akses ke tiket ini' });
      }
      res.json({ error: false, data: ticket });
    } catch (err) { next(err); }
  },

  async create(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ error: true, message: errors.array()[0].msg });
      const ticket = await TicketModel.create({ ...req.body, user_id: req.user.id });
      res.status(201).json({ error: false, data: ticket });
    } catch (err) { next(err); }
  },

  async claim(req, res, next) {
    try {
      const ticket = await TicketModel.claim(req.params.id, req.user.id);
      res.json({ error: false, data: ticket });
    } catch (err) { next(err); }
  },

  async unclaim(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ error: true, message: errors.array()[0].msg });
      const ticket = await TicketModel.unclaim(req.params.id, req.user.id);
      res.json({ error: false, data: ticket });
    } catch (err) { next(err); }
  },

  async assign(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ error: true, message: errors.array()[0].msg });
      const ticket = await TicketModel.assign(req.params.id, req.body.staff_id);
      if (!ticket) return res.status(404).json({ error: true, message: 'Tiket tidak ditemukan' });
      res.json({ error: false, data: ticket });
    } catch (err) { next(err); }
  },

  async updateStatus(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ error: true, message: errors.array()[0].msg });
      const ticket = await TicketModel.updateStatus(req.params.id, req.body.status);
      res.json({ error: false, data: ticket });
    } catch (err) { next(err); }
  },

  async setPending(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ error: true, message: errors.array()[0].msg });
      const ticket = await TicketModel.setPending(req.params.id, req.user.id, req.body.pending_reason);
      res.json({ error: false, data: ticket });
    } catch (err) { next(err); }
  },

  async resolve(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ error: true, message: errors.array()[0].msg });
      const ticket = await TicketModel.resolve(req.params.id, req.user.id, req.body.resolution_note);
      res.json({ error: false, data: ticket });
    } catch (err) { next(err); }
  },

  async setDifficulty(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ error: true, message: errors.array()[0].msg });
      const ticket = await TicketModel.setDifficulty(req.params.id, req.body.difficulty_level);
      if (!ticket) return res.status(404).json({ error: true, message: 'Tiket tidak ditemukan' });
      res.json({ error: false, data: ticket });
    } catch (err) { next(err); }
  },

  async getStaffList(req, res, next) {
    try {
      const staff = await UserModel.findStaffList();
      res.json({ error: false, data: staff });
    } catch (err) { next(err); }
  },
};

module.exports = TicketController;

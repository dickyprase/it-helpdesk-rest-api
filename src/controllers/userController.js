const UserModel = require('../models/userModel');
const { validationResult } = require('express-validator');

const UserController = {
  async getAll(req, res, next) {
    try {
      const users = await UserModel.findAll();
      res.json({ error: false, data: users });
    } catch (err) { next(err); }
  },

  async getById(req, res, next) {
    try {
      const user = await UserModel.findById(req.params.id);
      if (!user) return res.status(404).json({ error: true, message: 'User tidak ditemukan' });
      res.json({ error: false, data: user });
    } catch (err) { next(err); }
  },

  async create(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ error: true, message: errors.array()[0].msg });

      const existing = await UserModel.findByEmail(req.body.email);
      if (existing) return res.status(409).json({ error: true, message: 'Email sudah terdaftar' });

      const user = await UserModel.create(req.body);
      res.status(201).json({ error: false, data: user });
    } catch (err) { next(err); }
  },

  async update(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ error: true, message: errors.array()[0].msg });

      if (req.params.id === req.user.id) {
        return res.status(400).json({ error: true, message: 'Gunakan endpoint /profile untuk mengubah profil sendiri' });
      }

      const user = await UserModel.update(req.params.id, req.body);
      if (!user) return res.status(404).json({ error: true, message: 'User tidak ditemukan' });
      res.json({ error: false, data: user });
    } catch (err) { next(err); }
  },

  async toggleActive(req, res, next) {
    try {
      if (req.params.id === req.user.id) {
        return res.status(400).json({ error: true, message: 'Anda tidak dapat menonaktifkan diri sendiri' });
      }
      const user = await UserModel.toggleActive(req.params.id);
      if (!user) return res.status(404).json({ error: true, message: 'User tidak ditemukan' });
      res.json({ error: false, data: user });
    } catch (err) { next(err); }
  },
};

module.exports = UserController;

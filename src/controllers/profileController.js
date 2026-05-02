const ProfileModel = require('../models/profileModel');
const UserModel = require('../models/userModel');
const { validationResult } = require('express-validator');

const ProfileController = {
  async getProfile(req, res, next) {
    try {
      const profile = await ProfileModel.findById(req.user.id);
      if (!profile) return res.status(404).json({ error: true, message: 'User tidak ditemukan' });
      res.json({ error: false, data: profile });
    } catch (err) { next(err); }
  },

  async updateProfile(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ error: true, message: errors.array()[0].msg });

      const existing = await UserModel.findByEmail(req.body.email);
      if (existing && existing.id !== req.user.id) {
        return res.status(409).json({ error: true, message: 'Email sudah digunakan oleh akun lain' });
      }

      const profile = await ProfileModel.update(req.user.id, req.body);
      if (!profile) return res.status(404).json({ error: true, message: 'User tidak ditemukan' });
      res.json({ error: false, data: profile });
    } catch (err) { next(err); }
  },

  async changePassword(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ error: true, message: errors.array()[0].msg });

      await ProfileModel.changePassword(req.user.id, req.body.current_password, req.body.new_password);
      res.json({ error: false, message: 'Password berhasil diubah' });
    } catch (err) { next(err); }
  },
};

module.exports = ProfileController;

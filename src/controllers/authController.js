const crypto = require('crypto');
const pool = require('../config/database');
const UserModel = require('../models/userModel');
const { validationResult } = require('express-validator');

const SESSION_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

function generateToken() {
  return crypto.randomBytes(32).toString('hex');
}

const AuthController = {
  async login(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ error: true, message: errors.array()[0].msg });
      }

      const { email, password } = req.body;
      const user = await UserModel.findByEmail(email);

      if (!user) {
        return res.status(401).json({ error: true, message: 'Email atau password salah' });
      }
      if (!user.is_active) {
        return res.status(403).json({ error: true, message: 'Akun Anda telah dinonaktifkan' });
      }

      const valid = await UserModel.verifyPassword(password, user.password_hash);
      if (!valid) {
        return res.status(401).json({ error: true, message: 'Email atau password salah' });
      }

      // Create session token
      const token = generateToken();
      const expiresAt = new Date(Date.now() + SESSION_MAX_AGE_MS);

      await pool.query(
        `INSERT INTO "Session" (id, user_id, expires_at) VALUES ($1, $2, $3)`,
        [token, user.id, expiresAt]
      );

      const { password_hash, ...userData } = user;
      res.json({
        error: false,
        data: {
          user: userData,
          token,
          expires_at: expiresAt.toISOString(),
        },
      });
    } catch (err) {
      next(err);
    }
  },

  async register(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ error: true, message: errors.array()[0].msg });
      }

      const { name, email, phone, password } = req.body;

      const existing = await UserModel.findByEmail(email);
      if (existing) {
        return res.status(409).json({ error: true, message: 'Email sudah terdaftar' });
      }

      const user = await UserModel.create({ name, email, phone, password, role: 'USER' });

      // Auto-login: create session token
      const token = generateToken();
      const expiresAt = new Date(Date.now() + SESSION_MAX_AGE_MS);

      await pool.query(
        `INSERT INTO "Session" (id, user_id, expires_at) VALUES ($1, $2, $3)`,
        [token, user.id, expiresAt]
      );

      res.status(201).json({
        error: false,
        data: {
          user,
          token,
          expires_at: expiresAt.toISOString(),
        },
      });
    } catch (err) {
      next(err);
    }
  },

  async logout(req, res, next) {
    try {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.split(' ')[1];
        await pool.query(`DELETE FROM "Session" WHERE id = $1`, [token]);
      }
      res.json({ error: false, message: 'Berhasil logout' });
    } catch (err) {
      next(err);
    }
  },

  async me(req, res) {
    res.json({ error: false, data: req.user });
  },
};

module.exports = AuthController;

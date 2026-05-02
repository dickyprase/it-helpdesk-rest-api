const pool = require('../config/database');
const bcrypt = require('bcrypt');

const SALT_ROUNDS = 12;

const ProfileModel = {
  async findById(userId) {
    const { rows } = await pool.query(
      `SELECT id, name, email, phone, role, is_active, created_at FROM "User" WHERE id = $1`,
      [userId]
    );
    return rows[0] || null;
  },

  async update(userId, { name, email, phone }) {
    const { rows } = await pool.query(
      `UPDATE "User" SET name = $1, email = $2, phone = $3, updated_at = NOW()
       WHERE id = $4
       RETURNING id, name, email, phone, role, created_at`,
      [name, email.toLowerCase(), phone || null, userId]
    );
    return rows[0] || null;
  },

  async changePassword(userId, currentPassword, newPassword) {
    const { rows } = await pool.query(`SELECT password_hash FROM "User" WHERE id = $1`, [userId]);
    if (!rows[0]) throw Object.assign(new Error('User tidak ditemukan'), { statusCode: 404 });

    const valid = await bcrypt.compare(currentPassword, rows[0].password_hash);
    if (!valid) throw Object.assign(new Error('Password saat ini salah'), { statusCode: 400 });

    const hash = await bcrypt.hash(newPassword, SALT_ROUNDS);
    await pool.query(`UPDATE "User" SET password_hash = $1, updated_at = NOW() WHERE id = $2`, [hash, userId]);
    return true;
  },
};

module.exports = ProfileModel;

const pool = require('../config/database');
const bcrypt = require('bcrypt');

const SALT_ROUNDS = 12;

const UserModel = {
  async findAll() {
    const { rows } = await pool.query(`
      SELECT u.id, u.name, u.email, u.phone, u.role, u.is_active, u.created_at,
        (SELECT COUNT(*) FROM "Ticket" WHERE user_id = u.id)::int AS tickets_created,
        (SELECT COUNT(*) FROM "Ticket" WHERE staff_id = u.id)::int AS tickets_handled
      FROM "User" u ORDER BY u.role ASC, u.name ASC
    `);
    return rows;
  },

  async findById(id) {
    const { rows } = await pool.query(
      `SELECT id, name, email, phone, role, is_active, created_at FROM "User" WHERE id = $1`,
      [id]
    );
    return rows[0] || null;
  },

  async findByEmail(email) {
    const { rows } = await pool.query(
      `SELECT * FROM "User" WHERE email = $1`,
      [email.toLowerCase()]
    );
    return rows[0] || null;
  },

  async create({ name, email, phone, password, role }) {
    const hash = await bcrypt.hash(password, SALT_ROUNDS);
    const { rows } = await pool.query(
      `INSERT INTO "User" (id, name, email, phone, password_hash, role, is_active, created_at, updated_at)
       VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, true, NOW(), NOW())
       RETURNING id, name, email, phone, role, is_active, created_at`,
      [name, email.toLowerCase(), phone || null, hash, role || 'USER']
    );
    return rows[0];
  },

  async update(id, { name, email, phone, role }) {
    const { rows } = await pool.query(
      `UPDATE "User" SET name = $1, email = $2, phone = $3, role = $4, updated_at = NOW()
       WHERE id = $5
       RETURNING id, name, email, phone, role, is_active, created_at`,
      [name, email.toLowerCase(), phone || null, role, id]
    );
    return rows[0] || null;
  },

  async toggleActive(id) {
    const { rows } = await pool.query(
      `UPDATE "User" SET is_active = NOT is_active, updated_at = NOW()
       WHERE id = $1
       RETURNING id, name, email, is_active`,
      [id]
    );
    if (rows[0] && !rows[0].is_active) {
      await pool.query(`DELETE FROM "Session" WHERE user_id = $1`, [id]);
    }
    return rows[0] || null;
  },

  async verifyPassword(plainPassword, hash) {
    return bcrypt.compare(plainPassword, hash);
  },

  async findStaffList() {
    const { rows } = await pool.query(
      `SELECT id, name, email, role FROM "User" WHERE role IN ('STAFF', 'MANAGER') AND is_active = true ORDER BY name ASC`
    );
    return rows;
  },
};

module.exports = UserModel;

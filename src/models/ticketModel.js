const pool = require('../config/database');

function generateCode() {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `TKT-${ts}-${rand}`;
}

// Flow: OPEN → IN_PROGRESS → PENDING (optional) → IN_PROGRESS → RESOLVED → CLOSED
const MANAGER_TRANSITIONS = {
  OPEN: ['IN_PROGRESS', 'CLOSED'],
  IN_PROGRESS: ['PENDING', 'RESOLVED', 'OPEN'],
  PENDING: ['IN_PROGRESS'],
  RESOLVED: ['CLOSED', 'IN_PROGRESS'],
  CLOSED: [],
};

const TicketModel = {
  async findAll(filters = {}) {
    let query = `
      SELECT t.*, 
        row_to_json(c) AS category,
        json_build_object('id', u.id, 'name', u.name, 'email', u.email, 'role', u.role) AS "user",
        CASE WHEN s.id IS NOT NULL THEN json_build_object('id', s.id, 'name', s.name, 'email', s.email, 'role', s.role) ELSE NULL END AS staff
      FROM "Ticket" t
      JOIN "Category" c ON c.id = t.category_id
      JOIN "User" u ON u.id = t.user_id
      LEFT JOIN "User" s ON s.id = t.staff_id
      WHERE 1=1
    `;
    const params = [];
    let idx = 1;

    if (filters.status && filters.status !== 'ALL') {
      query += ` AND t.status = $${idx++}`;
      params.push(filters.status);
    }
    if (filters.category_id && filters.category_id !== 'ALL') {
      query += ` AND t.category_id = $${idx++}`;
      params.push(filters.category_id);
    }
    if (filters.user_id) {
      query += ` AND t.user_id = $${idx++}`;
      params.push(filters.user_id);
    }
    if (filters.staff_id) {
      query += ` AND t.staff_id = $${idx++}`;
      params.push(filters.staff_id);
    }
    if (filters.search) {
      query += ` AND (t.title ILIKE $${idx} OR t.code ILIKE $${idx} OR t.description ILIKE $${idx})`;
      params.push(`%${filters.search}%`);
      idx++;
    }

    query += ` ORDER BY t.created_at DESC`;

    if (filters.limit) {
      query += ` LIMIT $${idx++}`;
      params.push(parseInt(filters.limit));
    }
    if (filters.offset) {
      query += ` OFFSET $${idx++}`;
      params.push(parseInt(filters.offset));
    }

    const { rows } = await pool.query(query, params);
    return rows;
  },

  async findById(id) {
    const { rows } = await pool.query(`
      SELECT t.*,
        row_to_json(c) AS category,
        json_build_object('id', u.id, 'name', u.name, 'email', u.email, 'role', u.role) AS "user",
        CASE WHEN s.id IS NOT NULL THEN json_build_object('id', s.id, 'name', s.name, 'email', s.email, 'role', s.role) ELSE NULL END AS staff
      FROM "Ticket" t
      JOIN "Category" c ON c.id = t.category_id
      JOIN "User" u ON u.id = t.user_id
      LEFT JOIN "User" s ON s.id = t.staff_id
      WHERE t.id = $1
    `, [id]);

    if (!rows[0]) return null;

    const { rows: attachments } = await pool.query(
      `SELECT id, filename, filepath, filetype, filesize, created_at FROM "TicketAttachment" WHERE ticket_id = $1 ORDER BY created_at ASC`,
      [id]
    );

    return { ...rows[0], attachments };
  },

  async create({ title, description, category_id, user_id }) {
    const code = generateCode();
    const { rows } = await pool.query(
      `INSERT INTO "Ticket" (id, code, title, description, status, difficulty_level, category_id, user_id, created_at, updated_at)
       VALUES (gen_random_uuid(), $1, $2, $3, 'OPEN', 1, $4, $5, NOW(), NOW())
       RETURNING *`,
      [code, title, description, category_id, user_id]
    );
    return rows[0];
  },

  async claim(ticketId, staffId) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const { rows } = await client.query(
        `SELECT id, status, staff_id FROM "Ticket" WHERE id = $1 FOR UPDATE`,
        [ticketId]
      );
      if (!rows[0]) throw Object.assign(new Error('Tiket tidak ditemukan'), { statusCode: 404 });
      if (rows[0].staff_id) throw Object.assign(new Error('Tiket sudah diklaim oleh staff lain'), { statusCode: 409 });
      if (rows[0].status !== 'OPEN') throw Object.assign(new Error('Hanya tiket OPEN yang dapat diklaim'), { statusCode: 400 });

      const { rows: updated } = await client.query(
        `UPDATE "Ticket" SET staff_id = $1, status = 'IN_PROGRESS', updated_at = NOW() WHERE id = $2 RETURNING *`,
        [staffId, ticketId]
      );
      await client.query('COMMIT');
      return updated[0];
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  },

  async unclaim(ticketId, staffId) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const { rows } = await client.query(
        `SELECT id, status, staff_id FROM "Ticket" WHERE id = $1 FOR UPDATE`,
        [ticketId]
      );
      if (!rows[0]) throw Object.assign(new Error('Tiket tidak ditemukan'), { statusCode: 404 });
      if (rows[0].staff_id !== staffId) throw Object.assign(new Error('Anda bukan staff yang ditugaskan'), { statusCode: 403 });
      if (rows[0].status !== 'IN_PROGRESS') throw Object.assign(new Error('Hanya tiket IN_PROGRESS yang dapat dilepas'), { statusCode: 400 });

      const { rows: updated } = await client.query(
        `UPDATE "Ticket" SET staff_id = NULL, status = 'OPEN', updated_at = NOW() WHERE id = $1 RETURNING *`,
        [ticketId]
      );
      await client.query('COMMIT');
      return updated[0];
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  },

  async assign(ticketId, staffId) {
    const { rows } = await pool.query(
      `UPDATE "Ticket" SET staff_id = $1, status = CASE WHEN status = 'OPEN' THEN 'IN_PROGRESS' ELSE status END, updated_at = NOW()
       WHERE id = $2 RETURNING *`,
      [staffId, ticketId]
    );
    return rows[0] || null;
  },

  async updateStatus(ticketId, newStatus) {
    const { rows: current } = await pool.query(`SELECT * FROM "Ticket" WHERE id = $1`, [ticketId]);
    if (!current[0]) throw Object.assign(new Error('Tiket tidak ditemukan'), { statusCode: 404 });

    const allowed = MANAGER_TRANSITIONS[current[0].status] || [];
    if (!allowed.includes(newStatus)) {
      throw Object.assign(new Error(`Tidak dapat mengubah status dari ${current[0].status} ke ${newStatus}`), { statusCode: 400 });
    }

    const { rows } = await pool.query(
      `UPDATE "Ticket" SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
      [newStatus, ticketId]
    );

    // Auto-create leaderboard log when closing
    if (newStatus === 'CLOSED' && current[0].staff_id) {
      const now = new Date();
      const existing = await pool.query(`SELECT id FROM "LeaderboardLog" WHERE ticket_id = $1`, [ticketId]);
      if (existing.rows.length === 0) {
        const points = 10 * current[0].difficulty_level;
        await pool.query(
          `INSERT INTO "LeaderboardLog" (id, staff_id, ticket_id, points, period_month, period_year, created_at)
           VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, NOW())`,
          [current[0].staff_id, ticketId, points, now.getMonth() + 1, now.getFullYear()]
        );
      }
    }

    return rows[0];
  },

  async setPending(ticketId, staffId, pendingReason) {
    const { rows: current } = await pool.query(`SELECT * FROM "Ticket" WHERE id = $1`, [ticketId]);
    if (!current[0]) throw Object.assign(new Error('Tiket tidak ditemukan'), { statusCode: 404 });
    if (current[0].staff_id !== staffId) throw Object.assign(new Error('Anda bukan staff yang ditugaskan'), { statusCode: 403 });
    if (current[0].status !== 'IN_PROGRESS') throw Object.assign(new Error('Hanya tiket IN_PROGRESS yang dapat di-pending'), { statusCode: 400 });

    const { rows } = await pool.query(
      `UPDATE "Ticket" SET status = 'PENDING', pending_reason = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
      [pendingReason, ticketId]
    );
    return rows[0];
  },

  async resolve(ticketId, staffId, resolutionNote) {
    const { rows: current } = await pool.query(`SELECT * FROM "Ticket" WHERE id = $1`, [ticketId]);
    if (!current[0]) throw Object.assign(new Error('Tiket tidak ditemukan'), { statusCode: 404 });
    if (current[0].staff_id !== staffId) throw Object.assign(new Error('Anda bukan staff yang ditugaskan'), { statusCode: 403 });
    if (current[0].status !== 'IN_PROGRESS') throw Object.assign(new Error('Hanya tiket Diproses yang dapat diselesaikan. Jika tiket Tertunda, ubah ke Diproses terlebih dahulu.'), { statusCode: 400 });

    const { rows } = await pool.query(
      `UPDATE "Ticket" SET status = 'RESOLVED', resolution_note = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
      [resolutionNote, ticketId]
    );
    return rows[0];
  },

  async setDifficulty(ticketId, level) {
    const { rows } = await pool.query(
      `UPDATE "Ticket" SET difficulty_level = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
      [level, ticketId]
    );
    return rows[0] || null;
  },
};

module.exports = TicketModel;

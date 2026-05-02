const pool = require('../config/database');

const ChatModel = {
  async findByTicketId(ticketId) {
    const { rows } = await pool.query(`
      SELECT ch.id, ch.message, ch.attachment_url, ch.attachment_type, ch.is_voice_note, ch.ticket_id, ch.sender_id, ch.created_at,
        u.name AS sender_name, u.role AS sender_role
      FROM "Chat" ch
      JOIN "User" u ON u.id = ch.sender_id
      WHERE ch.ticket_id = $1
      ORDER BY ch.created_at ASC
    `, [ticketId]);
    return rows;
  },

  async create({ ticketId, senderId, message }) {
    const { rows } = await pool.query(
      `INSERT INTO "Chat" (id, message, ticket_id, sender_id, is_voice_note, created_at)
       VALUES (gen_random_uuid(), $1, $2, $3, false, NOW())
       RETURNING *`,
      [message, ticketId, senderId]
    );
    // Fetch sender info
    const { rows: user } = await pool.query(`SELECT name, role FROM "User" WHERE id = $1`, [senderId]);
    return { ...rows[0], sender_name: user[0]?.name, sender_role: user[0]?.role };
  },
};

module.exports = ChatModel;

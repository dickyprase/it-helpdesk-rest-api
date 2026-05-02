const pool = require('../config/database');

const LeaderboardModel = {
  async getLeaderboard(view = 'monthly', month, year) {
    let query;
    const params = [];

    if (view === 'yearly') {
      query = `
        SELECT l.staff_id, u.name AS staff_name, u.email AS staff_email,
          SUM(l.points)::int AS total_points,
          COUNT(l.id)::int AS tickets_closed
        FROM "LeaderboardLog" l
        JOIN "User" u ON u.id = l.staff_id
        WHERE l.period_year = $1
        GROUP BY l.staff_id, u.name, u.email
        ORDER BY total_points DESC
      `;
      params.push(year);
    } else {
      query = `
        SELECT l.staff_id, u.name AS staff_name, u.email AS staff_email,
          SUM(l.points)::int AS total_points,
          COUNT(l.id)::int AS tickets_closed
        FROM "LeaderboardLog" l
        JOIN "User" u ON u.id = l.staff_id
        WHERE l.period_month = $1 AND l.period_year = $2
        GROUP BY l.staff_id, u.name, u.email
        ORDER BY total_points DESC
      `;
      params.push(month, year);
    }

    const { rows } = await pool.query(query, params);
    return rows;
  },

  async getStaffStats(staffId, view = 'monthly', month, year) {
    const { rows: user } = await pool.query(
      `SELECT id, name, email FROM "User" WHERE id = $1`, [staffId]
    );
    if (!user[0]) return null;

    let whereClause;
    const params = [staffId];
    if (view === 'yearly') {
      whereClause = `l.staff_id = $1 AND l.period_year = $2`;
      params.push(year);
    } else {
      whereClause = `l.staff_id = $1 AND l.period_month = $2 AND l.period_year = $3`;
      params.push(month, year);
    }

    const { rows: stats } = await pool.query(`
      SELECT COALESCE(SUM(l.points), 0)::int AS total_points,
        COUNT(l.id)::int AS tickets_closed,
        COALESCE(ROUND(AVG(t.difficulty_level), 1), 0) AS avg_difficulty
      FROM "LeaderboardLog" l
      JOIN "Ticket" t ON t.id = l.ticket_id
      WHERE ${whereClause}
    `, params);

    const { rows: logs } = await pool.query(`
      SELECT l.id, l.points, l.created_at,
        json_build_object('id', t.id, 'code', t.code, 'title', t.title, 'difficulty_level', t.difficulty_level) AS ticket
      FROM "LeaderboardLog" l
      JOIN "Ticket" t ON t.id = l.ticket_id
      WHERE ${whereClause}
      ORDER BY l.created_at DESC
    `, params);

    return { ...user[0], ...stats[0], logs };
  },

  async getAvailablePeriods() {
    const { rows } = await pool.query(`
      SELECT DISTINCT period_month, period_year
      FROM "LeaderboardLog"
      ORDER BY period_year DESC, period_month DESC
    `);
    return rows;
  },
};

module.exports = LeaderboardModel;

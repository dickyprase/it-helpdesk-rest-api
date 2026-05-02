const pool = require('../config/database');

/**
 * Extract Bearer token from Authorization header.
 * Lookup session + user from database.
 * Attach user to req.user if valid.
 */
async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: true,
        message: 'Token tidak ditemukan. Silakan login terlebih dahulu.',
      });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({
        error: true,
        message: 'Format token tidak valid.',
      });
    }

    // Lookup session + user in one query
    const { rows } = await pool.query(
      `SELECT s.id AS session_id, s.expires_at,
              u.id, u.name, u.email, u.phone, u.role, u.is_active
       FROM "Session" s
       JOIN "User" u ON u.id = s.user_id
       WHERE s.id = $1`,
      [token]
    );

    if (rows.length === 0) {
      return res.status(401).json({
        error: true,
        message: 'Token tidak valid atau sudah expired. Silakan login ulang.',
      });
    }

    const session = rows[0];

    // Check expiry
    if (new Date() > new Date(session.expires_at)) {
      // Clean up expired session
      await pool.query(`DELETE FROM "Session" WHERE id = $1`, [token]);
      return res.status(401).json({
        error: true,
        message: 'Sesi telah berakhir. Silakan login ulang.',
      });
    }

    // Check active
    if (!session.is_active) {
      return res.status(403).json({
        error: true,
        message: 'Akun Anda telah dinonaktifkan. Hubungi administrator.',
      });
    }

    // Attach user to request
    req.user = {
      id: session.id,
      name: session.name,
      email: session.email,
      phone: session.phone,
      role: session.role,
    };

    next();
  } catch (err) {
    next(err);
  }
}

/**
 * Role-based access control middleware.
 * Usage: requireRole('MANAGER') or requireRole('STAFF', 'MANAGER')
 */
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: true,
        message: 'Token tidak ditemukan. Silakan login terlebih dahulu.',
      });
    }

    if (!roles.includes(req.user.role)) {
      const roleNames = roles.join(' atau ');
      return res.status(403).json({
        error: true,
        message: `Hanya ${roleNames} yang dapat mengakses endpoint ini.`,
      });
    }

    next();
  };
}

module.exports = { authenticate, requireRole };

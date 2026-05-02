const { body } = require('express-validator');

const loginRules = [
  body('email').isEmail().withMessage('Format email tidak valid').normalizeEmail(),
  body('password').notEmpty().withMessage('Password wajib diisi'),
];

const registerRules = [
  body('name').trim().isLength({ min: 2, max: 100 }).withMessage('Nama harus 2-100 karakter'),
  body('email').isEmail().withMessage('Format email tidak valid').normalizeEmail(),
  body('phone').optional({ values: 'falsy' }).isLength({ max: 20 }).withMessage('Nomor HP maksimal 20 karakter'),
  body('password').isLength({ min: 6, max: 100 }).withMessage('Password harus 6-100 karakter'),
];

module.exports = { loginRules, registerRules };

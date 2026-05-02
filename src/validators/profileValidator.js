const { body } = require('express-validator');

const updateProfileRules = [
  body('name').trim().isLength({ min: 2, max: 100 }).withMessage('Nama harus 2-100 karakter'),
  body('email').isEmail().withMessage('Format email tidak valid').normalizeEmail(),
  body('phone').optional({ values: 'falsy' }).isLength({ max: 20 }).withMessage('Nomor HP maksimal 20 karakter'),
];

const changePasswordRules = [
  body('current_password').notEmpty().withMessage('Password saat ini wajib diisi'),
  body('new_password').isLength({ min: 6, max: 100 }).withMessage('Password baru harus 6-100 karakter'),
];

module.exports = { updateProfileRules, changePasswordRules };

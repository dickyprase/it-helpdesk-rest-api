const { body } = require('express-validator');

const createTicketRules = [
  body('title').trim().isLength({ min: 5, max: 200 }).withMessage('Judul harus 5-200 karakter'),
  body('description').trim().isLength({ min: 10, max: 5000 }).withMessage('Deskripsi harus 10-5000 karakter'),
  body('category_id').notEmpty().withMessage('Kategori wajib dipilih'),
];

const unclaimRules = [
  body('unclaim_reason').trim().isLength({ min: 5, max: 2000 }).withMessage('Alasan harus 5-2000 karakter'),
];

const assignRules = [
  body('staff_id').notEmpty().withMessage('Staff ID wajib diisi'),
];

const statusRules = [
  body('status').isIn(['OPEN', 'IN_PROGRESS', 'PENDING', 'RESOLVED', 'CLOSED']).withMessage('Status tidak valid'),
];

const pendingRules = [
  body('pending_reason').trim().isLength({ min: 5, max: 2000 }).withMessage('Alasan harus 5-2000 karakter'),
];

const resolveRules = [
  body('resolution_note').trim().isLength({ min: 10, max: 5000 }).withMessage('Arahan harus 10-5000 karakter'),
];

const difficultyRules = [
  body('difficulty_level').isInt({ min: 1, max: 3 }).withMessage('Level kesulitan harus 1-3'),
];

module.exports = { createTicketRules, unclaimRules, assignRules, statusRules, pendingRules, resolveRules, difficultyRules };

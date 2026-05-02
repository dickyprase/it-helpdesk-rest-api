const { body } = require('express-validator');

const sendMessageRules = [
  body('message').trim().isLength({ min: 1, max: 2000 }).withMessage('Pesan harus 1-2000 karakter'),
];

module.exports = { sendMessageRules };

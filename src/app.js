require('dotenv').config();

const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const errorHandler = require('./middleware/errorHandler');

// Import routes
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const ticketRoutes = require('./routes/ticketRoutes');
const chatRoutes = require('./routes/chatRoutes');
const leaderboardRoutes = require('./routes/leaderboardRoutes');
const profileRoutes = require('./routes/profileRoutes');
const docsRoute = require('./routes/docsRoute');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Serve docs static files (images + downloads)
const path = require('path');
app.use('/docs/images', express.static(path.join(__dirname, '..', 'docs', 'images')));
app.use('/docs/downloads', express.static(path.join(__dirname, '..', 'docs', 'downloads')));

// API Documentation (web)
app.use('/docs', docsRoute);

// Health check
app.get('/api/v1', (_req, res) => {
  res.json({ error: false, message: 'IT Helpdesk REST API v1 is running' });
});

// Mount routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/categories', categoryRoutes);
app.use('/api/v1/tickets', ticketRoutes);
app.use('/api/v1/chat', chatRoutes);
app.use('/api/v1/leaderboard', leaderboardRoutes);
app.use('/api/v1/profile', profileRoutes);

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ error: true, message: 'Endpoint tidak ditemukan' });
});

// Global error handler
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`[API] Server running on http://localhost:${PORT}`);
  console.log(`[API] Documentation: http://localhost:${PORT}/docs`);
  console.log(`[API] Health check: http://localhost:${PORT}/api/v1`);
});

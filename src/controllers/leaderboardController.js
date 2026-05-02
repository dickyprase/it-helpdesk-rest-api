const LeaderboardModel = require('../models/leaderboardModel');

const LeaderboardController = {
  async getLeaderboard(req, res, next) {
    try {
      const { view = 'monthly', month, year } = req.query;
      const now = new Date();
      const m = month ? parseInt(month) : now.getMonth() + 1;
      const y = year ? parseInt(year) : now.getFullYear();
      const data = await LeaderboardModel.getLeaderboard(view, m, y);
      res.json({ error: false, data });
    } catch (err) { next(err); }
  },

  async getStaffStats(req, res, next) {
    try {
      const { view = 'monthly', month, year } = req.query;
      const now = new Date();
      const m = month ? parseInt(month) : now.getMonth() + 1;
      const y = year ? parseInt(year) : now.getFullYear();
      const data = await LeaderboardModel.getStaffStats(req.params.staffId, view, m, y);
      if (!data) return res.status(404).json({ error: true, message: 'Staff tidak ditemukan' });
      res.json({ error: false, data });
    } catch (err) { next(err); }
  },

  async getPeriods(req, res, next) {
    try {
      const data = await LeaderboardModel.getAvailablePeriods();
      res.json({ error: false, data });
    } catch (err) { next(err); }
  },
};

module.exports = LeaderboardController;

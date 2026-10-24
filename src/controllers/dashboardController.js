const AnalyticsService = require('../services/analyticsService');

class DashboardController {
  static async renderDashboard(req, res) {
    try {
      const stats = await AnalyticsService.getUserDashboardStats(req.user.id);

      res.render('pages/dashboard/index', {
        title: 'User Dashboard - PollCraft',
        stats,
        user: req.user
      });
    } catch (err) {
      console.error('[DASHBOARD ERROR]:', err);
      req.flash('error', 'Unable to load dashboard statistics at this moment.');
      res.render('pages/dashboard/index', {
        title: 'User Dashboard - PollCraft',
        stats: {
          totalPolls: 0,
          totalSurveys: 0,
          totalVotes: 0,
          totalSurveyResponses: 0,
          activePolls: 0,
          closedPolls: 0,
          recentPolls: [],
          recentSurveys: [],
          popularPolls: []
        },
        user: req.user
      });
    }
  }
}

module.exports = DashboardController;

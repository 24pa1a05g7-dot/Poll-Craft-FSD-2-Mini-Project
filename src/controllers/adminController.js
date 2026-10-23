const AnalyticsService = require('../services/analyticsService');
const { User, Poll, Survey } = require('../models');

class AdminController {
  static async renderAdminDashboard(req, res) {
    try {
      const platformStats = await AnalyticsService.getPlatformStats();
      res.render('pages/admin/index', {
        title: 'Platform Administrator Console - QuickPulse',
        stats: platformStats
      });
    } catch (err) {
      console.error('[ADMIN CONSOLE ERROR]:', err);
      res.status(500).render('pages/errors/500', {
        title: 'Admin Error',
        message: 'Could not load platform administrator console.'
      });
    }
  }

  static async toggleUserStatus(req, res) {
    const targetUserId = req.params.id;
    try {
      if (parseInt(targetUserId, 10) === req.user.id) {
        req.flash('error', 'You cannot deactivate your own administrative account.');
        return res.redirect('/admin');
      }

      const user = await User.findByPk(targetUserId);
      if (!user) {
        req.flash('error', 'User account not found.');
        return res.redirect('/admin');
      }

      user.isActive = !user.isActive;
      await user.save();

      req.flash('success', `User account ${user.email} status changed to ${user.isActive ? 'Active' : 'Deactivated'}.`);
      return res.redirect('/admin');
    } catch (err) {
      console.error('[TOGGLE USER ERROR]:', err);
      req.flash('error', 'Failed to toggle user status.');
      return res.redirect('/admin');
    }
  }

  static async deletePoll(req, res) {
    const pollId = req.params.id;
    try {
      const poll = await Poll.findByPk(pollId);
      if (poll) {
        await poll.destroy();
        req.flash('success', 'Poll removed by administrator.');
      }
      return res.redirect('/admin');
    } catch (err) {
      console.error('[ADMIN DELETE POLL ERROR]:', err);
      req.flash('error', 'Failed to delete poll.');
      return res.redirect('/admin');
    }
  }

  static async deleteSurvey(req, res) {
    const surveyId = req.params.id;
    try {
      const survey = await Survey.findByPk(surveyId);
      if (survey) {
        await survey.destroy();
        req.flash('success', 'Survey removed by administrator.');
      }
      return res.redirect('/admin');
    } catch (err) {
      console.error('[ADMIN DELETE SURVEY ERROR]:', err);
      req.flash('error', 'Failed to delete survey.');
      return res.redirect('/admin');
    }
  }
}

module.exports = AdminController;

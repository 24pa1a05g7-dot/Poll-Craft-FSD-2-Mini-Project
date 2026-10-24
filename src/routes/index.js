const express = require('express');
const router = express.Router();

const authRoutes = require('./authRoutes');
const dashboardRoutes = require('./dashboardRoutes');
const pollRoutes = require('./pollRoutes');
const surveyRoutes = require('./surveyRoutes');
const profileRoutes = require('./profileRoutes');
const adminRoutes = require('./adminRoutes');

const { Poll, Survey, PollVote, SurveyResponse } = require('../models');

// Home Landing Page
router.get('/', async (req, res, next) => {
  try {
    const featuredPolls = await Poll.findAll({
      where: { isPublic: true, status: 'published' },
      order: [['createdAt', 'DESC']],
      limit: 3,
      include: [{ model: PollVote, as: 'votes', attributes: ['id'] }]
    });

    const featuredSurveys = await Survey.findAll({
      where: { isPublic: true, status: 'published' },
      order: [['createdAt', 'DESC']],
      limit: 3,
      include: [{ model: SurveyResponse, as: 'responses', attributes: ['id'] }]
    });

    const stats = {
      totalPolls: await Poll.count(),
      totalSurveys: await Survey.count(),
      totalVotes: await PollVote.count(),
      totalResponses: await SurveyResponse.count()
    };

    res.render('pages/home', {
      title: 'PollCraft - Modern Polling & Survey Platform',
      featuredPolls,
      featuredSurveys,
      stats
    });
  } catch (err) {
    next(err);
  }
});

router.use('/auth', authRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/polls', pollRoutes);
router.use('/surveys', surveyRoutes);
router.use('/profile', profileRoutes);
router.use('/admin', adminRoutes);

module.exports = router;

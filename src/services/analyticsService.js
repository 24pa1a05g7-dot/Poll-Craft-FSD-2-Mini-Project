const {
  sequelize,
  Poll,
  PollVote,
  Survey,
  SurveyResponse,
  User
} = require('../models');
const { Op } = require('sequelize');

class AnalyticsService {
  static async getUserDashboardStats(userId, isAdmin = false) {
    const pollWhere = isAdmin ? {} : { userId };
    const surveyWhere = isAdmin ? {} : { userId };

    const totalPolls = await Poll.count({ where: pollWhere });
    const totalSurveys = await Survey.count({ where: surveyWhere });

    // Active vs Closed polls
    const activePolls = await Poll.count({
      where: {
        ...pollWhere,
        status: 'published'
      }
    });

    const closedPolls = await Poll.count({
      where: {
        ...pollWhere,
        status: 'closed'
      }
    });

    // Count votes for user's polls
    const userPollIds = (await Poll.findAll({
      where: pollWhere,
      attributes: ['id']
    })).map(p => p.id);

    const totalVotes = userPollIds.length > 0
      ? await PollVote.count({ where: { pollId: { [Op.in]: userPollIds } } })
      : 0;

    // Count submissions for user's surveys
    const userSurveyIds = (await Survey.findAll({
      where: surveyWhere,
      attributes: ['id']
    })).map(s => s.id);

    const totalSurveyResponses = userSurveyIds.length > 0
      ? await SurveyResponse.count({ where: { surveyId: { [Op.in]: userSurveyIds } } })
      : 0;

    // Recent Polls
    const recentPolls = await Poll.findAll({
      where: pollWhere,
      order: [['createdAt', 'DESC']],
      limit: 5,
      include: [
        { model: PollVote, as: 'votes', attributes: ['id'] }
      ]
    });

    // Recent Surveys
    const recentSurveys = await Survey.findAll({
      where: surveyWhere,
      order: [['createdAt', 'DESC']],
      limit: 5,
      include: [
        { model: SurveyResponse, as: 'responses', attributes: ['id'] }
      ]
    });

    // Popular Polls
    const popularPolls = await Poll.findAll({
      where: pollWhere,
      include: [
        { model: PollVote, as: 'votes', attributes: ['id'] }
      ],
      limit: 5
    });

    popularPolls.sort((a, b) => (b.votes?.length || 0) - (a.votes?.length || 0));

    return {
      totalPolls,
      totalSurveys,
      totalVotes,
      totalSurveyResponses,
      activePolls,
      closedPolls,
      recentPolls,
      recentSurveys,
      popularPolls: popularPolls.slice(0, 5)
    };
  }

  static async getPlatformStats() {
    const totalUsers = await User.count();
    const totalPolls = await Poll.count();
    const totalSurveys = await Survey.count();
    const totalVotes = await PollVote.count();
    const totalResponses = await SurveyResponse.count();

    const recentUsers = await User.findAll({
      order: [['createdAt', 'DESC']],
      limit: 10,
      attributes: ['id', 'name', 'email', 'role', 'isActive', 'createdAt']
    });

    const recentPolls = await Poll.findAll({
      order: [['createdAt', 'DESC']],
      limit: 10,
      include: [
        { model: User, as: 'creator', attributes: ['id', 'name', 'email'] },
        { model: PollVote, as: 'votes', attributes: ['id'] }
      ]
    });

    const recentSurveys = await Survey.findAll({
      order: [['createdAt', 'DESC']],
      limit: 10,
      include: [
        { model: User, as: 'creator', attributes: ['id', 'name', 'email'] },
        { model: SurveyResponse, as: 'responses', attributes: ['id'] }
      ]
    });

    return {
      totalUsers,
      totalPolls,
      totalSurveys,
      totalVotes,
      totalResponses,
      recentUsers,
      recentPolls,
      recentSurveys
    };
  }
}

module.exports = AnalyticsService;

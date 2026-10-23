const { sequelize } = require('../config/database');
const User = require('./User');
const Poll = require('./Poll');
const PollOption = require('./PollOption');
const PollVote = require('./PollVote');
const PollVoteSelection = require('./PollVoteSelection');
const Survey = require('./Survey');
const SurveyQuestion = require('./SurveyQuestion');
const SurveyQuestionOption = require('./SurveyQuestionOption');
const SurveyResponse = require('./SurveyResponse');
const SurveyAnswer = require('./SurveyAnswer');
const SurveyAnswerSelection = require('./SurveyAnswerSelection');
const Session = require('./Session');

// --- Poll Associations ---
User.hasMany(Poll, { foreignKey: 'userId', as: 'polls', onDelete: 'CASCADE' });
Poll.belongsTo(User, { foreignKey: 'userId', as: 'creator' });

Poll.hasMany(PollOption, { foreignKey: 'pollId', as: 'options', onDelete: 'CASCADE' });
PollOption.belongsTo(Poll, { foreignKey: 'pollId' });

Poll.hasMany(PollVote, { foreignKey: 'pollId', as: 'votes', onDelete: 'CASCADE' });
PollVote.belongsTo(Poll, { foreignKey: 'pollId' });

User.hasMany(PollVote, { foreignKey: 'userId', as: 'pollVotes', onDelete: 'SET NULL' });
PollVote.belongsTo(User, { foreignKey: 'userId', as: 'voter' });

PollVote.hasMany(PollVoteSelection, { foreignKey: 'voteId', as: 'selections', onDelete: 'CASCADE' });
PollVoteSelection.belongsTo(PollVote, { foreignKey: 'voteId' });

PollOption.hasMany(PollVoteSelection, { foreignKey: 'pollOptionId', as: 'selections', onDelete: 'CASCADE' });
PollVoteSelection.belongsTo(PollOption, { foreignKey: 'pollOptionId', as: 'option' });

PollVote.belongsToMany(PollOption, {
  through: PollVoteSelection,
  foreignKey: 'voteId',
  otherKey: 'pollOptionId',
  as: 'selectedOptions'
});
PollOption.belongsToMany(PollVote, {
  through: PollVoteSelection,
  foreignKey: 'pollOptionId',
  otherKey: 'voteId',
  as: 'votes'
});

// --- Survey Associations ---
User.hasMany(Survey, { foreignKey: 'userId', as: 'surveys', onDelete: 'CASCADE' });
Survey.belongsTo(User, { foreignKey: 'userId', as: 'creator' });

Survey.hasMany(SurveyQuestion, { foreignKey: 'surveyId', as: 'questions', onDelete: 'CASCADE' });
SurveyQuestion.belongsTo(Survey, { foreignKey: 'surveyId' });

SurveyQuestion.hasMany(SurveyQuestionOption, { foreignKey: 'questionId', as: 'options', onDelete: 'CASCADE' });
SurveyQuestionOption.belongsTo(SurveyQuestion, { foreignKey: 'questionId' });

Survey.hasMany(SurveyResponse, { foreignKey: 'surveyId', as: 'responses', onDelete: 'CASCADE' });
SurveyResponse.belongsTo(Survey, { foreignKey: 'surveyId' });

User.hasMany(SurveyResponse, { foreignKey: 'userId', as: 'surveyResponses', onDelete: 'SET NULL' });
SurveyResponse.belongsTo(User, { foreignKey: 'userId', as: 'respondent' });

SurveyResponse.hasMany(SurveyAnswer, { foreignKey: 'responseId', as: 'answers', onDelete: 'CASCADE' });
SurveyAnswer.belongsTo(SurveyResponse, { foreignKey: 'responseId' });

SurveyQuestion.hasMany(SurveyAnswer, { foreignKey: 'questionId', as: 'answers', onDelete: 'CASCADE' });
SurveyAnswer.belongsTo(SurveyQuestion, { foreignKey: 'questionId', as: 'question' });

SurveyAnswer.hasMany(SurveyAnswerSelection, { foreignKey: 'answerId', as: 'selections', onDelete: 'CASCADE' });
SurveyAnswerSelection.belongsTo(SurveyAnswer, { foreignKey: 'answerId' });

SurveyQuestionOption.hasMany(SurveyAnswerSelection, { foreignKey: 'questionOptionId', as: 'selections', onDelete: 'CASCADE' });
SurveyAnswerSelection.belongsTo(SurveyQuestionOption, { foreignKey: 'questionOptionId', as: 'option' });

SurveyAnswer.belongsToMany(SurveyQuestionOption, {
  through: SurveyAnswerSelection,
  foreignKey: 'answerId',
  otherKey: 'questionOptionId',
  as: 'selectedOptions'
});
SurveyQuestionOption.belongsToMany(SurveyAnswer, {
  through: SurveyAnswerSelection,
  foreignKey: 'questionOptionId',
  otherKey: 'answerId',
  as: 'answers'
});

module.exports = {
  sequelize,
  User,
  Poll,
  PollOption,
  PollVote,
  PollVoteSelection,
  Survey,
  SurveyQuestion,
  SurveyQuestionOption,
  SurveyResponse,
  SurveyAnswer,
  SurveyAnswerSelection,
  Session
};

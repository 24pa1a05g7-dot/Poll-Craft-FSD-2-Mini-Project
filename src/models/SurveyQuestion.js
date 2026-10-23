const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../config/database');

class SurveyQuestion extends Model {}

SurveyQuestion.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  surveyId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'surveys',
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  questionText: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: {
      notEmpty: { msg: 'Question text is required' }
    }
  },
  helpText: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  questionType: {
    type: DataTypes.ENUM(
      'single_choice',
      'multiple_choice',
      'short_text',
      'long_text',
      'rating',
      'yes_no'
    ),
    allowNull: false
  },
  isRequired: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    allowNull: false
  },
  orderIndex: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    allowNull: false
  }
}, {
  sequelize,
  modelName: 'SurveyQuestion',
  tableName: 'survey_questions',
  timestamps: true
});

module.exports = SurveyQuestion;

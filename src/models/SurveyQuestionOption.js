const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../config/database');

class SurveyQuestionOption extends Model {}

SurveyQuestionOption.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  questionId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'survey_questions',
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  optionText: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      notEmpty: { msg: 'Option text is required' }
    }
  },
  orderIndex: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    allowNull: false
  }
}, {
  sequelize,
  modelName: 'SurveyQuestionOption',
  tableName: 'survey_question_options',
  timestamps: true
});

module.exports = SurveyQuestionOption;

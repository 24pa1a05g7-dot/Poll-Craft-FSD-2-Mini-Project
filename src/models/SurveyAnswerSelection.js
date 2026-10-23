const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../config/database');

class SurveyAnswerSelection extends Model {}

SurveyAnswerSelection.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  answerId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'survey_answers',
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  questionOptionId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'survey_question_options',
      key: 'id'
    },
    onDelete: 'CASCADE'
  }
}, {
  sequelize,
  modelName: 'SurveyAnswerSelection',
  tableName: 'survey_answer_selections',
  timestamps: true,
  indexes: [
    {
      fields: ['answerId', 'questionOptionId'],
      unique: true
    }
  ]
});

module.exports = SurveyAnswerSelection;

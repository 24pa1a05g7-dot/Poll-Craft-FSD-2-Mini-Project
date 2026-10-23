const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../config/database');

class SurveyAnswer extends Model {}

SurveyAnswer.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  responseId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'survey_responses',
      key: 'id'
    },
    onDelete: 'CASCADE'
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
  textValue: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  numericValue: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: {
      min: 1,
      max: 5
    }
  },
  booleanValue: {
    type: DataTypes.BOOLEAN,
    allowNull: true
  }
}, {
  sequelize,
  modelName: 'SurveyAnswer',
  tableName: 'survey_answers',
  timestamps: true,
  indexes: [
    {
      fields: ['responseId', 'questionId'],
      unique: false
    }
  ]
});

module.exports = SurveyAnswer;

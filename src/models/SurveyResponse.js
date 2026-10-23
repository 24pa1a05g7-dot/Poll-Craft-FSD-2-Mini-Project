const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../config/database');

class SurveyResponse extends Model {}

SurveyResponse.init({
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
  userId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    },
    onDelete: 'SET NULL'
  },
  sessionId: {
    type: DataTypes.STRING(128),
    allowNull: true
  },
  ipHash: {
    type: DataTypes.STRING(64),
    allowNull: true
  },
  submittedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    allowNull: false
  }
}, {
  sequelize,
  modelName: 'SurveyResponse',
  tableName: 'survey_responses',
  timestamps: false,
  indexes: [
    {
      fields: ['surveyId', 'userId'],
      unique: false
    },
    {
      fields: ['surveyId', 'sessionId'],
      unique: false
    }
  ]
});

module.exports = SurveyResponse;

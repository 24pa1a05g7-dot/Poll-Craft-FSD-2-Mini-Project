const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../config/database');

class PollVote extends Model {}

PollVote.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  pollId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'polls',
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
  votedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    allowNull: false
  }
}, {
  sequelize,
  modelName: 'PollVote',
  tableName: 'poll_votes',
  timestamps: false,
  indexes: [
    {
      fields: ['pollId', 'userId'],
      unique: false
    },
    {
      fields: ['pollId', 'sessionId'],
      unique: false
    }
  ]
});

module.exports = PollVote;

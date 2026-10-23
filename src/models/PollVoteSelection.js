const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../config/database');

class PollVoteSelection extends Model {}

PollVoteSelection.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  voteId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'poll_votes',
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  pollOptionId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'poll_options',
      key: 'id'
    },
    onDelete: 'CASCADE'
  }
}, {
  sequelize,
  modelName: 'PollVoteSelection',
  tableName: 'poll_vote_selections',
  timestamps: true,
  indexes: [
    {
      fields: ['voteId', 'pollOptionId'],
      unique: true
    }
  ]
});

module.exports = PollVoteSelection;

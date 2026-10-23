const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../config/database');

class PollOption extends Model {}

PollOption.init({
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
  optionText: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      notEmpty: { msg: 'Option text cannot be empty' },
      len: [1, 255]
    }
  },
  orderIndex: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    allowNull: false
  }
}, {
  sequelize,
  modelName: 'PollOption',
  tableName: 'poll_options',
  timestamps: true
});

module.exports = PollOption;

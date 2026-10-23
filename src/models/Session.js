const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../config/database');

class Session extends Model {}

Session.init({
  sid: {
    type: DataTypes.STRING(36),
    primaryKey: true
  },
  expires: {
    type: DataTypes.DATE,
    allowNull: true
  },
  data: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  sequelize,
  modelName: 'Session',
  tableName: 'sessions',
  timestamps: true
});

module.exports = Session;

const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../config/database');

class Survey extends Model {
  get isExpired() {
    if (!this.expiresAt) return false;
    return new Date(this.expiresAt) < new Date();
  }

  get isOpen() {
    return this.status === 'published' && !this.isExpired;
  }
}

Survey.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  title: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      notEmpty: { msg: 'Survey title is required' },
      len: [3, 255]
    }
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  category: {
    type: DataTypes.STRING(50),
    defaultValue: 'General',
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('draft', 'published', 'closed'),
    defaultValue: 'draft',
    allowNull: false
  },
  isPublic: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    allowNull: false
  },
  requireLogin: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    allowNull: false
  },
  allowAnonymous: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    allowNull: false
  },
  expiresAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  slug: {
    type: DataTypes.STRING(120),
    allowNull: false,
    unique: true
  }
}, {
  sequelize,
  modelName: 'Survey',
  tableName: 'surveys',
  timestamps: true
});

module.exports = Survey;

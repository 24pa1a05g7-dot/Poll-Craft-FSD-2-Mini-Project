'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('surveys', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      userId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      title: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      category: {
        type: Sequelize.STRING(50),
        defaultValue: 'General',
        allowNull: false
      },
      status: {
        type: Sequelize.ENUM('draft', 'published', 'closed'),
        defaultValue: 'draft',
        allowNull: false
      },
      isPublic: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
        allowNull: false
      },
      requireLogin: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false
      },
      allowAnonymous: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
        allowNull: false
      },
      expiresAt: {
        type: Sequelize.DATE,
        allowNull: true
      },
      slug: {
        type: Sequelize.STRING(120),
        allowNull: false,
        unique: true
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false
      }
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('surveys');
  }
};

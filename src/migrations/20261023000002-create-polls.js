'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('polls', {
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
      isMultipleChoice: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false
      },
      isAnonymous: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
        allowNull: false
      },
      requireLogin: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false
      },
      isPublic: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
        allowNull: false
      },
      status: {
        type: Sequelize.ENUM('draft', 'published', 'closed'),
        defaultValue: 'published',
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
    await queryInterface.dropTable('polls');
  }
};

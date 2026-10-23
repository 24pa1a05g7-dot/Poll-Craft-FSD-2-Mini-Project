'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('poll_votes', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      pollId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'polls',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      userId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onDelete: 'SET NULL'
      },
      sessionId: {
        type: Sequelize.STRING(128),
        allowNull: true
      },
      ipHash: {
        type: Sequelize.STRING(64),
        allowNull: true
      },
      votedAt: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
        allowNull: false
      }
    });

    await queryInterface.addIndex('poll_votes', ['pollId', 'userId']);
    await queryInterface.addIndex('poll_votes', ['pollId', 'sessionId']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('poll_votes');
  }
};

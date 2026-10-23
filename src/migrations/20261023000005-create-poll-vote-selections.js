'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('poll_vote_selections', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      voteId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'poll_votes',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      pollOptionId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'poll_options',
          key: 'id'
        },
        onDelete: 'CASCADE'
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

    await queryInterface.addIndex('poll_vote_selections', ['voteId', 'pollOptionId'], {
      unique: true
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('poll_vote_selections');
  }
};

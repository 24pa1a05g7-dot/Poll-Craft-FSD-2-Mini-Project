'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('survey_responses', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      surveyId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'surveys',
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
      submittedAt: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
        allowNull: false
      }
    });

    await queryInterface.addIndex('survey_responses', ['surveyId', 'userId']);
    await queryInterface.addIndex('survey_responses', ['surveyId', 'sessionId']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('survey_responses');
  }
};

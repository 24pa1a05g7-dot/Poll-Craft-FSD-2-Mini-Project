'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('survey_questions', {
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
      questionText: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      helpText: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      questionType: {
        type: Sequelize.ENUM(
          'single_choice',
          'multiple_choice',
          'short_text',
          'long_text',
          'rating',
          'yes_no'
        ),
        allowNull: false
      },
      isRequired: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
        allowNull: false
      },
      orderIndex: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        allowNull: false
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
    await queryInterface.dropTable('survey_questions');
  }
};

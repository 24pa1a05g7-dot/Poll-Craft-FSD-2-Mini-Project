'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('survey_answers', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      responseId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'survey_responses',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      questionId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'survey_questions',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      textValue: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      numericValue: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      booleanValue: {
        type: Sequelize.BOOLEAN,
        allowNull: true
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

    await queryInterface.addIndex('survey_answers', ['responseId', 'questionId']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('survey_answers');
  }
};

'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('survey_answer_selections', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      answerId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'survey_answers',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      questionOptionId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'survey_question_options',
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

    await queryInterface.addIndex('survey_answer_selections', ['answerId', 'questionOptionId'], {
      unique: true
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('survey_answer_selections');
  }
};

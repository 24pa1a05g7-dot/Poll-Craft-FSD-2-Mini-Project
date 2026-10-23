'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('sessions', {
      sid: {
        type: Sequelize.STRING(36),
        primaryKey: true,
        allowNull: false
      },
      expires: {
        type: Sequelize.DATE,
        allowNull: true
      },
      data: {
        type: Sequelize.TEXT,
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
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('sessions');
  }
};

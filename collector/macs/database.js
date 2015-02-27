var Sequelize = require('sequelize');

module.exports = {
  connect: function () {
    var dbPath = __dirname + '/data/oui.sqlite3',
        sequelize = new Sequelize('database', 'username', 'password', { storage: dbPath, dialect: 'sqlite' }),
        models = {};

    models.Manufacturer = sequelize.import(__dirname + '/models/manufacturer');

    return {
      models: models
    };
  }
};
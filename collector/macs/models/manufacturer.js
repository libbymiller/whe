module.exports = function (sequelize, DataTypes) {
  return sequelize.define('manufacturer', {
    id: {
      type: DataTypes.STRING
    },
    shortName: {
      type: DataTypes.STRING
    },
    name: {
      type: DataTypes.STRING
    }
  }, {
    freezeTableName: true // Model tableName will be the same as the model name
  });
}
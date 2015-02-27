var db = require('./database').connect(),
    Manufacturer = db.models.Manufacturer,
    Promise = require('es6-promise').Promise;

module.exports = function () {
  return {
    find: function (mac) {
      var mac = normalise(mac);
      return new Promise(function (resolve, reject) {
        Manufacturer.find(mac).then(function(m) {
          resolve(m ? m.toJSON() : m);
        });
      });
    }
  };
};

function normalise(str) {
  return str.replace(/-/g, '')
            .replace(/:/g, '')
            .toUpperCase();
}
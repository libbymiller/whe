var os = require('os'),
    _  = require('lodash');

module.exports = {
  heartbeatInfoForType: function (type) {
    return {
      id: os.hostname(),
      ip: findIp(),
      type: type
    };
  }
}

function findIp() {
  var interfaces = os.networkInterfaces(),
      ip = null;
  if (interfaces['eth0']) {
    ip = _(interfaces['eth0'])
          .where({ family: 'IPv4' })
          .pluck('address').value();
  }
  return ip;
}
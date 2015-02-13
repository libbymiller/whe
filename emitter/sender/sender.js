var faye = require('faye')
    path = require('path');

var configPath = path.join(__dirname, '..', '..', 'shared', 'config.json'),
    config = require(configPath),
    client = new faye.Client( fayeUrl(config.collector) );

client.subscribe('/trigger', function () {
  console.log('Trigger message received');
});

setInterval(heartbeat, config.heartbeatIntervalSecs * 1000);

// Tell everyone we're here
function heartbeat() {
  client.publish('/heartbeat', { id: '1', type: 'emitter' });
}

function fayeUrl(url) {
  return 'http://' + url.host + ':' + url.port + '/faye';
}
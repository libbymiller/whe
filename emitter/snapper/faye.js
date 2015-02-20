var http = require('http'),
    faye = require('faye');

var server = http.createServer(),
    bayeux = new faye.NodeAdapter({mount: '/faye', timeout: 45});

bayeux.attach(server);
server.listen(9292);
console.log("faye: server started");

var client = new faye.Client('http://192.168.1.28:9292/faye');

client.subscribe('/foo', handle);
console.log("faye: subscribing to /foo");

function handle(msg) {
   try {
      console.log('faye: got message', typeof msg,  msg);
      console.log(msg.trigger);
   } catch(e) {
      console.error(e.stack);
   }

}


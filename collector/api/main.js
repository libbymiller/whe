var http    = require('http'),
    express = require('express'),
    faye    = require('faye');

var port = process.env.PORT;

var app = express(),
    bayeux = new faye.NodeAdapter({mount: '/faye'}),
    client = new faye.Client('http://localhost:' + port + '/faye'),
    server = http.createServer(app);

// Attach faye
bayeux.attach(server);

/*
  Serve static files from ./static
*/
app.use( express.static(__dirname + '/public') );

/*
  HTTP routes
*/
app.get('/status', function (req, res) {
  res.send('UP');
});

app.post('/metadata', function (req, res) {
  res.sendStatus(202);
});

app.post('/image', function (req, res) {
  res.sendStatus(202);
});

/*
  Faye monitoring for the dashboard
  Re-emit the following events:
    http://faye.jcoglan.com/node/monitoring.html
  TODO: Not sure how useful they are
*/
// bayeux.on('handshake', function (id) {
//   console.log('New client connected', id);
//   client.publish('/handshake', { id: id });
// });

/*
  Start listening
*/
server.listen(port, function () {
  var host = server.address().address,
      port = server.address().port;

  console.log('Collector API listening at http://%s:%s', host, port);
});

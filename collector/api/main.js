var express = require('express'),
    faye    = require('faye');

var port = process.env.PORT | 3000;

var app = express(),
    bayeux = new faye.NodeAdapter({mount: '/'}),
    server;

/*
  HTTP routes
*/
app.get('/', function (req, res) {
  res.redirect('/status');
});

app.get('/status', function (req, res) {
  res.send('UP');
});

app.post('/metadata', function (req, res) {
  res.sendStatus(202);
});

app.post('/image', function (req, res) {
  res.sendStatus(202);
});

server = app.listen(port, function () {
  var host = server.address().address,
      port = server.address().port;

  console.log('Collector API listening at http://%s:%s', host, port);
});

// Attach faye
bayeux.attach(server);

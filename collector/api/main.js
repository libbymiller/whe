var express = require('express');

var port = process.env.PORT | 3000;

var app = express();

/*
  HTTP routes
*/
app.get('/', function (req, res) {
  res.redirect('/status');
});

app.get('/status', function (req, res) {
  res.send('UP');
});

var server = app.listen(port, function () {
  var host = server.address().address,
      port = server.address().port;

  console.log('Collector API listening at http://%s:%s', host, port);
});
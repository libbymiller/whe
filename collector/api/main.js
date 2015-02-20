var http    = require('http'),
    express = require('express'),
    faye    = require('faye'),
    fs      = require('fs');

var Metadata = require('./lib/metadata');

var port = process.env.PORT;

var app = express(),
    bayeux = new faye.NodeAdapter({mount: '/faye'}),
    client = new faye.Client('http://localhost:' + port + '/faye'),
    server = http.createServer(app),
    metadata = new Metadata();

/*
  Listen to data change events
*/
['add', 'change'].forEach(function (action) {
  metadata.on(action, function (datum) {
    console.log('METADATA - ', action, datum);
  });
});

// Attach faye
bayeux.attach(server);

/*
  Serve static files from ./static
*/
app.use( express.static(__dirname + '/public') );

/*
  Parse json out of POST bodies
*/
app.use( require('body-parser').json() );

/*
  Simple template engine that just fetches html files
  from disk.
*/
app.engine('.html', function (filePath, options, callback) { // define the template engine
  fs.readFile(filePath, function (err, content) {
    if (err) throw new Error(err);
    return callback(null, content.toString());
  })
});
app.set('views', __dirname + '/public');
app.set('view engine', 'html');

/*
  HTTP routes
*/
app.get('/', function (req, res) {
  res.render('index');
});

app.get('/status', function (req, res) {
  res.send('UP');
});

app.get('/screen', function (req, res) {
  res.render('screen');
});

app.get('/dashboard', function (req, res) {
  res.render('dashboard');
});

// Current state of everything
app.get('/state', function (req, res) {
  res.json({
    metadata: metadata.toJSON()
  });
});

// Wifi data from emitters
app.post('/metadata', function (req, res) {
  if (req.body && req.body.data) {
    console.log('Received metadata', req.body.data);
    metadata.replace(req.body.data);
  } else {
    console.error('No metadata in POST body', req.body);
  }
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

var http    = require('http'),
    express = require('express'),
    faye    = require('faye'),
    fs      = require('fs'),
    multer  = require('multer'),
    _       = require('lodash'),
    cors    = require('cors'),
    Promise = require('es6-promise').Promise;

var Metadata = require('./lib/metadata'),
    Images   = require('./lib/images'),
    MacAddressLookup = require('../macs/main')(),
    config   = require('../../shared/config'),
    excl     = require('../../shared/exclusions');

var exclusions = excl.exclusions;

var numItemsToWaitForBeforeRender = config.numItemsToWaitForBeforeRender,
    maxNumSecsBeforeRender = config.maxNumSecsBeforeRender;

if (!numItemsToWaitForBeforeRender || !maxNumSecsBeforeRender) {
  console.log('config.numItemsToWaitForBeforeRender or config.maxNumSecsBeforeRender is not set in config.json');
  process.exit();
}

var port = process.env.PORT;

if (process.env.COLLECTOR_HOST) {
  console.log('COLLECTOR_HOST environment variable detected, overriding config.json');
  config.collector.host = process.env.COLLECTOR_HOST;
}

var app = express(),
    bayeux = new faye.NodeAdapter({mount: '/faye'}),
    client = new faye.Client('http://' + config.collector.host + ':' + port + '/faye'),
    server = http.createServer(app),
    metadata = new Metadata(),
    images = new Images();

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
  Cross-origin resource sharing
*/
app.use( cors() );

/*
  Handle multipart form data (with images)
  By default files are stored in tmp so
  will be deleted on restart
*/
app.use( multer(
    {
       onFileUploadComplete: function (file, req, res) {
         console.log(file.fieldname + ' uploaded to  ' + file.path)
       }
    }) 
);

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

app.get('/config', function (req, res) {
  res.json(config);
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
    metadata: metadata.toJSON().map(sanitise),
    images  : images.toJSON()
  });
});


function sanitise(data) {
  data = data || {}
  data.id = obfuscateAddress( data.id );
  data.power = data.power ? data.power.replace('-', '') : null;
  data.friends = data.friends
                  ? data.friends.map(function (obj) {
                      obj.id = obfuscateAddress(obj.id);
                      return obj;
                    })
                  : [];
  return data;
}

function obfuscateAddress(addrStr) {
  return addrStr
          ? addrStr.split(':').slice(0,5).concat('XX','XX').join(':')
          : '';
}

// Wifi data from emitters
app.post('/metadata', function (req, res) {
  var data;
  if (req.body && req.body.data) {
    data = req.body.data;

    console.log('Received metadata', data);

    // We get an array of wifi metadata
    // perform a lookup on each one
    promises = data.map(performMacAddressLookup);

    // When the lookups are finished, we get an array
    // of data back
    Promise.all(promises)
      .then(function(data) {
        // Remove any empty items from array
        data = _.compact(data);

        // The first item is the primary data
        var primary = _.first(data),
            // The MAC addresses in the tail are "friends"
            friends = _.rest(data);

        primary.friends = friends;
        metadata.replace(primary);

        incrementRenderCounter();
      })
      .catch(function (err) {
        console.error('Error performing lookups', err);
      });

  } else {
    console.error('No metadata in POST body', req.body);
  }
  res.sendStatus(202);
});

app.get('/image/latest/:source', function (req, res) {
  var source = req.params.source;
  console.log('source', source);
  var imageFromSource = images.get(source);
  console.log('imageFromSource', imageFromSource);

  var path = __dirname + '/public/images/fallback-snapper-image.jpg';
  var mime = 'image/jpeg';

  if (imageFromSource) {
    var file = _.first(imageFromSource.files) || {},
        path = file.path,
        mime = file.mimetype;
  }

  serveFile(path, mime, res);

});

app.get('/image/:name', function (req, res) {
  var name = req.params.name,
      file = images.findFile(name);

  if (file && file.path && file.mimetype) {
    serveFile(file.path, file.mimetype, res);
  } else {
    res.sendStatus(404);
  }
});

app.post('/image', function (req, res) {
  var files = _.toArray(req.files).map(function (f) { f.url = 'http://' + config.collector.host + ':' + config.collector.port + '/image/' + f.name; return f });
  if (req.body) {
    req.body.files = files;
    console.log('body', req.body);
    images.replace(req.body);
    incrementRenderCounter();
  } else {
    console.warn('No body for image POST');
  }
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
  Serve a file from disk with the given mimetype
  res: serve throught this response object
*/
function serveFile(path, mime, res) {
  fs.readFile(path, function (err, contents) {
    if (err) {
      console.log("err: 500");
      console.error(err);
      res.status(err).sendStatus(500);
    } else {
      res.set('Content-Type', mime).send(contents);
    }
  });
}

/*
  When the trigger happens, we wait X secs before
  asking the client to render
*/
var renderTimeoutId,
    renderCounter = 0;

client.subscribe('/trigger', function () {
  console.log('TRIGGER');
  renderTimeoutId = setTimeout(fireRender, maxNumSecsBeforeRender * 1000);
});

function incrementRenderCounter() {
  renderCounter++;
  console.log('incrementRenderCounter() renderCounter:', renderCounter);
  if (renderCounter >= numItemsToWaitForBeforeRender) {
    fireRender();
  }
}

function fireRender() {
  // Clear a timeout if it hasn't fired
  if (renderTimeoutId) {
    clearTimeout(renderTimeoutId);
    renderTimeoutId = null;
  }

  renderCounter = 0;

  // Fire render
  console.log('RENDER');
  client.publish('/render', {});
}

/*
  Start listening
*/
server.listen(port, function () {
  var host = server.address().address,
      port = server.address().port;

  console.log('Collector API listening at http://%s:%s', host, port);
});

// Given a single data object containing `id`
// which is a MAC address peform a lookup to
// resolve the manufacturer name.
// Resolves: the object passed in, augmented with
//           'shortName' and optionally 'name'
//           property
function performMacAddressLookup(data) {
  return new Promise(function (resolve, reject) {
    var mac = data.id;

    // Fail early if no MAC address given
    if (!mac) {
       console.error('no MAC address given');
       resolve();
       return;
    }

    // Fail is MAC address is in excluded list
    if ( _.filter(exclusions, function(m){return new RegExp("^"+m).test(mac);}).length > 0 ){
      console.error('MAC address is excluded: ', mac);
      resolve();
      return;
    }

    // Perform lookup
    MacAddressLookup
      .find(mac)
      .then(function (info) {
        console.log('Found MAC address info: ', info);
        if (info && info.shortName) {
          data.shortName = info.shortName;
          data.name = info.name;
        } else {
          console.warn('No MAC address info found for', data);
        }
        // Resolve with data either way
        resolve(data);
      });
  });
}

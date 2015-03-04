/*
  Send images and metadata to linux-based
  printer
*/

console.log('Printer started');

var faye = require('faye');
var config = require('../shared/config');

var fs = require('fs');
var exec = require('child_process').exec;
var path = require('path');
var Promise = require('es6-promise').Promise;
var http = require('http');

var counter = 0;

var outputDir = config.printer.outputDir,
    clientUrl = 'http://' + config.collector.host + ':' + config.collector.port + '/faye',
    printer   = config.printer.devicePath || '/dev/usb/lp0',
    noPrintTimeoutSecs = config.printer.noPrintTimeoutSecs;

if (!noPrintTimeoutSecs) {
  console.warn('config.printer.noPrintTimeoutSecs not specified');
}

console.log('Faye client URL', clientUrl);

var client = new faye.Client(clientUrl);

var jp2a = path.resolve('/usr/bin/jp2a');

if (fs.existsSync(jp2a) === false) {
  console.error('jp2a not found at ', jp2a);
  process.exit();
}

if (fs.existsSync(printer) === false) {
  console.error('printer not found at ', printer);
  console.error('Set printer.devicePath to override', printer);
  process.exit();
}

if (!outputDir) {
  console.error('config.printer.outputDir not specified');
  process.exit();
}

// Send a heartbeat every few secs (defined in config)
setInterval(heartbeat, config.heartbeatIntervalSecs * 1000);

function heartbeat() {
  client.publish('/heartbeat', { id: '1', type: 'printer' });
}


client.subscribe('/render', handle);

var isPrinting = false;

function handle(msg) {
  console.log('------------------------');
  console.log('/render message received, msg: ', msg);
  try {

    if (isPrinting === true) {
      console.log('Already printing, abort!');
      return;
    }

    var msgPromise = fetchState()
//                .then(fetchImage)
  //              .then(saveImage)
    //            .then(imageToAscii)
                .then(writeFile)
                .then(printFile)
                .then(startPrintTimeout)
                .catch(failure);
  } catch(e) {
    console.error(e.stack);
  }
}

/*
  Fetch contents of <collector>/state and parse as JSON
  Resolves: JSON data as object
  Rejects : on HTTP error or JSON parsing error
*/
function fetchState() {
  return new Promise(function (resolve, reject) {
    var url = 'http://' + config.collector.host + ':' + config.collector.port + '/state';
    var body = '';
    console.log('Fetch state at url', url);
    http.get(url, function (res) {
      res.on('data', function (chunk) {
        body += chunk;
      });

      res.on('error', function (err) {
        reject(err);
      });

      res.on('end', function () {
        try {
          var data = JSON.parse(body);
          resolve(data);
        } catch (err) {
          reject(err);
        }
      });
    });
  });
}

function fetchImage(msg) {
  return new Promise(function (resolve, reject) {
    var image = msg.images ? msg.images[0] : null;
    if (image && image.files && image.files[0]) {
      var imagePath = outputDir + '/' + image.files[0].name;
      var url = image.files[0].url;
      console.log('Fetching image url', url);
      console.log('Image path', imagePath);
      http.get(url, function (res) {
        res.on('error', function (err) {
          reject(err);
        });
        resolve({ msg: msg, res: res, imagePath: imagePath });
      });
    } else {
      reject(new Error('No image file'));
    }
  });
}

function saveImage(obj) {
  return new Promise(function (resolve, reject) {
    var filepath = obj.imagePath;
    console.log('Save image to path', filepath);
    var f = fs.createWriteStream(filepath);
    obj.res.on('data', function (chunk) {
      f.write(chunk);
    });
    obj.res.on('end', function () {
      f.end();
      resolve(obj);
    })
  });
}

function imageToAscii(obj) {
  console.log('imageToAscii', obj.imagePath);
  return new Promise(function (resolve, reject) {
    if (obj.imagePath) {
      exec([jp2a, '--width=80', '-i', obj.imagePath].join(' '), function (err, stdout) {
        if (err) {
          reject(err);
        } else {
          obj.ascii = stdout;
        }
        fs.unlink(obj.imagePath);
        resolve(obj);
      });
    } else {
      reject(new Error('imageToAscii(): obj.imagePath found'));
    }
  })
}

function writeFile(params) {
//  var contents = JSON.stringify(params.msg.metadata),
  var obj = params;
  //console.log(params);
//  var metadata_structure = params.msg.metadata[0];//frst only
  var metadata_structure = params.metadata[0];//frst only
//  console.log("metadata_structure");
//  console.log(metadata_structure);

  var source = metadata_structure.source;
  var aps = metadata_structure.aps;
  var id = metadata_structure.id;
  var power = metadata_structure.power;
  var shortName = metadata_structure.shortName;
  var time = metadata_structure.time;
  var d = new Date(0); // The 0 there is the key, which sets the date to the epoch
  d.setUTCSeconds(parseInt(time));

  var friends = metadata_structure.friends;

  var friends_arr = [];

  for(var i=0; i<friends.length; i++){
    var friend_shortName = friends[i].id;
    if(friend_shortName && friends_arr.length<3){
       friends_arr.push(friend_shortName);
    }
  }

  var header = '-------------------------------------------------------------------------------';
  var contents = '\nPerson number '+counter+' located:\n';
  counter = counter+1
  if(shortName){
    contents = contents + shortName + ' user\n';
  }
  contents = contents + 'Tracking identifier '+id;
  if(aps && aps!=""){
    contents = contents + 'Known networks '+aps+'\n';
  }
  contents = contents + '\nKnown associates '+friends_arr.join(",")+'\n';

  console.log('Construct print file');
//  console.log(header + contents);
  return new Promise(function (resolve, reject) {
//    obj.printFile = header + contents + '\n\n\n\n' + obj.ascii;
    obj.printFile = header + contents;
    resolve(obj);
  });
}

function printFile(obj) {
  console.log('Sending to printer', printer);
  var escapedOutput = obj.printFile.replace(/\'/g, "'\\''");
  var cmnd = "sudo chown pi:pi " + printer + "; echo $'" + escapedOutput + "'  >  " + printer;
  exec(cmnd);
  // Pass through parameters
  return Promise.resolve(obj);
}

/*
  Sets the global variable `isPrinting`
  to true and after waiting `printTimeoutSecs`
  seconds, sets it to false again
*/
function startPrintTimeout(params) {
  console.log('Start print timeout');
  setTimeout(function () {
    isPrinting = false;
  }, noPrintTimeoutSecs ? (noPrintTimeoutSecs * 1000) : 0);

  isPrinting = true;

  // Just passes through a resolved promise
  // with the same arguments
  return Promise.resolve(params);
}

function failure(e) {
  console.log('error')
  console.error('Promise failure. Error:', e.stack);
}

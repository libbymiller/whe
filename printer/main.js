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

var outputDir = config.printer.outputDir,
	  clientUrl = 'http://' + config.collector.host + ':' + config.collector.port + '/faye',
	  printer   = config.printer.devicePath || '/dev/usb/lp0';

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

client.subscribe('/render', handle);

function handle(msg) {
	console.log('/render received. msg: ', msg);
	try {
		var msgPromise = fetchState()
				        .then(fetchImage)
								.then(saveImage)
								.then(imageToAscii)
								.then(writeFile)
								.then(printFile)
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
	var contents = JSON.stringify(params.msg.metadata),
		obj = params;

	var header = 'MOZFEST 2014\n*** YOUR SOUVENIR FROM THE ETHICAL DILEMMA CAFE ****\n\n';

	console.log('Construct file', params);
	return new Promise(function (resolve, reject) {
		obj.printFile = header + contents + '\n\n\n\n' + obj.ascii;
	  resolve(obj);
	});
}

function printFile(obj) {
	console.log('Sending to printer', printer);
  var escapedOutput = obj.printFile.replace(/\'/g, "'\\''");
  var cmnd = "sudo chown pi:pi " + printer + "; echo $'" + escapedOutput + "'  >  " + printer;
	exec(cmnd);
}

function failure(e) {
	console.log('error')
	console.error('Promise failure. Error:', e.stack);
}

// based on and largely the same as
// https://gist.githubusercontent.com/andrewn/294d9483f5bd2ef11055/raw/4022ecd31e55722b1d9d013d4cec51180232b0d1/main.js
// but for pi instead of windows

console.log('hello');

var faye = require('faye');
var config   = require('../shared/config');

var fs = require('fs');
var exec = require('child_process').exec;
var path = require('path');
var Promise = require('es6-promise').Promise;

var http = require('http');
var client = new faye.Client('http://' + config.collector.host + ':' + config.collector.port + '/faye');

var outputDir = config.printer.outputDir;

client.subscribe('/render', handle);


function handle(msg) {
	try {
		console.log('msg', typeof msg,  msg);
		var msg = msg[0];

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
		}
	});
}

function saveImage(obj) {
	return new Promise(function (resolve, reject) {
		console.log('Save image to path', filepath);
		var filepath = obj.imagePath;
		var f = fs.createWriteStream(filepath);
		obj.res.on('data', function (chunk) {
			f.write(chunk);
		})
		obj.res.on('end', function () {
			f.end();
			resolve(obj);
		})
	});
}

var jp2a = path.resolve('/usr/bin/jp2a');

function imageToAscii(obj) {
	console.log('imageToAscii', obj.imagePath);
	return new Promise(function (resolve, reject) {
		if (obj.imagePath) {
			exec([jp2a, '--width=80', '-i', obj.imagePath].join(' '), function (err, stdout) {
				if (err) {
					reject(obj);
				} else {
					obj.ascii = stdout;
				}
				resolve(obj);
			});
		} else {
			reject();
		}
	})
}

function failure(e) {
	console.error('failuer', e.stack);
}

function printFile(obj) {
  var escapedOutput = obj.printFile.replace(/\'/g, "'\\''");
  console.log('printing', escapedOutput);
  var cmnd = "sudo chown pi:pi /dev/usb/lp0; echo $'" + escapedOutput + "'  >  /dev/usb/lp0";
  // var cmnd = "sudo chown pi:pi /dev/usb/lp0; cat "+obj.printFile+"  >  /dev/usb/lp0";
	exec(cmnd);
}

function writeFile(params) {
	var contents = JSON.stringify(params.msg.metadata),
		obj = params;

	var header = 'MOZFEST 2014\n*** YOUR SOUVENIR FROM THE ETHICAL DILEMMA CAFE ****\n\n';

	console.log('Construct file', params);
	return new Promise(function (resolve, reject) {
		// var fileName = 'data-' + Date.now() + '.txt';
		// var filepath = path.resolve('./data/' + fileName);
		// fs.writeFileSync(filepath, header + contents + '\n\n\n\n' + obj.ascii);
		// obj.printFile = filepath;
		obj.printFile = header + contents + '\n\n\n\n' + obj.ascii;
	  resolve(obj);
	});
}

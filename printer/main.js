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


client.subscribe('/render', handle);


function msgContents(msg) {
	return new Promise(function (resolve, reject) {
		// var fileName = 'data-' + Date.now();
		// var filepath = path.resolve('./data/' + fileName);
		// image(msg);
		var output =  JSON.stringify(msg, undefined, 2);
		// console.log(filepath);
		console.log(output);
		resolve(output);
		// fs.writeFileSync(filepath,output);
	    // sendPrint(filepath)
	});
}

function fetchImageUrl(msg) {
	return new Promise(function (resolve, reject) {
                var url = 'http://' + config.collector.host + ':' + config.collector.port + '/state';
		console.log('url', url);
		http.get(url, function (res) {
			resolve({ msg: msg, res: res });
		});
	});
}

function saveImage(obj) {
	return new Promise(function (resolve, reject) {
		var filepath = obj[0].imagePath;
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

function handle(msg) {

	try {
		console.log('msg', typeof msg,  msg);
		var msg = msg[0];

		var msgPromise = msgContents(msg);
		var asciiImagePromise = fetchImageUrl(msg)
								.then(saveImage)
								.then(imageToAscii)
								.catch(failure);

	    Promise.all([msgPromise, asciiImagePromise])
	    		.then(writeFile)
	    		.then(printFile)
	    		.catch(failure);		
	} catch(e) {
		console.error(e.stack);
	}

}


function printFile(obj) {
	console.log('print', arguments);
	console.log('printing', obj.printFile)
//	exec(print, [obj.printFile]);
        var cmnd = "sudo chown pi:pi /dev/usb/lp0; cat "+obj.printFile+"  >  /dev/usb/lp0";
        console.log("command is "+cmnd);
	exec(cmnd);
}

function writeFile(params) {
	var contents = params[0],
		obj = params[1];

	var header = 'MOZFEST 2014\n*** YOUR SOUVENIR FROM THE ETHICAL DILEMMA CAFE ****\n\n';

	console.log('write file', arguments);
	return new Promise(function (resolve, reject) {
		var fileName = 'data-' + Date.now() + '.txt';
		var filepath = path.resolve('./data/' + fileName);
		fs.writeFileSync(filepath, header + contents + '\n\n\n\n' + obj.ascii);
		obj.printFile = filepath;
	    resolve(obj);
	});
}

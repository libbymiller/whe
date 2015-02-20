var http = require('http'),
    faye = require('faye'),
    fs = require('fs'),
    request = require('request'),
    path = require('path');

var ip = '192.168.1.28';
var fayePort = '9292';
var serverPort = '8081';
var threshold = 1000*1000; //diff is in milliseconds, so this gives threshold in secs

var client = new faye.Client('http://'+ip+':'+fayePort+'/faye');

client.subscribe('/foo', handle);
console.log('faye: subscribing to /foo');

var dataFilename = 'data.json';

function handle(msg) {
   try {
      console.log('faye: got message', typeof msg,  msg);
      console.log(msg.trigger);
      if(msg.trigger == 'photo'){
         // load file from the expected place
         // send a face one if it's not too old
         console.log('looking for creation time of '+path.join(__dirname, dataFilename));
         fs.stat(path.join(__dirname, dataFilename), fsDateCallback);

      }

   } catch(e) {
      console.log("problem");
      console.error(e.stack);
   }

}



function fsDateCallback(err, data){
   if(err){
      console.log("error: assuming no file, not sending metadata");

   }else{
     console.log("fs date callback ok so far");
     console.log(data.ctime);

     var startDate = data.ctime.getTime();
     var endDate = Date.now();
     var diff = endDate - startDate;
     console.log('startDate '+startDate+' endDate '+endDate+' diff '+diff/1000+' threshold '+threshold+' secs');
     if(diff < threshold){
       console.log('face image is ok, sending');
       fs.readFile(path.join(__dirname, dataFilename), 'utf8', function (err,fdata) {
         if (err) {
           return console.log(err);
         }
         sendData(fdata);
       });

     }else{
       console.log("metadata is too old - not sending");
     }
   }

}

function sendData(fdata){
   // read the file

   console.log("sending "+fdata);

   var headers = {
    'Content-Type': 'application/json',
    'Content-Length': fdata.length
   };

   var options = {
     host: ip,
     port: serverPort,
     path: '/metadata',
     method: 'POST',
     headers: headers
   };


   var req = http.request(options, requestCallback);
   req.write(fdata);
   req.end();

}
           
function requestCallback(err, res, body) {
   if(err){
      console.log("error");
   }
   console.log("ok");
   console.log(body);
}

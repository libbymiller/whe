var http = require('http'),
    faye = require('faye'),
    fs = require('fs'),
    request = require('request'),
    path = require('path');

var ip = 'http://192.168.1.28';
var fayePort = '9292';
var serverPort = '8081';
var threshold = 10*1000; //diff is in milliseconds, so this gives threshold in secs

var client = new faye.Client(ip+':'+fayePort+'/faye');

client.subscribe('/foo', handle);
console.log('faye: subscribing to /foo');

var faceFilename = 'images/camcvface.jpg';
var anyFilename = 'images/camcvimage.jpg'

function handle(msg) {
   try {
      console.log('faye: got message', typeof msg,  msg);
      console.log(msg.trigger);
      if(msg.trigger == 'photo'){
         // load file from the expected place
         // send a face one if it's not too old
         console.log('looking for creation time of '+path.join(__dirname, faceFilename));
         fs.stat(path.join(__dirname, faceFilename), fsDateCallback);

      }

   } catch(e) {
      console.log("problem");
      console.error(e.stack);
   }

}



function fsDateCallback(err, data){
   if(err){
      console.log("error: assuming no file, sending whatever we have");
      sendImage(anyFilename);

   }else{
     console.log("fs date callback ok so far");
     console.log(data.ctime);

     var startDate = data.ctime.getTime();
     var endDate = Date.now();
     var diff = endDate - startDate;
     console.log('startDate '+startDate+' endDate '+endDate+' diff '+diff/1000+' threshold '+threshold+' secs');
     if(diff < threshold){
       console.log('face image is ok, sending');
       sendImage(faceFilename);
     }else{
       console.log('face image is too old with threshold '+threshold+' - sending non-face');
       sendImage(anyFilename);
     }
   }

}

function sendImage(filename){
   var r = request.post(ip+':'+serverPort+'/image', requestCallback);
   var form = r.form()
   form.append("folder_id", "0");
   console.log("uploading "+path.join(__dirname, filename));
   form.append("name", fs.createReadStream(path.join(__dirname, filename)));
}
           
function requestCallback(err, res, body) {
   if(err){
      console.log("error");
   }
   console.log("ok");
   console.log(body);
}

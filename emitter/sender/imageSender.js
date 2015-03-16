var faye = require('faye')
    path = require('path'),
    http = require('http'),
    fs = require('fs'),
    request = require('request'),
    os = require("os");

var source = os.hostname();

var configPath = path.join(__dirname, '..', '..', 'shared', 'config.json'),
    config = require(configPath),
    utilsPath = path.join(__dirname, '..', '..', 'shared', 'utils.js'),
    utils = require(utilsPath),
    imageBasePath = config.snapper.imageBasePath,
    heartbeatInfo = utils.heartbeatInfoForType('emitter'),
    client = new faye.Client( fayeUrl(config.collector) );

console.log("Starting snapper with info " + heartbeatInfo.ip);

if (!imageBasePath) {
  console.error('Set config.snapper.imageBasePath to directory for saving images');
  process.exit();
}

client.subscribe('/trigger', handleTrigger);
console.log("subscribed to trigger");

// Send a heartbeat every few secs (defined in config)
setInterval(heartbeat, config.heartbeatIntervalSecs * 1000);

// Tell everyone we're here
function heartbeat() {
  client.publish('/heartbeat', heartbeatInfo);
}

function fayeUrl(url) {
  return 'http://' + url.host + ':' + url.port + '/faye';
}

function handleTrigger(msg) {
  var faceFilename = path.join(imageBasePath, '/camcvface.jpg');
  console.log('Trigger message received');
   try {
      console.log('faye: got message', typeof msg,  msg);
      console.log(msg.trigger);
      // load file from the expected place if it's not too old
      console.log('looking for creation time of '+faceFilename);
      fs.stat(faceFilename, fsDateCallback);
   } catch(e) {
      console.log("problem");
      console.error(e.stack);
   }
}

function fsDateCallback(err, data){
   var anyFilename = path.join(imageBasePath, '/camcvimage.jpg');
   var faceFilename = path.join(imageBasePath, '/camcvface.jpg');
   var threshold = 10*1000; //diff is in milliseconds, so this gives threshold in secs - should be in config?
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
   var r = request.post('http://'+config.collector.host+':'+config.collector.port+'/image', requestCallback);
   var form = r.form()
   form.append("folder_id", "0");
   form.append("source", source);
   console.log("uploading "+filename+" to "+config.collector.host+":"+config.collector.port+"/image");
   form.append("name", fs.createReadStream(filename));
}

function requestCallback(err, res, body) {
   if(err){
      console.log("error");
   }
   console.log("ok");
   console.log(body);
}


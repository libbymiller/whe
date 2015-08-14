var faye = require('faye')
    path = require('path'),
    http = require('http'),
    fs = require('fs'),
    request = require('request');

var configPath = path.join(__dirname, '..', '..', 'shared', 'config.json'),
    config = require(configPath),
    utilsPath = path.join(__dirname, '..', '..', 'shared', 'utils.js'),
    utils = require(utilsPath),
    heartbeatInfo = utils.heartbeatInfoForType('sniffer'),
    client = new faye.Client( fayeUrl(config.collector) );

var os = require("os");
var host = os.hostname();

var dataFilename = config.sniffer.dataFilename;
var dataCsvPrefix = config.sniffer.dataCsvPrefix;

if (!dataFilename || !dataCsvPrefix) {
  console.error('Set config.sniffer.dataCsvPrefix and config.sniffer.dataFilename to path to save JSON');
  process.exit();
}

client.subscribe('/trigger', handleTrigger);
console.log("listening to "+fayeUrl(config.collector) );

// Send a heartbeat every few secs (defined in config)
setInterval(heartbeat, config.heartbeatIntervalSecs * 1000);

// Tell everyone we're here
function heartbeat() {
  client.publish('/heartbeat', heartbeatInfo);
}

function fayeUrl(url) {
  return 'http://' + url.host + ':' + url.port + '/faye';
}

function handleTrigger() {
  console.log('Trigger message received');
   try {
      // load file from the expected place if it's not too old
      console.log('looking for creation time of '+path.join(__dirname, dataFilename));
      fs.stat(dataCsvPrefix+"-01.csv", fsDateCallback);
   } catch(e) {
      console.log("problem");
      console.error(e.stack);
   }
}

function fsDateCallback(err, data){
   var threshold = 1000*1000; //diff is in milliseconds, so this gives threshold in secs - should be in config?
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
       console.log('metadata data age is ok, sending');
       fs.readFile(dataCsvPrefix+"-01.csv", 'utf8', function (err,fdata) {
         if (err) {
           return console.log(err);
         }
         var json = parseCsvToJson(fdata);
         sendData(JSON.stringify(json));
       });
     }else{
       console.log("metadata is too old - not sending");
     }
   }
}

function sendData(fdata){
   console.log("sending metadata "+fdata);
   var headers = {
    'Content-Type': 'application/json',
    'Content-Length': fdata.length
   };

   var options = {
     host: config.collector.host,
     port: config.collector.port,
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


// parse csv into the format that we want
function parseCsvToJson(fdata){
  var lines = fdata.split("\r\n");
  var sniffed_lines = [];
  var count = null;
  for (var i=0; i<lines.length; i++){
     var components = lines[i].split(",");
     for (var j=0; j<lines.length; j++){
       if(components[j]=="Station MAC"){
         console.log("got first line");
         sniffed_lines = lines.slice(i+1, lines.length);
       }
     }
  }
  var results = {};
  var data = [];
  var ids = [];
  for (var i=0; i < sniffed_lines.length; i++){
    var sniffed_components = sniffed_lines[i].split(",");
    var item = {};
    var id = sniffed_components[0];

    if(id && id!=''){
      var new_id_arr = id.split(":");
      var new_id = new_id_arr[0]+":"+new_id_arr[1]+":"+new_id_arr[2]+":"+new_id_arr[3]+":XX:XX";
      if(ids.indexOf(new_id)==-1){
        item["id"] = new_id;
        item["source"] = host;
        item["aps"] = sniffed_components.slice(6,sniffed_components.length).join(",");
        item["power"] = sniffed_components[3].trim();
        var d = new Date(sniffed_components[2]);
        item["time"] = (d.getTime() / 1000).toString();
        data.push(item);
        ids.push(new_id);
      }
    }
  }
  results["data"] = data;
  console.log(results);
  return results;
}


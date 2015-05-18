var path = require('path'),
    fs = require('fs');

var serialport = require("serialport");
var SerialPort = serialport.SerialPort;

WIDTH = 640;
STEP_RANGE = 945;
FOV = 53.50; // degrees
FOV_RAD = 53.50 * Math.PI / 180; // radians

D = WIDTH / ( 2 * Math.tan(FOV_RAD / 2) );

var configPath = path.join(__dirname, '..', '..', 'shared', 'config.json'),
    config = require(configPath),
    utilsPath = path.join(__dirname, '..', '..', 'shared', 'utils.js'),
    utils = require(utilsPath),
    imageBasePath = config.snapper.imageBasePath;

//var portid = process.argv[2];
var portid = "/dev/ttyUSB0";

var serialPort = new SerialPort(portid, {
  baudrate: 9600,
  dataBits: 8,
  parity: 'none',
  stopBits: 1,
  flowControl: false,
  parser: serialport.parsers.readline("\n")
});

serialPort.on("open", function () {
  console.log('open');

  serialPort.on('data', function(data) {
      result = data.trim();
      console.log('data received: ' + result);
  });
  serialPort.on('error', function (err) {
      console.error("error", err);
  });
});

fs.watch(imageBasePath, function (event, filename) {
  //console.log('event is: ' + event);
  if (filename=="move" && event=="change") {
//  console.log('filename provided: ' + filename);
    fs.readFile(imageBasePath+"/move",'utf8', function (err, data) {
/*
we want to give the stepper a position to go to
stepper has 944 steps
the value of data is 0 - 600, with a field of view of 54 degrees
angle = atan(x/588)  where x is distance from 300 left from centre
distance to travel on stepper = angle in degrees * (944/360)
use Math.atan(n);
To convert radians to degrees, divide by (Math.PI / 180),
so
*/
//* calculate x

     var x = 0;
     var d = parseInt(data);
     if(d){
        var position = d;
	var cpos = position - WIDTH / 2 ; // adjust for centre
	var angle =  Math.atan( cpos / D ); // work out angle

	var step_val = STEP_RANGE * angle / (2 * Math.PI);
	var angle_to_stepper = (step_val < 0) ? STEP_RANGE + step_val : step_val ;

        console.log("position "+d+"\nnormalised for 0 "+cpos+"\nangle "+angle+"\nstep val "+step_val+" angle to stepper "+angle_to_stepper );
        var steps = parseInt(angle_to_stepper);
        serialPort.write(steps+"\n", function(err, results) {
          console.log('err ' + err);
          console.log('results ' + results);
          serialPort.drain();
        });
      }//end if data and data is an integer
      else{
        //console.log("not a number - "+data+" d "+d);
      }

      if (err) {
        console.log("err....");
        console.log(err);
      }
    });
  } else {
    //console.log('filename not provided');
  }
});

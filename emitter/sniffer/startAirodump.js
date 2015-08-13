var path = require('path'),
    exec = require('child_process').exec;

var configPath = path.join(__dirname, '..', '..', 'shared', 'config.json'),
    config = require(configPath);

var dataCsvPrefix = config.sniffer.dataCsvPrefix;

if (!dataCsvPrefix) {
  console.error('Set config.sniffer.dataCsvPrefix to path to save csv');
  process.exit();
}


// kill any old airodump processes
exec('sudo killall airodump-ng', function callback(error, stdout, stderr){
   console.log("sudo killall airodump-ng");
   if (error) {
     console.log(error.stack);
     console.log('Error code: '+error.code);
     console.log('Signal received: '+error.signal);
   }
   console.log('Child Process STDOUT: '+stdout);
   console.log('Child Process STDERR: '+stderr);
});

//remove old file(s)
exec('sudo rm '+dataCsvPrefix+'*', function callback(error, stdout, stderr){
   console.log('sudo rm '+dataCsvPrefix+'*');
   if (error) {
     console.log(error.stack);
     console.log('Error code: '+error.code);
     console.log('Signal received: '+error.signal);
   }
   console.log('Child Process STDOUT: '+stdout);
   console.log('Child Process STDERR: '+stderr);
});


// start up airmon and airodump
exec('sudo airmon-ng start wlan1', function callback(error, stdout, stderr){
   console.log("sudo airmon-ng start wlan1");
   if (error) {
     console.log(error.stack);
     console.log('Error code: '+error.code);
     console.log('Signal received: '+error.signal);
   }else{
     console.log("success");
     //dump to csv file
     exec('nohup sudo airodump-ng mon0 --channel 11 --berlin 2 --output-format csv --write '+dataCsvPrefix+' > /dev/null 2>&1 &', function callback(error, stdout, stderr){
       console.log('sudo airodump-ng mon0 --channel 11 --berlin 2 --output-format csv --write '+dataCsvPrefix);
       if (error) {
         console.log(error.stack);
         console.log('Error code: '+error.code);
         console.log('Signal received: '+error.signal);
       }
       console.log('Child Process STDOUT: '+stdout);
       console.log('Child Process STDERR: '+stderr);
     });
   }
   console.log('Child Process STDOUT: '+stdout);
   console.log('Child Process STDERR: '+stderr);
});



var fs = require('fs'),
    Promise = require('es6-promise').Promise;

var db = require('./database').connect();

var dataFilePath = __dirname + '/data/oui-wireshark.txt';
var lines = fs.readFileSync(dataFilePath).toString().split('\n');

console.log('File has: ', lines.length);
var errorCount = 0;

db.models.Manufacturer.sync({force: true}).then(function () {
  // Table created
  console.log('Table created');

  Promise.all(lines.map(createRecord))
    .then(db.models.Manufacturer.count, db.models.Manufacturer.count)
    .then(function(c) {
      console.log("There are " + c + " manufacturers");
      console.log("There were " + errorCount + "errors");
    });

});

function splitIdAndName(str) {
  var parts = str.split('\t');
  if (parts.length >= 2) {
    return {
      id: normalise(parts[0].trim()),
      shortName: parts[1].trim() + (parts[2] ? parts[2].trim() : '')
    };
  } else {
    return null;
  }
}

function splitNames(obj) {
  var parts = obj.shortName.split('#');
  if (parts.length === 2) {
    return {
      id: obj.id,
      shortName: parts[0].trim(),
      name: parts[1].trim()
    };
  } else {
    return obj;
  }
}

function normalise(str) {
  return str.replace(/-/g, '')
            .replace(/:/g, '')
            .toUpperCase();
}

function createRecord(line) {
  // var parts = /([0-9A-Z:]{8})\t([@\w&]+)(\s+# (.*))?/.exec(line);
  var idAndName = splitIdAndName(line);
  if (idAndName) {
    var props = splitNames(idAndName);
    return db.models.Manufacturer.create(props);
  } else {
    console.error('Error with line', line);
    errorCount++;
    return Promise.resolve();
  }
}
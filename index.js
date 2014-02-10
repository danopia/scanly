var spawn = require('child_process').spawn;

// list scanner devices
var getDevices = function (callback) {
  console.log('requesting a device list');
  var proc = spawn('scanimage', ['-f', '%d%n%v%n%m%n%t%n%i%n--scanly--%n']);
  
  // buffer output
  var output = '';
  proc.stdout.on('data', function (chunk) {
    output += chunk;
  }).setEncoding('utf8');
  
  proc.on('close', function (code) {
    if (code) {
      console.log('device listing crashed with code', code);
      callback(code);
      return;
    }
    
    // parse out our format
    var list = output.split('\n--scanly--\n');
    list.pop(); // drop the empty
    
    var devices = list.map(function (item) {
      var data = item.split('\n');
      return {
        name: data[0],
        vendor: data[1],
        model: data[2],
        type: data[3]};
    });
    
    console.log('sane listed', devices.length, 'devices');
    callback(null, devices);
  });
};

// test code
getDevices(function (err, devices) {
  console.log(devices);
});


var spawn = require('child_process').spawn;

// list scanner devices
exports.getDevices = function (callback) {
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

exports.scanPage = function (device, flags, incrback, callback) {
  console.log('starting a scan on', device.name, 'with', flags);
  
  if (!flags) flags = [];
  flags.push('-d');
  flags.push(device.name);
  
  var proc = spawn('scanimage', flags);
  
  var width, height, maxval, data, offset, perrow, reported;
  proc.stdout.once('data', function (head) {
    
    // strip out header
    var i, nls;
    for (i = 0, nls = 0; nls < 4; i++)
      if (head[i] == 10)
        nls++;
    
    var meta = head.slice(0, i).toString().split('\n');
    
    if (meta[0] != 'P6') {
      console.log('file is', meta[0], 'instead of P6');
    }
    
    var dims = meta[2].split(' ');
    width = +dims[0];
    height = +dims[1];
    maxval = +meta[3];
    
    console.log('scan (' + width + 'x' + height + ') output started');
    
    data = new Buffer(width * height * 3);
    perrow = width * 3;
    reported = 0;
    console.log('created', Math.round(width * height * 3 / 1024 / 1024 * 10) / 10, 'mb buffer');
    
    head.copy(data, 0, i);
    offset = head.length - i;
    
    proc.stdout.on('data', function (chunk) {
      chunk.copy(data, offset);
      offset += chunk.length;
      
      if (incrback) {
        var rows = [];
        while (reported + perrow <= offset) {
          rows.push(data.slice(reported, reported + perrow));
          reported += perrow;
        }
        
        if (rows.length) {
          incrback(rows, width, height, maxval);
        }
      }
      
      if (offset == data.length) {
        console.log('scan complete');
        callback(data, width, height, maxval);
      }
    });
    
    proc.on('close', function (code) {
      if (code) {
        console.log('scan crashed with code', code);
        callback(code);
        return;
      }
      
      if (offset != data.length) {
        console.log('scan completed without all data (!)');
        callback(data, width, height, maxval);
      }
    });
  });
  
  
};

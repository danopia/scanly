// fake backend with a few different "scanners"

// list scanner devices
exports.getDevices = function (callback) {
  callback(null, [
    {
      name: 'gray',
      vendor: 'Scanly',
      model: 'Gray',
      type: 'test scanner'
    },{
      name: 'stripes',
      vendor: 'Scanly',
      model: 'RGB Stripe',
      type: 'test scanner'
    },{
      name: 'random',
      vendor: 'Scanly',
      model: 'Random Pixel',
      type: 'test scanner'
    },{
      name: 'noise',
      vendor: 'Scanly',
      model: 'Noisy Image',
      type: 'test scanner'
    },{
      name: 'ram',
      vendor: 'Scanly',
      model: 'Straight from RAM',
      type: 'test scanner'
    },{
      name: 'broken',
      vendor: 'Scanly',
      model: 'Out of Order',
      type: 'test scanner'
    }
  ]);
};

var pageSize = {width: 638, height: 877};
exports.scanPage = function (device, flags, startback, incrback, callback) {
  device = device.name || device;
  console.log('starting a scan on', device, 'with', flags);
  
  if (startback) {
    startback(pageSize.width, pageSize.height, 255);
  }
  
  if (device == 'broken') {
    console.log('scan crashed with code 3');
    callback(3);
    return;
  }
  
  var data = new Buffer(pageSize.width * pageSize.height * 3);
  var perrow = pageSize.width * 3;
  var reported = 0;
  console.log('created', Math.round(data.length / 1024 / 1024 * 10) / 10, 'mb buffer');
  
  var timer = setInterval(function () {
    var thistime = Math.floor(Math.random() * 25);
    if (reported + thistime > pageSize.height) {
      thistime = pageSize.height - reported;
    }
    
    console.log('faking', thistime, 'rows');
    
    var r = Math.floor(Math.random() * 2) * 255;
    var g = Math.floor(Math.random() * 2) * 255;
    var b = Math.floor(Math.random() * 2) * 255;
    
    var i = reported * pageSize.width * 3;
    var j = i + (thistime * pageSize.width * 3);
    var k;
    for (k = i; k < j; k += 3) {
      if (device == 'gray') {
        data[k  ] = 126;
        data[k+1] = 126;
        data[k+2] = 126;
      } else if (device == 'stripes') {
        data[k  ] = r;
        data[k+1] = g;
        data[k+2] = b;
      } else if (device == 'random') {
        data[k  ] = Math.floor(Math.random() * 255);
        data[k+1] = Math.floor(Math.random() * 255);
        data[k+2] = Math.floor(Math.random() * 255);
      } else if (device == 'noise') {
        var noise = 140 + Math.floor(Math.random() * 40);
        data[k  ] = noise + Math.floor(Math.random() * 10);
        data[k+1] = noise + Math.floor(Math.random() * 10);
        data[k+2] = noise + Math.floor(Math.random() * 10);
      }
    }
    
    if (incrback) {
      var rows = [];
      k = i;
      while (k < j) {
        rows.push(data.slice(k, k + perrow));
        k += perrow;
      }
      
      if (rows.length) {
        incrback(rows);
      }
    }
    
    reported += thistime;
    if (reported == pageSize.height) {
      console.log('scan completed');
      clearInterval(timer);
      callback(null, data);
    }
  }, 100);
};

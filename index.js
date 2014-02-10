var sane = require('./sane');

// test code
sane.getDevices(function (err, devices) {
  var device = devices[devices.length - 1];
  
  sane.scanPage(device, [], null, function (data, width, height, maxval) {
    console.log('got data');
  });
});


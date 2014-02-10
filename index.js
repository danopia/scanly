var sane = require('./sane');

// test code
sane.getDevices(function (err, devices) {
  console.log(devices);
});


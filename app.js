var sane = require('./sane');
var Jpeg = require('jpeg').Jpeg;
var fs   = require('fs');

var devices = {scanners: []};
sane.getDevices(function (err, scanners) {
  devices.scanners = scanners;
});

var express = require('express');
var app  = express();
var http = require('http').createServer(app)
var io   = require('socket.io').listen(http, {log: false});

app.use(express.logger());
app.use(express.static(__dirname + '/public'));

io.sockets.on('connection', function (socket) {
  console.log('socket connection from', socket.handshake.address.address);
  socket.emit('devices', devices);
  
  socket.on('scan', function (req) {
    socket.emit('scan', {id: req.id, status: 'waiting'});
    
    var size;
    sane.scanPage(req.scanner, req.flags, function (width, height, maxval) {
      size = {width: width, height: height};
      socket.emit('scan', {id: req.id, status: 'starting', size: size, maxval: maxval});
    }, function (lines) {
      socket.emit('scan', {id: req.id, status: 'progress', lines: lines});
    }, function (err, data) {
      if (err) {
        socket.emit('scan', {id: req.id, status: 'error', code: err});
        return;
      }
      socket.emit('scan', {id: req.id, status: 'complete'});
      
      var jpg = new Jpeg(data, size.width, size.height);
      jpg.setQuality(90);
      jpg.encode(function (image, error) {
        socket.emit('scan', {id: req.id, status: 'encoded', size: image.length});
        
        var filename = Math.random().toString().slice(2, 10) + '.jpg';
        fs.writeFile('pages/' + filename, image, function (err) {
          if (err) {
            console.log('Error writing out jpg file');
            return;
          }
          
          socket.emit('scan', {id: req.id, status: 'saved', file: filename});
        });
      });
    });
  });
});

http.listen(3000, '::', function () {
  console.log('Listening on port 3000, http://localhost:3000/');
});


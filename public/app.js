$(function () {
  $.socket = io.connect();
  
  $.socket.on('devices', function (data) {
    console.log('Got', data.scanners.length, 'scanners');
    $.devices = data.scanners;
    
    var selected = $('#device :selected').val();
    $('#device').empty();
    var i;
    for (i = 0; i < $.devices.length; i++) {
      var $option = $('<option>', {value: $.devices[i].name});
      $option.text($.devices[i].vendor + ' ' + $.devices[i].model + ' ' + $.devices[i].type);
      
      if ($.devices[i].name == selected) {
        $option.attr('selected', true);
      }
      
      $('#device').append($option);
    }
  });
  
  $.socket.on('scan', function (data) {
    console.log(data);
    
    if (data.status == 'starting') {
      $.canvas = $('<canvas>');
      $.canvas.addClass('progress-page');
      $.canvas.addClass('page');
      $.canvas[0].width = data.size.width;
      $.canvas[0].height = data.size.height;
      $('#pages').append($.canvas);
      
      $.ctx = $.canvas[0].getContext('2d');
      $.line = $.ctx.createImageData(data.size.width, 1);
      
      $.row = 0;
      $.size = data.size;
    } else if (data.status == 'progress') {
      while (data.lines.length) {
        var line = data.lines.shift();
        var i;
        for (i = 0; i < line.length / 3; i++) {
          $.line.data[i*4+0] = line[i*3+0];
          $.line.data[i*4+1] = line[i*3+1];
          $.line.data[i*4+2] = line[i*3+2];
          $.line.data[i*4+3] = 255;
        }
        
        $.ctx.putImageData($.line, 0, $.row);
        $.row++;
      }
    } else if (data.status == 'complete') {
      var png = $.canvas[0].toDataURL();
      $.canvas.remove();
      $.canvas = $.ctx = $.line = null;
      
      var $img = $('<img>', {src: png});
      $img.addClass('page');
      $('#pages').append($img);
    }
  });
  
  $('#scan-single').click(function () {
    $.socket.emit('scan', {id: 3, flags: ['--mode', 'Color'], scanner: $('#device :selected').val()}); // , '--resolution', '150'
  });
});

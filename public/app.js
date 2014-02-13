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
    if (data.status == 'waiting') {
      $.canvas = $('<canvas>');
      $.canvas.addClass('waiting-page');
      $.canvas.addClass('page');
      $('#pages').append($.canvas);
      
      $('#pages').animate({
        scrollLeft: $.canvas.offset().left + $.canvas.width() + $('#pages').scrollLeft()
      }, 500);
    } else if (data.status == 'starting') {
      $.canvas[0].width = data.size.width;
      $.canvas[0].height = data.size.height;
      $.canvas.removeClass('waiting-page');
      $.canvas.addClass('progress-page');
      
      $.ctx = $.canvas[0].getContext('2d');
      $.line = $.ctx.createImageData(data.size.width, 1);
      
      $.redline = $.ctx.createImageData(data.size.width, 1);
      var i;
      for (i = 0; i < data.size.width; i++) {
        $.redline.data[i*4+0] = 255;
        $.redline.data[i*4+1] = 0;
        $.redline.data[i*4+2] = 0;
        $.redline.data[i*4+3] = 255;
      }
      
      $.row = 0;
      $.size = data.size;
      
      $('#pages').animate({
        scrollLeft: $.canvas.offset().left + $.canvas.width() + $('#pages').scrollLeft()
      }, 500);
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
      $.ctx.putImageData($.redline, 0, $.row);
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

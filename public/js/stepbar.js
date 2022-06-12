(function($) {

  var fillCircle = function(x, y, s, color, ctx) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, s / 2, 0, Math.PI * 2);
    ctx.fill();
  };

  $.fn.stepbar = function(opts) {
    var items = opts.items || [];
    var color = opts.color || '#ccc';
    var fontColor = opts.fontColor || '#000';
    var textColor = opts.textColor || '#000';
    var selectedColor = opts.selectedColor || '#0000FF';
    var selectedFontColor = opts.selectedFontColor || '#FFF';
    var current = opts.current || 1;
    
    var stepBulletSize = 40;
    var fontSize = 12;

    var me = $(this);
    var w = me.width();

    var canvas = document.createElement('canvas');
    $(canvas).appendTo(me);

    var layer1 = canvas.getContext('2d');

    var canvas2 = document.createElement('canvas');
    var layer2 = canvas2.getContext('2d');

    $([canvas, canvas2]).each(function() {
      $(this).attr('width', w);
      $(this).attr('height', 80);
    });
    var stepSize = Math.floor(w / items.length); 
    var stepMiddle = Math.floor(stepSize / 2);

    for(var i = 0; i < items.length; i++) {
      var thisX = (i * stepSize) + stepMiddle;
      var thisY = 20;

      // Draw the bullet
      // Background
      fillCircle(thisX, thisY, stepBulletSize, color, layer2);
      layer2.fillStyle = fontColor;

      // Draw lines
      var lineHeight = stepBulletSize / 8;
      var lineWidth = Math.ceil(stepSize / 2);
      var lineTop = thisY - (lineHeight / 2);

      var lineLeft = thisX - lineWidth;
      var lineRight = thisX;

      var selectedLineDelta = lineHeight * 0;
      var selectedLineTop = lineTop + selectedLineDelta / 2;
  
      // Left
      // if(i != 0) {//左边无进度条(除第一个外 左边都有线条)
        layer1.fillStyle = color;
        layer1.fillRect(lineLeft, lineTop, lineWidth, lineHeight);

        if(i < current) {
          layer2.fillStyle = selectedColor;
          layer2.fillRect(lineLeft, selectedLineTop , lineWidth, lineHeight - selectedLineDelta);
        }
      // }

      //Right 
      // if(i < items.length - 1) {//右边无进度条 
        layer1.fillStyle = color;
        layer1.fillRect(lineRight, lineTop, lineWidth, lineHeight);

        if(current == items.length){//进度完成时，右边线条全部都变色，否则当前进度的右侧线条不变色，当前进度左侧线条全变色
          layer2.fillStyle = selectedColor;
          layer2.fillRect(lineRight, selectedLineTop , lineWidth, lineHeight - selectedLineDelta);
        }else{
          if(i < current -1 ) {
            layer2.fillStyle = selectedColor;
            layer2.fillRect(lineRight, selectedLineTop , lineWidth, lineHeight - selectedLineDelta);
          }
        }
      // }

      // Draw selected bullet
      if(i < current) {
        fillCircle(thisX, thisY, stepBulletSize , selectedColor, layer2);
        layer2.fillStyle = selectedFontColor;
      }

      // Text and number
      layer2.font = fontSize + 'px Arial';
      //当前步骤之前的，圆圈中显示对勾（√）
      if(i < current-1){
        var iLabel = ('\✔') + '';
      }else{
        iLabel = (i + 1) + '';
      }
      var metrics = layer2.measureText(iLabel);

      layer2.fillText(iLabel, thisX - (metrics.width / 2), thisY + (fontSize / 2));
      
      layer2.font = 'bold ' + fontSize + 'px Arial';
      var metrics = layer2.measureText(items[i]);
      layer2.fillStyle = textColor;
      layer2.fillText(items[i], thisX - (metrics.width / 2), thisY + fontSize + (stepBulletSize / 1.2));
    }
    layer1.drawImage(canvas2, 0, 0);

  };
})(jQuery);

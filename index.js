var five = require('johnny-five'),
    board, r, myLed, myServo;

var http = require('http');
var server = http.createServer(function handler(req, res) {
  require('fs').readFile('index.html', function (err, data) {
    res.writeHead(200, {
      'content-type': 'text/html'
    });
    res.end(data);
  });
});

var io = require('socket.io')(server);

var userSocket; // :(
io.on('connection', function(socket){
  userSocket = socket;
  console.log('a user connected');
});

server.listen(3000, function() {
  console.log('listening on *:3000');
});

board = new five.Board();
board.on('ready', function() {

  myServo = new five.Servo(9);
  myServo.center();

  r = ['A0', 'A1'].map(function(pin) {
    return new five.Sensor({
      pin: pin,
      freq: 20
    });
  });

  var bValues = [0, 0], deg = 90;
  r.forEach(function(pr, i) {
    pr.on('read', function(err, value) {

      var bValue = value;

      // five.Fn.constrain(
      //   five.Fn.map(value, 0, 900, 0, 255), 0, 255);

      bValue = Math.floor(bValue)

      if (bValues[i] !== bValue && userSocket) {
        userSocket.emit('values', bValues.concat([bValues[1] - bValues[0]]));
      }

      bValues[i] = bValue;
      var diff = bValues[1] - bValues[0];

      var newDeg = five.Fn.constrain(
        five.Fn.map(diff, -300, 300, 15, 160), 16, 160);

      if (deg > newDeg + 1 || deg < newDeg - 1) {
        deg = newDeg;
        myServo.to(deg);
      }

      process.stdout.write(
        bValues[0] + ' ' + bValues[1] + ' '
        + diff + ' ' + deg + '   \r');

    });
  });
});

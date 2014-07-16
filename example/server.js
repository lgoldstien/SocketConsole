var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);

app.get('/', function(req, res){
  res.sendfile('../SocketConsole/example/index.html');
});

io.on('connection', function(socket){
  socket.on('console', function(msg){
    console.log(msg);
  });
});

http.listen(3000, function(){
  console.log('listening on *:3000');
});

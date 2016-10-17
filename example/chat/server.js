const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const io = require('socket.io')(server);
const path = require('path');
const bodyParser = require('body-parser');

let numClients = 0;

io.on('connection', (socket) => {
  socket.on('join_room', (roomName, respond) => {
    numClients = io.sockets.adapter.rooms[roomName] ?
      io.sockets.adapter.rooms[roomName].length : 0;
    if (numClients < 2) {
      socket.join(roomName);
      respond(numClients + 1);
    } else {
      socket.emit('room_full', roomName);
      respond('full');
    }
  });

  socket.on('create_room', (roomName, respond) => {
    if (io.sockets.adapter.rooms[roomName]) {
      respond('exists');
    } else {
      socket.join(roomName);
      respond('created');
    }
  });

  socket.on('remote candidate', (info) => {
    console.log('in socket remote candidate');
    const { roomName, candidate } = info;
    socket.broadcast.to(roomName).emit('remote candidate', candidate);
  });

  socket.on('offer', (sessionDesc, roomName) => {
    console.log('in socket offer');
    socket.broadcast.to(roomName).emit('offer', sessionDesc);
  });

  socket.on('answer', (sessionDesc, roomName) => {
    console.log('in socket answer');
    socket.broadcast.to(roomName).emit('answer', sessionDesc);
  });
});

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use(express.static(__dirname));

app.get('/', (req, res) => {
  res.sendFile(path.join(`${__dirname}/index.html`));
});

server.listen(3000, () => {
  console.log('listnin on 3k');
});

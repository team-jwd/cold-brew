/* eslint import/newline-after-import: 0 */
const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const io = require('socket.io')(server);
const path = require('path');

let numClients = 0;
io.on('connection', (socket) => {
  socket.on('join', (respond) => {
    numClients++;
    respond(numClients);
  });

  socket.on('send ice candidate', (candidate) => {
    socket.broadcast.emit('receive ice candidate', candidate);
  });

  socket.on('send offer', (offer) => {
    socket.broadcast.emit('receive offer', offer);
  });

  socket.on('send answer', (answer) => {
    socket.broadcast.emit('receive answer', answer);
  });

  socket.on('leave page', () => {
    numClients--;
  });
});

app.use(express.static(__dirname));

app.get('/', (req, res) => {
  res.sendFile(path.join(`${__dirname}/index.html`));
});

server.listen(3000, () => {
  console.log('listnin on 3k');
});

module.exports = {
  resetNumClients: function (num) {
    numClients = num;
  },
}

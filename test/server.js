const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const io = require('socket.io')(server);
const path = require('path');
const bodyParser = require('body-parser');

let numClients = 0;

io.on('connection', (socket) => {
  numClients++;
  socket.emit('joined', numClients);
  socket.on('left', () => {
    numClients--;
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

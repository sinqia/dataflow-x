const express = require('express');
const http = require('http');
const path = require('path');
const bodyParser = require('body-parser');
const routes = require('./routes/index');
const initializeSocket = require('./socket');

const app = express();
const port = process.env.PORT || 3000;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname, '../public')));

app.use('/api', routes);

const server = http.createServer(app);
const io = initializeSocket(server);

app.set('socketio', io);

server.listen(port, () => {
    console.log(`Servidor rodando na porta http://localhost:${port}`);
});

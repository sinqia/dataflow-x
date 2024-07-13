const socketIO = require('socket.io');

function initializeSocket(server) {
    const io = socketIO(server);

    io.on('connection', (socket) => {
        console.log('Novo cliente conectado');

        socket.on('disconnect', () => {
            console.log('Cliente desconectado');
        });
    });

    return io;
}

module.exports = initializeSocket;

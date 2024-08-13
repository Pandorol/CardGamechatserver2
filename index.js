// Setup basic express server
const express = require('express');
const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server);
const port = process.env.PORT || 3000;
const { instrument } = require("@socket.io/admin-ui");

instrument(io, {
    auth: false
});
server.listen(port, () => {
    console.log('Server listening at port %d', port);
});


// Chatroom

let numUsers = 0;

io.on('connection', (socket) => {

    ++numUsers;

    io.emit('message', {
        cmd: 3,
        numUsers: numUsers
    });
    socket.on('message', (data) => {
        socket.emit('message', {
            cmd: 2,
            username: data.username,
            message: data.message
        });
    });

    socket.on('disconnect', () => {
        --numUsers;
        socket.broadcast.emit('message', {
            cmd: 3,
            numUsers: numUsers
        });
    });
});

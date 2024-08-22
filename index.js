// Setup basic express server
const express = require('express');
const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server);
const port = process.env.PORT || 3000;
const { instrument } = require("@socket.io/admin-ui");
const { createAdapter } = require("@socket.io/redis-adapter");
const { createClient } = require("redis");

const pubClient = createClient({ url: "redis://8.138.172.203:6379" });
const subClient = pubClient.duplicate();

server.listen(port, () => {
    console.log('Server listening at port %d', port);
});

(async () => {
    try {
        await Promise.all([pubClient.connect(), subClient.connect()]);
        io.adapter(createAdapter(pubClient, subClient));
        instrument(io, { auth: false });
        console.log(`使用 Redis 适配器的 Socket.IO 服务器已在端口 ${port} 上初始化`);
    } catch (err) {
        console.error("Redis 连接失败：", err);
    }
})();




// Chatroom

let numUsers = 0;

io.on('connection', (socket) => {

    ++numUsers;

    io.emit('message', {
        cmd: 3,
        numUsers: numUsers
    });
    socket.on('message', (data) => {
        io.emit('message', {
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
    socket.on("global", (data) => {
        socket.emit('message', data);
    });
});

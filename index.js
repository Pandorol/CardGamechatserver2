// Setup basic express server


const Cmd = require("./cmd")
const actions = require("./actions")
const express = require('express');
const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server);
const port = process.env.PORT || 3000;
const { instrument } = require("@socket.io/admin-ui");
const { createAdapter } = require("@socket.io/redis-adapter");
const { createClient } = require("redis");
var mysql = require('mysql');
// var db = mysql.createPool({
//     host: '8.138.172.203',
//     user: 'chatdb',
//     password: '4mcAm5CbcirJKxmm',
//     database: 'chatdb'
// });
var db = mysql.createPool({
    host: '8.138.172.203',
    user: 'poster',
    password: 'w8ecc7BLfAfX6ZCK',
    database: 'poster'
});
const pubClient = createClient({ url: "redis://8.138.172.203:6379" });
const subClient = pubClient.duplicate();
global.datacli = pubClient
global.db = db





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
    socket.userid = socket.handshake.query.userid;
    ++numUsers;
    actions.SendLoginDatas(socket)
    io.emit('message', {
        cmd: 3,
        numUsers: numUsers
    });
    socket.on('message', (data) => {
        if (data.cmd == Cmd.ChatMsg) {
            io.emit('message', {
                cmd: Cmd.ChatMsg,
                username: data.username,
                message: data.message
            });
        }
        else if (data.cmd == Cmd.GetRoomlist) {

            actions.asyncgetroomlistfunc(socket)
        }
        else if (data.cmd == Cmd.GetIsAct) {

            actions.asyncGetIsActfunc(socket)
        }
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

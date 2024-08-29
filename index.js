// Setup basic express server

var Cmd = {
    test1: 1,
    ChatMsg: 2,
    ChatNumUsers: 3,
    GetRoomlist: 4,
    GetIsAct: 5,
}

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

var asyncgetroomlistfunc = async (socket) => {
    try {
        const rooms = await pubClient.hGetAll("rooms"); // 获取所有房间数据
        const roomList = Object.keys(rooms).map(roomId => JSON.parse(rooms[roomId])); // 解析房间数据
        socket.emit('message', { cmd: Cmd.GetRoomlist, roomList: roomList, code: 0 })
    }
    catch (err) {
        console.log(err)
        socket.emit('message', { cmd: Cmd.GetRoomlist, roomList: [], code: 1 })
    }
}
var asyncGetIsActfunc = async (socket) => {
    try {
        let userdata = await pubClient.get(socket.userid)

        if (userdata) {
            socket.emit('message', { cmd: Cmd.GetIsAct, playerdata: JSON.parse(userdata) })
        }
    }
    catch (err) {
        console.log(err)
        socket.emit('message', { cmd: Cmd.GetIsAct, code: 1 })
    }
}

// Chatroom

let numUsers = 0;

io.on('connection', (socket) => {
    socket.userid = socket.handshake.query.userid;
    ++numUsers;

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

            asyncgetroomlistfunc(socket)
        }
        else if (data.cmd == Cmd.GetIsAct) {

            asyncGetIsActfunc(socket)
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

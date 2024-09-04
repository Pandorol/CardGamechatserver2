const redis = require("./redismgr")
const Cmd = require("./cmd")
module.exports = {
    async asyncgetroomlistfunc(socket) {
        try {
            const rooms = await redis.hgetall("rooms"); // 获取所有房间数据
            const roomList = Object.keys(rooms).map(roomId => JSON.parse(rooms[roomId])); // 解析房间数据
            socket.emit('message', { cmd: Cmd.GetRoomlist, roomList: roomList, code: 0 })
        }
        catch (err) {
            console.log(err)
            socket.emit('message', { cmd: Cmd.GetRoomlist, roomList: [], code: 1 })
        }
    },
    async asyncGetIsActfunc(socket) {
        try {
            let userdata = await redis.get(socket.userid)

            if (userdata) {
                socket.emit('message', { cmd: Cmd.GetIsAct, playerdata: JSON.parse(userdata) })
            }
        }
        catch (err) {
            console.log(err)
            socket.emit('message', { cmd: Cmd.GetIsAct, code: 1 })
        }
    },
    SendLoginDatas(socket) {
        var sql = 'SELECT * FROM logindatas WHERE userid = ? ';

        // 执行查询，使用参数化查询防止 SQL 注入
        db.query(sql, [socket.userid], function (err, results) {
            if (err) {
                console.log({ msg: '查询失败: ' + err.stack });

                return;
            }
            //console.log(results[0])
            socket.emit('message', { cmd: Cmd.LoginDatas, logindatas: results[0] })
        });
    }
}
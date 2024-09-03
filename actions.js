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
    }
}
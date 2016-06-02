var express = require('express'),
    app = express(),
    server = require('http').createServer(app),
    io = require('socket.io').listen(server),
    users = [];     //用户数组
app.use('/', express.static(__dirname + '/www'));
// server.listen(process.env.PORT || 8888);
server.listen(8888);
io.sockets.on('connection', function(socket) {
    //监听用户登陆
    socket.on('login', function(nickname) {
        if (users.indexOf(nickname) > -1) {
            socket.emit('nickExisted');
        } else {
            // socket.userIndex = users.indexOf(nickname);
            socket.nickname = nickname;
            users.push(nickname);
            socket.emit('loginSuccess');
            io.sockets.emit('system', nickname, users.length, 'login', users);
        };
    });
    //监听用户登出或断线
    socket.on('disconnect', function() {
        var userIndex = users.indexOf(socket.nickname);
        users.splice(userIndex, 1);
        socket.broadcast.emit('system', socket.nickname, users.length, 'logout', users);
    });
    //监听获取信息
    socket.on('postMsg', function(msg, color) {
        socket.broadcast.emit('newMsg', socket.nickname, msg, color);
    });
    //监听获取图片
    socket.on('img', function(imgData, color) {
        socket.broadcast.emit('newImg', socket.nickname, imgData, color);
    });
});
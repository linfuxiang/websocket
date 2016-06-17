window.onload = function() {
    /* 实例化lfxChat函数对象 */
    var chatRoom = new lfxChat();
    /* 初始化操作 */
    chatRoom.init();
};
var lfxChat = function() {
    this.socket = null;
};
lfxChat.prototype = {
    /* 初始化函数 */
    init: function() {
        var that = this;
        /* 连接服务器 */
        this.socket = io.connect();
        /** 
         *  监听websocket事件 
         */
        this.socket.on('connect', function() {
            document.getElementById('info').textContent = '请输入昵称：';
            document.getElementById('nickWrapper').style.display = 'block';
            document.getElementById('nicknameInput').focus();
        });
        this.socket.on('nickExisted', function() {
            document.getElementById('info').textContent = '昵称已存在，请输入新的昵称';
        });
        this.socket.on('loginSuccess', function() {
            document.title = '聊天室 - ' + document.getElementById('nicknameInput').value;
            document.getElementById('loginWrapper').style.display = 'none';
            document.getElementById('messageInput').focus();
        });
        this.socket.on('error', function(err) {
            if(document.getElementById('loginWrapper').style.display == 'none'){
                document.getElementById('status').textContent = '连接服务器失败';
            } 
            else {
                document.getElementById('info').textContent = '连接服务器失败';
            }
        });
        this.socket.on('system', function(nickName, userCount, type, users) {
            var msg = nickName + (type == 'login' ? ' 加入' : ' 离开');
            that._displayNewMsg('系统 ', msg, 'red');
            document.getElementById('status').textContent = userCount + '个用户在线';
            /* 修改聊天室名称 */
            var nameList = document.getElementsByClassName('nameList')[0];
            var sideBarList = document.getElementById("sidebar");
                // li = document.createElement('li');
            nameList.textContent = users[0];
            sideBarList.innerHTML = '<li>' + users[0] + '</li>';
            console.log(users);
            for(var n=1; n<users.length; n++){
                nameList.textContent = nameList.textContent + '、' + users[n];
                sideBarList.innerHTML = sideBarList.innerHTML + ('<li>' + users[n] + '</li>');
            }   
        });
        this.socket.on('newMsg', function(user, msg, color) {
            that._displayNewMsg(user, msg, color);
        });
        this.socket.on('newFile', function(user, img, color, type, name) {
            that._displayFile(user, img, color, type, name);
        });
        /** 
         *  绑定各类事件 
         */
        document.getElementById('loginBtn').addEventListener('click', function() {
            var nickName = document.getElementById('nicknameInput').value;
            if(nickName.trim().length != 0){
                that.socket.emit('login', nickName);
            } else {
                document.getElementById('nicknameInput').focus();
            };
        }, false);
        document.getElementById('nicknameInput').addEventListener('keyup', function(e) {
            if (e.keyCode == 13) {
                var nickName = document.getElementById('nicknameInput').value;
                if (nickName.trim().length != 0) {
                    that.socket.emit('login', nickName);
                };
            };
        }, false);
        document.getElementById('sendBtn').addEventListener('click', function() {
            var messageInput = document.getElementById('messageInput'),
                msg = messageInput.value,
                color = document.getElementById('colorStyle').value;
            messageInput.value = '';
            messageInput.focus();
            if (msg.trim().length != 0) {
                that.socket.emit('postMsg', msg, color);
                that._displayNewMsg('我', msg, color);
                return;
            };
        }, false);
        document.getElementById('messageInput').addEventListener('keyup', function(e) {
            var messageInput = document.getElementById('messageInput'),
                msg = messageInput.value,
                color = document.getElementById('colorStyle').value;
            if (e.keyCode == 13 && msg.trim().length != 0) {
                messageInput.value = '';
                that.socket.emit('postMsg', msg, color);
                that._displayNewMsg('我', msg, color);
            };
        }, false);
        document.getElementById('clearBtn').addEventListener('click', function() {
            document.getElementById('historyMsg').innerHTML = '';
        }, false);
        document.getElementById('sendFile').addEventListener('change', function() {
            if (this.files.length != 0) {
                var file = this.files[0],
                    reader = new FileReader(),
                    color = document.getElementById('colorStyle').value,
                    fileType = file.name.split('.').pop();
                    console.log(fileType);
                if (!reader) {
                    that._displayNewMsg('系统', '你的浏览器不支持文件发送', 'red');
                    this.value = '';
                    return;
                };
                reader.onload = function(e) {
                    // console.log(this);
                    this.value = '';
                    that.socket.emit('file', e.target.result, color, fileType, file.name);
                    that._displayFile('我', e.target.result, color, fileType, file.name);
                };
                reader.readAsDataURL(file);
            };
        }, false);
        document.getElementById('sendImage').addEventListener('change', function() {
            if (this.files.length != 0) {
                var file = this.files[0],
                    reader = new FileReader(),
                    color = document.getElementById('colorStyle').value,
                    fileType = file.name.split('.').pop();
                    console.log(fileType);
                if (!reader) {
                    that._displayNewMsg('系统', '你的浏览器不支持文件发送', 'red');
                    this.value = '';
                    return;
                };
                reader.onload = function(e) {
                    // console.log(this);
                    this.value = '';
                    that.socket.emit('file', e.target.result, color, fileType, file.name);
                    that._displayFile('我', e.target.result, color, fileType, file.name);
                };
                reader.readAsDataURL(file);
            };
        }, false);
        this._initialEmoji();
        document.getElementById('emoji').addEventListener('click', function(e) {
            var emojiwrapper = document.getElementById('emojiWrapper');
            emojiwrapper.style.display = 'block';
            e.stopPropagation();
        }, false);
        document.body.addEventListener('click', function(e) {
            var emojiwrapper = document.getElementById('emojiWrapper');
            if (e.target != emojiwrapper) {
                emojiwrapper.style.display = 'none';
            };
        });
        document.getElementById('emojiWrapper').addEventListener('click', function(e) {
            var target = e.target;
            if (target.nodeName.toLowerCase() == 'img') {
                var messageInput = document.getElementById('messageInput');
                messageInput.focus();
                messageInput.value = messageInput.value + '[emoji:' + target.title + ']';
            };
        }, false);
    },
    _initialEmoji: function() {
        var emojiContainer = document.getElementById('emojiWrapper'),
            docFragment = document.createDocumentFragment();
        for (var i = 15; i > 0; i--) {
            var emojiItem = document.createElement('img');
            emojiItem.src = '../img/emoji/' + i + '.gif';
            emojiItem.title = i;
            docFragment.appendChild(emojiItem);
        };
        emojiContainer.appendChild(docFragment);
    },
    _displayNewMsg: function(user, msg, color) {
        var container = document.getElementById('historyMsg'),
            msgToDisplay = document.createElement('p'),
            date = new Date().toTimeString().substr(0, 8),
            //determine whether the msg contains emoji
            msg = this._showEmoji(msg);
        if(user == '我'){
            msgToDisplay.setAttribute('class', 'myMsg');
        }
        msgToDisplay.style.color = color || '#000';
        msgToDisplay.innerHTML = user + '<span class="timespan">(' + date + '): </span>' + msg;
        container.appendChild(msgToDisplay);
        container.scrollTop = container.scrollHeight;
    },
    _displayFile: function(user, fileData, color, type, name) {
        var container = document.getElementById('historyMsg'),
            msgToDisplay = document.createElement('p'),
            date = new Date().toTimeString().substr(0, 8),
            fileDiv;
        if(user == '我'){
            msgToDisplay.setAttribute('class', 'myMsg');
        }
        if(type == 'png' || type == 'jpg' || type == 'jpeg' || type =='gif'){
            msgToDisplay.innerHTML = user + '<span class="timespan">(' + date + '): </span> <br/>' + '<a href="' + fileData + '" target="_blank"><img src="' + fileData + '"/></a>';
            container.appendChild(msgToDisplay);
            container.scrollTop = container.scrollHeight;
        }
        else{
            fileDiv = '<div class="fileDiv">' + name + '<img src="img/download.png" class="download"></div>';
            msgToDisplay.innerHTML = user + '<span class="timespan">(' + date + '): </span> <br/>' + '<a href="' + fileData + '" target="_blank">' + fileDiv + '</a>';
            container.appendChild(msgToDisplay);
            container.scrollTop = container.scrollHeight;
        }
        
    },
    _showEmoji: function(msg){
        var match, result = msg,
            reg = /\[emoji:\d+\]/g,
            emojiIndex,
            totalEmojiNum = document.getElementById('emojiWrapper').children.length;
        while (match = reg.exec(msg)) {
            emojiIndex = match[0].slice(7, -1);
            if (emojiIndex > totalEmojiNum) {
                result = result.replace(match[0], '[X]');
            } else {
                result = result.replace(match[0], '<img class="emoji" src="../img/emoji/' + emojiIndex + '.gif" />');//todo:fix this in chrome it will cause a new request for the image
            };
        };
        return result;
    }
};

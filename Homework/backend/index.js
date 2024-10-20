const express = require('express');
const cors = require('cors');
const socketIo = require('socket.io');
const http = require('node:http');

const app = express();
const serverHttp = http.createServer(app);
const io = socketIo(serverHttp, {
    cors: { origin: "*" }
});

const usersDb = [
    {
        id: 1,
        fullname: "test1",
        login: "test1",
        password: "test"
    },
    {
        id: 2,
        fullname: "test2",
        login: "test2",
        password: "test"
    }
]

app.use(cors());

app.get('/', (req, res) => {
    res.send('salom')
});

const onlineUsers = new Map();

io.on('connection', (socket) => {

    socket.on('login', ({ login, password }) => {
        const loginedUser = usersDb.find((user) => user.login === login && user.password === password);

        if (loginedUser) {
            onlineUsers.set(socket.id, loginedUser.id);


            const onlineUsersData = [];

            onlineUsers.forEach((dbId) => {
                const foundUser = usersDb.find((u) => u.id === dbId);
                if (foundUser) {
                    onlineUsersData.push(foundUser);
                }
            })


            io.emit('online-users', { onlineUsers: onlineUsersData });
        }
    });

    socket.on('register', ({ id, fullName, login, password }) => {
        let newUser = { id, fullName, login, password };
        newUser.id = Number(newUser.id);
        console.log(newUser);

        usersDb.push(newUser);
        console.log(usersDb);

        onlineUsers.set(socket.id, newUser.id);

        const onlineUsersData = [];

        onlineUsers.forEach((dbId) => {
            const foundUser = usersDb.find((u) => u.id === dbId);
            if (foundUser) {
                onlineUsersData.push(foundUser);
            }
        });


        io.emit('online-users', { onlineUsers: onlineUsersData });
    })

    const onlineUsersData = [];

    onlineUsers.forEach((dbId) => {
        const foundUser = usersDb.find((u) => u.id === dbId);
        if (foundUser) {
            onlineUsersData.push(foundUser);
        }
    })


    io.emit('online-users', { onlineUsers: onlineUsersData });
    // onlineUsers.add(socket.id);

    socket.on('send-message', (data) => {
        //io.emit('new-message', data); //barchaga jo'natish
        //socket.broadcast.emit('new-message', data); ///o'zidan boshqa barcha uchun

        if (!data.userId) {
            io.emit('new-message', data.data);
        }

        onlineUsers.forEach((dbId, sockedId) => {
            if (dbId === Number(data.userId)) {
                io.to(sockedId).emit('new-message', data.data);
            }
        })
    });

    socket.on('disconnect', () => {
        onlineUsers.delete(socket.id);
    });
});

serverHttp.listen(8000, () => {
    console.log('http://localhost:8000');
});
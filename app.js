var express = require('express');
var app = express();
app.use(express.static('public'));
var http = require('http').Server(app);
var io = require('socket.io')(http);
var port = process.env.PORT || 3000;

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/default.html');

});

io.on('connection', (socket) => {
    var roomId;
    socket.on('login', (name) => {
        console.log('Login: ' + name);

        socket.name = name;

        roomId = findAvailableRoom();

        if (roomId) {
            console.log('Joining room: ' + roomId);
            socket.emit('connected', socket.id); 

            var roomClients = Object.keys(io.sockets.adapter.rooms[roomId].sockets);
            var otherClient = io.sockets.sockets[roomClients[0]];

            socket.emit('new-client', otherClient.name, otherClient.id);

            socket.broadcast.to(roomId).emit('new-client', name, socket.id);
            
            socket.join(roomId);   
            io.sockets.in(roomId).emit('ready', roomId, socket.id);             
        } else {
            roomId = 'Room_' + socket.id;
            console.log('Creating room: ' + roomId);
            socket.join(roomId);  
            socket.emit('connected', socket.id);             
        }    

    });

    function findAvailableRoom() {
        var foundRoom = null;

        var rooms = Object.keys(io.sockets.adapter.rooms);
        
        for (var i=0; i < rooms.length && !foundRoom; i++) {
            var roomClients = io.sockets.adapter.rooms[rooms[i]];

            if (roomClients.length < 1) {
                // we shouldnt have empty rooms
            } else if (roomClients.length < 2 && rooms[i].startsWith('Room_')) {
                foundRoom = rooms[i];

                console.log('Found room: ' + foundRoom);
            }
        }

        return foundRoom;
    }

    socket.on('offer', (offer) => {
        console.log('offer: ' + offer);
        socket.broadcast.to(roomId).emit('offer', offer);
    });

    socket.on('answer', (answer) => {
        console.log('answer: ' + answer);
        
        socket.broadcast.to(roomId).emit('answer', answer);
    })

    socket.on('candidate', (candidate)  => {
        console.log('candidate: ' + candidate);
        
        socket.broadcast.to(roomId).emit('candidate', candidate);        
    });

    socket.emit('endcall', () => {
        // TBD
    });

    socket.on('disconnect', () => {
        console.log('disconnect: ' + socket.id);

        io.to(roomId).emit('bye');
    });

});

http.listen(port, () => {
    console.log('listening on *: ' + port);
});
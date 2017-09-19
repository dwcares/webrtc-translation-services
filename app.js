var express = require('express');
var app = express();
app.use(express.static('public'));
var http = require('http').Server(app);
var io = require('socket.io')(http);
var port = process.env.PORT || 3000;
var clients = [];

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/default.html');

});

io.on('connection', (socket) => {
    socket.on('login', (name) => {
        console.log('Login: ' + name);

        var numClients = clients.length;

        console.log(numClients + ' client(s)');

        if (numClients === 0) {
            console.log('Client ID ' + socket.id + ' connected');
            
            socket.emit('connected', socket.id); 

            socket.name = name;           
            clients.push(socket);

        } else if (numClients === 1) {
            console.log('Client ID ' + socket.id + ' connected');
            
            socket.emit('connected', socket.id);
            socket.emit('new-client', clients[0].name, clients[0].id);
            socket.broadcast.emit('new-client', name, socket.id);
            
            socket.name = name;           
            clients.push(socket);
            
            io.emit('ready');            
        } else { // max two clients
            socket.emit('full');
        }
    });

    socket.on('offer', (offer) => {
        console.log('offer: ' + offer);
        socket.broadcast.emit('offer', offer);
    });

    socket.on('answer', (answer) => {
        console.log('answer: ' + answer);
        
        socket.broadcast.emit('answer', answer);
    })

    socket.on('candidate', (candidate)  => {
        console.log('candidate: ' + candidate);
        
        socket.broadcast.emit('candidate', candidate);        
    });

    socket.on('disconnect', () => {
        console.log('disconnect: ' + socket.id);

        clients.splice(clients.indexOf(socket), 1);
        

        io.emit('bye');
    });

});

http.listen(port, () => {
    console.log('listening on *: ' + port);
});
const express = require('express');
const socket = require('socket.io');
const { v4: uuidv4 } = require('uuid');

const app = express();
const server = app.listen(3000, ()=>{
    console.log("Listening on port 3000");
});
const io = socket(server);

// set view engine
app.set('view engine', 'ejs');

//for static files
app.use(express.static('public'));

//Middleware for parsing post requests
app.use(express.urlencoded({ extended: true }));

app.get('/createboard', (req, res) => {
    var roomid = uuidv4();
    var redirectlink = '/' + roomid;

    res.redirect(redirectlink);
});

app.get('/:roomid', (req, res) => {
    res.render('board');
});

// home route
app.get('/', (req, res) => {
    res.render('home');
});

io.on('connection', (socket)=>{
    console.log('Connected to socket ' + socket.id);

    socket.on('firstConnection', (data)=>{

        // adds to room
        socket.join(data.roomID);
        // console.log(data.roomID);

        // getting the socket id of any other person in the same room
        var clients = io.sockets.adapter.rooms[data.roomID].sockets;
        var clientId = Object.keys(clients)[0];
        var helper = io.sockets.connected[clientId];
       
        // asking that user to send the current state of the board
        socket.broadcast.to(helper.id).emit('sendCurrentBoard');
    });
    
    // new user receives the current state of the board
    socket.on("currentBoardSent", function(data){
       
        // getting the id of the most recent user
        var clients = io.sockets.adapter.rooms[data.roomID].sockets;
        var clientId = Object.keys(clients)[ Object.keys(clients).length - 1 ];
        var newestPerson = io.sockets.connected[clientId];

        // sending the current board to the new user
        socket.broadcast.to(newestPerson.id).emit('initialBoard', data);
    });

    // whenever a user draws something, the coordinates and the color values are received and sent to
    // all the othe users in the room
    socket.on('somethingDrawn', (data)=>{
        socket.to(data.roomID).emit('somebodyDrew', data);
    });

    // somebody ended their drawing by lifting the pen. We tell that to all the other users in the room
    socket.on('penLifted', (data)=>{
        socket.to(data.roomID).emit('liftThePen');
    });
});
const express = require('express');
const socket = require('socket.io');
const { v4: uuidv4 } = require('uuid');

const app = express();
const server = app.listen(3000, ()=>{
    console.log("Listening on port 3000");
});
const io = socket(server);

// var connectionList = [];
// set view engine
app.set('view engine', 'ejs');

//for static files
app.use(express.static('public'));

//Middleware for parsing post requests
app.use(express.urlencoded({ extended: true }));

app.get('/createboard', (req, res) => {
    var roomid = uuidv4();
    var redirectlink = '/' + roomid;
    // connectionList.push( {roomid: roomid, members: []} );
    // console.log(connectionList);
    res.redirect(redirectlink);
});

app.get('/:roomid', (req, res) => {
    //console.log(req.params.roomid);
    res.render('board');
});

// create home route
app.get('/', (req, res) => {
    res.render('home');
});

// function addMembertoList(roomid, member){
//     var connectionListLength = connectionList.length;
//     for (let i = 0; i < connectionListLength; i++) {
//         if (connectionList[i].roomid == roomid) {
//             connectionList[i].members.push(member);
//         }
//     }
// }


// app.listen(3000, () => {
//     console.log('app now listening for requests on port 3000');
// });

io.on('connection', (socket)=>{
    console.log('Connected to socket ' + socket.id);
    console.log(" ");
    //console.log(socket);
    
    socket.on('firstConnection', (data)=>{
        //console.log('Data received at server: '+ data.roomID);
        // addMembertoList(data.roomID, socket.id);
        // console.log(connectionList);

        socket.join(data.roomID);
        console.log(data.roomID);
        // var sockets = io.in(data.roomID);
        // var helper = Object.keys(sockets.sockets)[0];
        // console.log(helper);
        var clients = io.sockets.adapter.rooms[data.roomID].sockets;
        var clientId = Object.keys(clients)[0];
        var helper = io.sockets.connected[clientId];
        // console.log("#####################");
        // console.log(clientId);
        // console.log(helper.id);
        // console.log("#####################");
        // console.log("-------------Clients----------------");
        // console.log(clients);
        // console.log(" ");
        // for (var clientId in clients ) {
        //     // console.log("-------------Client ID----------------");
        //     // console.log(clientId);
        //     // console.log(" ");
        //     //this is the socket of each client in the room.
        //     var helper = io.sockets.connected[clientId];
        //     console.log(" ");
        //     console.log("Client ID using new method: ");
        //     console.log(helper.id);
        //     console.log(" ");

        //     // console.log("Clients using new method"); 
        //     // console.log(clients);
        // }

        socket.broadcast.to(helper.id).emit('sendCurrentBoard');
    });
    
    socket.on("currentBoardSent", function(data){
        //console.log("Thankz helperz iz gotz zthe boardz...");
        //console.log(socket.id);

        // var sockets = io.in(data.roomID);
        // var newestPerson = Object.keys(sockets.sockets); // [sockets.length - 1];

        var clients = io.sockets.adapter.rooms[data.roomID].sockets;
        var clientId = Object.keys(clients)[ Object.keys(clients).length - 1 ];
        var newestPerson = io.sockets.connected[clientId];

        console.log("Sending to New person: ");
        console.log(newestPerson.id);

        socket.broadcast.to(newestPerson.id).emit('initialBoard', data);
    });

    socket.on('somethingDrawn', (data)=>{

        //socket.broadcast.emit('somebodyDrew', data);
        socket.to(data.roomID).emit('somebodyDrew', data);

    });

    socket.on('penLifted', (data)=>{
        //console.log("Pen Lifted");
        //socket.broadcast.emit('liftThePen');
        socket.to(data.roomID).emit('liftThePen');
    });
});
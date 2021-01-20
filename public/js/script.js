window.addEventListener('load', () => {
    const socket = io();
    const canvas = document.querySelector("#canvas");
    const panelBtns = document.querySelectorAll(".panel-btn");
    const ctx = canvas.getContext("2d");

    // setting dimensions of the canvas
    var canvasHeight = 3000;
    var canvasWidth = 3000;
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;

    // storing screen widths
    var screenWidth = window.innerWidth;
    var screenHeight = window.innerHeight;

    // zoom factor is 1.05 and initial zoom is 1 meaning no zoom
    var scaleFactor = 1.05;
    var totalScale = 1;

    //initial offset to bring the canvas in the middle of the screen
    var xOffset = (-0.25)*canvasWidth;
    var yOffset = (-0.25)*canvasHeight;
    ctx.translate(xOffset, yOffset);
    var totalXtranslate = xOffset;  //the total translate the canvas is at any given time
    var totalYtranslate = yOffset;

    //adjustCanvasDimnesions();

    // stores the coordinated of the current drawing on the screen
    var drawingStorage = [];  //   [  [ [23,43], [32,56], [67,45] ], [ [],[],...,[] ], [], [], []     ]
    
    // stores the most current continuous drawing i.e. from mouse press to mouse lift
    var continuousDrawing = [];

    // Used for undo functionality
    var redoStorage = [];
    var tipColor = "#000000"
    var panAllow = false;
    var otherContinousDrawing = [];
    let painting = false;
    ctx.lineJoin = "round";

    //draws the grid on the entire canvas
    drawGrid();

    // Sends the room ID from the url to the server when joining the first time
    var roomid = window.location.pathname.substr(1);
    console.log("The room name is " + roomid);
    socket.emit('firstConnection', {
        roomID: roomid
    });


    //#######################################################
    //------------------FUNCTIONS----------------------------
    //#######################################################

    // draws the grid on the entire canvas
    function drawGrid(){
        var gridLinesDist = 100;
        ctx.strokeStyle = "#c3c3c3";
        ctx.lineWidth = 1;

        for (let index = 0; index < canvasWidth; index+=gridLinesDist) {
            ctx.beginPath();
            ctx.moveTo(index, 0);
            ctx.lineTo(index, canvasHeight);
            ctx.stroke();
            //console.log(index);
        }
        for (let index = 0; index < canvasHeight; index+=gridLinesDist) {
            ctx.beginPath();
            ctx.moveTo(0, index);
            ctx.lineTo(canvasWidth, index);
            ctx.stroke();
            //console.log(index);
        }
        ctx.beginPath();
        ctx.strokeStyle = "black";
        ctx.lineWidth = 50;

        ctx.moveTo(0, 0);
        ctx.lineTo(canvasWidth, 0);
        ctx.moveTo(canvasWidth, 0);
        ctx.lineTo(canvasWidth, canvasHeight);
        ctx.moveTo(canvasWidth, canvasHeight);
        ctx.lineTo(0, canvasHeight);
        ctx.moveTo(0, canvasHeight);
        ctx.lineTo(0, 0);
        ctx.stroke();
        ctx.beginPath();
    }

    //when mouse Pressed, "painting" set to true
    function startPosition(e){
        painting = true;
        continuousDrawing = [];
        draw(e);  //so that we can draw a single dot as well
    }
    
    //when mouse lifted
    function finishedPosition(){
        painting = false;
        ctx.beginPath();
        drawingStorage.push(continuousDrawing);
        redoStorage = [];
        
        // tell the server that pen lifted
        socket.emit('penLifted', {
            roomID: roomid
        });
    }

    //when user draws on their canvas
    function draw(e){
        if (!painting) return;
        ctx.lineWidth = 7;
        ctx.lineCap = 'round';
        ctx.strokeStyle = tipColor;

        var xAdjusted = (e.clientX - totalXtranslate)/totalScale;
        var yAdjusted = (e.clientY - totalYtranslate)/totalScale;
        
        ctx.lineTo(xAdjusted, yAdjusted);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(xAdjusted, yAdjusted);

        continuousDrawing.push([xAdjusted, yAdjusted, tipColor]);

        //sends the coordinated of place where something is drawn and also the color
        socket.emit('somethingDrawn', {
            roomID: roomid,
            location: [xAdjusted, yAdjusted, tipColor]
        });
    }

    //to update the screen on the other users' end when one of them draws somthing
    function drawOnOtherScreens(x, y, colour){
        ctx.lineWidth = 7;
        ctx.lineCap = 'round';
        ctx.strokeStyle = colour;

        ctx.lineTo(x, y);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x, y);
        otherContinousDrawing.push([x, y, colour]);
    }

    // takes the coordinates of all points and draws it on the screen. Used to redraw the screen.
    function redrawScreen(storage){

        ctx.lineWidth = 7;
        var storageArrayLength = storage.length;
        for (let i = 0; i < storageArrayLength; i++) {
            var singleDrawingLength = storage[i].length;

            for (let j = 0; j < singleDrawingLength; j++) {
                var point = storage[i][j];
                //console.log(point);
                ctx.strokeStyle = point[2];
                ctx.lineTo(point[0], point[1]);
                ctx.stroke();
                ctx.beginPath();
                ctx.moveTo(point[0], point[1]);
            }
            ctx.beginPath();
        }
    }

    // brings the canvas to its original position with no translation
    function resetTranslate(){
        var xReset = (-1)*totalXtranslate/totalScale;
        var yReset = (-1)*totalYtranslate/totalScale;
        ctx.translate(xReset , yReset );
    }

    // zooms in
    function zoomIn(x,y){
        ctx.scale(scaleFactor, scaleFactor);

        
        totalScale = totalScale*scaleFactor;

        var cursorX = x;
        var cursorY = y;

        var ptX = (cursorX-totalXtranslate)*scaleFactor;
        var ptY = (cursorY-totalYtranslate)*scaleFactor;

        resetTranslate();

        var xtrans = (-1)*(ptX-cursorX)/totalScale;
        var ytrans = (-1)*(ptY-cursorY)/totalScale;

        totalXtranslate = xtrans*totalScale;
        totalYtranslate = ytrans*totalScale;
        ctx.translate(xtrans, ytrans);

    }

    // zooms out
    function zoomOut(x,y){
        var recpScaleFactor = 1/scaleFactor;

        //this line below pervents zoom out if the canvas width becomes smaller than the screen width
        if (canvasWidth*totalScale*recpScaleFactor < screenWidth || canvasHeight*totalScale*recpScaleFactor < screenHeight) {return};


        ctx.scale(recpScaleFactor, recpScaleFactor);

        totalScale = totalScale*recpScaleFactor;

        var cursorX = x;
        var cursorY = y;

        var ptX = (cursorX-totalXtranslate)*recpScaleFactor;
        var ptY = (cursorY-totalYtranslate)*recpScaleFactor;

        resetTranslate();

        var xtrans = (-1)*(ptX-cursorX)/totalScale;
        var ytrans = (-1)*(ptY-cursorY)/totalScale;
        totalXtranslate = xtrans*totalScale;
        totalYtranslate = ytrans*totalScale;
        ctx.translate(xtrans, ytrans);
    }

    // if canvas exposed from any side, then this fixes it. Called when zooming out
    function fixTranslate(){
        // brings back the canvas into proper view as zoom out causes it to show background beyond the border
        var allowedWidth = screenWidth - totalXtranslate;
        var allowedLength = screenHeight - totalYtranslate;

        // If exposed from right
        if (allowedWidth > canvasWidth*totalScale) {   // || screenWidth - totalXtranslate < screenWidth 
            // calculate excess in terms of current scale
            var rightExcess = (allowedWidth - canvasWidth*totalScale)/totalScale;
            console.log("Prevented from right: " + rightExcess);

            ctx.clearRect(0, 0, canvas.width, canvas.height);
            // translate to counter that excess
            ctx.translate(rightExcess, 0);
            // save that translate in terms of normal pixels
            totalXtranslate = totalXtranslate + rightExcess*totalScale;

            drawGrid();
            redrawScreen(drawingStorage);
        }

        // If exposed from left
        if(totalXtranslate > 0){
            var leftExcess = (-1)*(totalXtranslate/totalScale);
            console.log("Prevented from left: " + totalXtranslate);

            ctx.clearRect(0, 0, canvas.width, canvas.height);
            // translate to counter that excess
            ctx.translate(leftExcess, 0);
            // save that translate in terms of normal pixels
            totalXtranslate = totalXtranslate + leftExcess*totalScale;

            drawGrid();
            redrawScreen(drawingStorage);
        }

        // If exposed from bottom
        if (allowedLength > canvasHeight*totalScale) {  //  || screenHeight - totalYtranslate < screenHeight
            var downExcess = (allowedLength - canvasHeight*totalScale)/totalScale;
            console.log("Prevented from down: " + downExcess);

            ctx.clearRect(0, 0, canvas.width, canvas.height);
            // translate to counter that excess
            ctx.translate(0, downExcess);
            // save that translate in terms of normal pixels
            totalYtranslate = totalYtranslate + downExcess*totalScale;

            drawGrid();
            redrawScreen(drawingStorage);
        }

        // If exposed from top
        if(totalYtranslate > 0){
            var upExcess = (-1)*(totalYtranslate/totalScale);
            console.log("Prevented from up: " + totalYtranslate);

            ctx.clearRect(0, 0, canvas.width, canvas.height);
            // translate to counter that excess
            ctx.translate(0, upExcess);
            // save that translate in terms of normal pixels
            totalYtranslate = totalYtranslate + upExcess*totalScale;

            drawGrid();
            redrawScreen(drawingStorage);
            // ctx.translate(0, upExcess);
            // totalYtranslate = totalYtranslate + upExcess;
        }
    }

    var panPtX;
    var panPtY;

    // when control pressed, pan is allowed
    function allowPan(e){
        panPtX = e.clientX;
        panPtY = e.clientY;
        panAllow = true;
    }

    // when control not pressed, pan not allowed
    function blockPan(){
        panAllow = false;
    }

    // translated the screen according to the movement of the cursor
    function panScreen(e){
        if (!panAllow) return;
        //console.log("Can pan");
        var panTransX = (e.clientX - panPtX)/totalScale;
        var panTransY = (e.clientY - panPtY)/totalScale;
        
        totalXtranslate += panTransX*totalScale;
        totalYtranslate += panTransY*totalScale;

        // does not allow pan if canvas is moving out of screen
        if (screenWidth - totalXtranslate > canvasWidth*totalScale || screenWidth - totalXtranslate < screenWidth) {
            totalXtranslate -= panTransX*totalScale;
            panTransX = 0;
        }
        if (screenHeight - totalYtranslate > canvasHeight*totalScale || screenHeight - totalYtranslate < screenHeight) {
            totalYtranslate -= panTransY*totalScale;
            panTransY = 0;
        }

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.translate(panTransX, panTransY);
        panPtX = e.clientX;
        panPtY = e.clientY;
        drawGrid();
        redrawScreen(drawingStorage); 
    }

    // undo
    function undoDrawing(){
        if (!canUndo) {return};
        var drawing = drawingStorage.pop();
        redoStorage.push(drawing);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        drawGrid();
        redrawScreen(drawingStorage); 
    }

    // redo
    function redoDrawing(){
        if (!canUndo) {return};
        // console.log(redoStorage);
        var drawing = redoStorage.pop();
        drawingStorage.push(drawing);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        drawGrid();
        redrawScreen(drawingStorage);
    }
    
    //#######################################################
    //------------------EVENTLISTENERS-----------------------
    //#######################################################

    canvas.addEventListener("mousedown", startPosition);
    canvas.addEventListener("mouseup", finishedPosition);
    canvas.addEventListener("mouseout", finishedPosition);
    canvas.addEventListener("mousemove", draw);

    // to zoom in and out
    document.addEventListener("wheel", function(e){
        var scrollDirection = e.deltaY;
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        if (scrollDirection < 0) {
            zoomIn(e.clientX, e.clientY);
        } else {
            zoomOut(e.clientX, e.clientY);
            fixTranslate();
        }
        drawGrid();
        redrawScreen(drawingStorage);
    });

    var canUndo = false;

    // listens to ctrl, z, y for zooming, undo, and redo respectively
    document.addEventListener("keydown", function(e){

        if (e.key === "Control") {
            canvas.style.cursor = "move";

            //removes the event listeners used for drawing
            canvas.removeEventListener("mousedown", startPosition);
            canvas.removeEventListener("mouseup", finishedPosition);
            canvas.removeEventListener("mousemove", draw);

            //adds events for panning screen
            canvas.addEventListener("mousedown", allowPan);
            canvas.addEventListener("mouseup", blockPan);
            canvas.addEventListener("mousemove", panScreen);
            //console.log("Control pressed");
            canUndo = true;
        }

        if(e.key === "z") {
            if (drawingStorage[0]) {
                undoDrawing();
            }
        }
        if(e.key === "y") {
            if (redoStorage[0]) {
                redoDrawing();
            }
        }
        
    });

    // control lifted
    document.addEventListener("keyup", function(e){

        if (e.key === "Control") {
            canvas.style.cursor = "auto";
                        
            //removes events for panning screen
            canvas.removeEventListener("mousedown", allowPan);
            canvas.removeEventListener("mouseup", blockPan);
            canvas.removeEventListener("mousemove", panScreen);

            //removes the event listeners used for drawing
            canvas.addEventListener("mousedown", startPosition);
            canvas.addEventListener("mouseup", finishedPosition);
            canvas.addEventListener("mousemove", draw);

            canUndo = false;
        }
    });

    // adding event listeners to all the markers on the left of the screen
    for (let index = 0; index < panelBtns.length; index++) {
        if (panelBtns[index].id == "eraser") {
            panelBtns[index].addEventListener("click", function(e){
                tipColor = "#ffffff";
            });

        }else{
            panelBtns[index].addEventListener("click", function(e){
                tipColor = "#" + this.id;
            });
        }
    }


    //#######################################################
    //--------------WEBSOCKET EVENTLISTENERS-----------------
    //#######################################################

    //receives the coordinates of where some other user has drawn
    socket.on('somebodyDrew', (data)=>{

        // uses the coordinates and color value received to draw
        drawOnOtherScreens(data.location[0], data.location[1], data.location[2]);
    });

    //tells that the user who was drawing has lifted their pen
    socket.on('liftThePen', (data)=>{
        ctx.beginPath();  //resets the path so that all lines don't join together
        drawingStorage.push(otherContinousDrawing);
        otherContinousDrawing = [];
    });

    // when a new use joins a room, he is sent the current condition of the board
    socket.on('sendCurrentBoard', (data)=>{
        socket.emit('currentBoardSent', {
            roomID: roomid,
            board: drawingStorage
        });
    });

    // when new user joins a room, he receives the current condition of the board
    socket.on('initialBoard', (data)=>{
        redrawScreen(data.board);
        drawingStorage = data.board;
    });
});
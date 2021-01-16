window.addEventListener('load', () => {
    const socket = io();
    const canvas = document.querySelector("#canvas");
    const panelBtns = document.querySelectorAll(".panel-btn");
    const ctx = canvas.getContext("2d");

    var canvasHeight = 3000;
    var canvasWidth = 3000;
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;

    // var screenWidth = screen.availWidth;
    // var screenHeight = screen.availHeight;
    var screenWidth = window.innerWidth;
    var screenHeight = window.innerHeight;

    var scaleFactor = 1.05;
    var totalScale = 1;

    //initial offset to bring the canvas in the middle of the screen
    var xOffset = (-0.25)*canvasWidth;
    var yOffset = (-0.25)*canvasHeight;
    ctx.translate(xOffset, yOffset);
    var totalXtranslate = xOffset;  //the total translate the canvas is at any given time
    var totalYtranslate = yOffset;

    //adjustCanvasDimnesions();

    var drawingStorage = [];  //   [  [ [23,43], [32,56], [67,45] ], [ [],[],...,[] ], [], [], []     ]
    var continuousDrawing = [];

    var redoStorage = [];
    var tipColor = "#000000"
    var panAllow = false;
    var otherContinousDrawing = [];
    let painting = false;
    ctx.lineJoin = "round";
    //draws the grid on the entire canvas
    drawGrid();
    //ctx.globalCompositeOperation='destination-over';

    // Sends the room ID from the url to the server when joining the first time
    var roomid = window.location.pathname.substr(1);
    console.log("The room name is " + roomid);
    socket.emit('firstConnection', {
        roomID: roomid
    });


    //#######################################################
    //------------------FUNCTIONS----------------------------
    //#######################################################
    
    //changes canvas width and height 
    function adjustCanvasDimnesions(){
        canvas.height = 0.95* window.innerHeight;
        canvas.width = 0.95* window.innerWidth;
    }

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
        // console.log(continuousDrawing);
        // if (continuousDrawing[0][2]=="#ffffff") {
        //     ctx.clearRect(0, 0, canvas.width, canvas.height);
        //     redrawScreen(drawingStorage);
        //     ctx.globalCompositeOperation='xor';
        //     drawGrid();
        //     ctx.globalCompositeOperation='source-over';
        //     console.log("Redrawn everything");
        // }

        //console.log("Added to drawingStorage");
        //console.log(drawingStorage);
        //so we can do ctx.beginPath() at the other users' end. So that all lines are not joined together. 
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

       
        // var xPos = e.clientX -(5/totalScale);  // + window.scrollX
        // var yPos = e.clientY -(5/totalScale);  // + window.scrollY

        var xAdjusted = (e.clientX - totalXtranslate)/totalScale;
        var yAdjusted = (e.clientY - totalYtranslate)/totalScale;
        
        ctx.lineTo(xAdjusted, yAdjusted);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(xAdjusted, yAdjusted);

        continuousDrawing.push([xAdjusted, yAdjusted, tipColor]);

        //sends the percentages
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
        // console.log(colour);
        ctx.lineTo(x, y);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x, y);
        otherContinousDrawing.push([x, y, colour]);

        //console.log("It should have drawn!! "+ x + " "+ y);
    }

    function redrawScreen(storage){
        //console.log("Redrawing");
        ctx.lineWidth = 7;
        var storageArrayLength = storage.length;
        for (let i = 0; i < storageArrayLength; i++) {
            var singleDrawingLength = storage[i].length;
            // if (storage[i][0][2] == "#ffffff") {
            //     console.log("Aye!! White color while redrawing");
            //     ctx.globalCompositeOperation='destination-out';
            // }
            for (let j = 0; j < singleDrawingLength; j++) {
                var point = storage[i][j];
                //console.log(point);
                ctx.strokeStyle = point[2];
                ctx.lineTo(point[0], point[1]);
                ctx.stroke();
                ctx.beginPath();
                ctx.moveTo(point[0], point[1]);
            }
            // ctx.globalCompositeOperation='source-over';
            ctx.beginPath();
        }
    }

    function resetTranslate(){
        var xReset = (-1)*totalXtranslate/totalScale;
        var yReset = (-1)*totalYtranslate/totalScale;
        ctx.translate(xReset , yReset );
    }
    function zoomIn(x,y){
        ctx.scale(scaleFactor, scaleFactor);

        
        totalScale = totalScale*scaleFactor;

        //console.log("Total Scale: " + totalScale);
        //console.log("Total X Trans: " + totalXtranslate);
        //console.log("Total Y Trans: " + totalYtranslate);

        //simplified version of below code
        // var xtrans = ( totalXtranslate*(scaleFactor-totalScale) + e.clientX*(1-scaleFactor) )/totalScale;
        // var ytrans = ( totalYtranslate*(scaleFactor-totalScale) + e.clientY*(1-scaleFactor) )/totalScale;

        //doing it slowly
        var cursorX = x;
        var cursorY = y;
        //console.log("Cursor: ", cursorX, cursorY);

        var ptX = (cursorX-totalXtranslate)*scaleFactor;
        var ptY = (cursorY-totalYtranslate)*scaleFactor;
        //console.log(`( ${cursorX} - ${totalXtranslate} ) x ${scaleFactor} = ${ptX}`);
        //console.log(`( ${cursorY} - ${totalYtranslate} ) x ${scaleFactor} = ${ptY}`);
        //console.log("pt: ", ptX, ptY);

        resetTranslate();

        var xtrans = (-1)*(ptX-cursorX)/totalScale;
        var ytrans = (-1)*(ptY-cursorY)/totalScale;

        //stores the translate value as if there was no scaling (multiplies by the totalScale)
        // totalXtranslate = totalXtranslate + xtrans*totalScale;
        // totalYtranslate = totalYtranslate + ytrans*totalScale;
        //why were you adding the previous totalXtranslate when you always reset it to the origin
        totalXtranslate = xtrans*totalScale;
        totalYtranslate = ytrans*totalScale;
        ctx.translate(xtrans, ytrans);
        //console.log(xtrans, ytrans);
        //console.log("   ");
    }

    // delete these
    function zoomOutReal(x,y){
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

        
        //brings back the canvas into proper view as zoom out causes it to show background beyond the border
        var allowedWidth = screenWidth - totalXtranslate;
        var allowedLength = screenHeight - totalYtranslate;
        if (allowedWidth > canvasWidth*totalScale) {   // || screenWidth - totalXtranslate < screenWidth 
            var extra = (screenWidth - totalXtranslate - canvasWidth*totalScale)/totalScale;
            ctx.translate(extra, 0);
            totalXtranslate += extra*totalScale;
            console.log("Prevented from right");
        }
        if(totalXtranslate > 0){
            ctx.translate(-totalXtranslate, 0);
            totalXtranslate = 0;
            console.log("Prevented from left");
        }

        if (allowedLength > canvasHeight*totalScale) {  //  || screenHeight - totalYtranslate < screenHeight
            var extra = (screenHeight - totalYtranslate - canvasHeight*totalScale)/totalScale;
            ctx.translate(0, extra);
            // console.log(extra);
            totalYtranslate += extra*totalScale;
            console.log("Prevented from down");

        }
        if(totalYtranslate > 0){
            console.log(totalYtranslate);
            ctx.translate(0, -totalYtranslate);
            totalYtranslate = 0;
            console.log("Prevented from up");
        }
    }
    // delete these
    function zoomOutEdited1(x,y){
        // console.log(screenWidth, totalXtranslate, totalYtranslate)
        var recpScaleFactor = 1/scaleFactor;

        //this line below pervents zoom out if the canvas width becomes smaller than the screen width
        if (canvasWidth*totalScale*recpScaleFactor < screenWidth || canvasHeight*totalScale*recpScaleFactor < screenHeight) {return};


        ctx.scale(recpScaleFactor, recpScaleFactor);

        totalScale = totalScale*recpScaleFactor;

        var cursorX = x;
        var cursorY = y;

        var ptX = (cursorX-totalXtranslate)*recpScaleFactor;
        var ptY = (cursorY-totalYtranslate)*recpScaleFactor;
        
        var xtrans = (-1)*(ptX-cursorX)/totalScale;
        var ytrans = (-1)*(ptY-cursorY)/totalScale;

        var allowedWidth = screenWidth - xtrans*totalScale;
        var allowedLength = screenHeight - ytrans*totalScale;

        // if (xtrans*totalScale > 0 || allowedWidth > canvasWidth*totalScale) {
        //     xtrans = 0;
        // }else{
        //     var xReset = (-1)*totalXtranslate/totalScale;
        //     ctx.translate(xReset , 0);
        //     totalXtranslate = xtrans*totalScale;   
        // }

        // if (ytrans*totalScale > 0 || allowedLength > canvasHeight*totalScale) {
        //     ytrans = 0;
        // }else{
        //     var yReset = (-1)*totalYtranslate/totalScale;
        //     ctx.translate(0, yReset );
        //     totalYtranslate = ytrans*totalScale;
        // }
        var movingOutfromLeft = xtrans*totalScale > 0;
        var movingOutfromRight = allowedWidth > canvasWidth*totalScale;
        var movingOutfromUp = ytrans*totalScale > 0;
        var movingOutfromBottom = allowedLength > canvasHeight*totalScale;

        if (xtrans*totalScale > 0 || allowedWidth > canvasWidth*totalScale || ytrans*totalScale > 0 || allowedLength > canvasHeight*totalScale) {
            xtrans = 0;
            ytrans = 0;
            ctx.scale(scaleFactor, scaleFactor);
            console.log("Moving out!");
            if (movingOutfromLeft) {console.log("Moving out from left");}
            if (movingOutfromRight) {console.log("Moving out from Right");}
            if (movingOutfromUp) {console.log("Moving out from Up");}
            if (movingOutfromBottom) {console.log("Moving out from Bottom");}
        }else{
            resetTranslate();
            totalXtranslate = xtrans*totalScale;   
            totalYtranslate = ytrans*totalScale;
            ctx.translate(xtrans, ytrans);
            console.log("allowed moving");
        }
    }

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
    function allowPan(e){
        panPtX = e.clientX;
        panPtY = e.clientY;
        panAllow = true;
    }
    function blockPan(){
        panAllow = false;
    }

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

    function undoDrawing(){
        if (!canUndo) {return};
        var drawing = drawingStorage.pop();
        redoStorage.push(drawing);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        drawGrid();
        redrawScreen(drawingStorage); 
    }

    function redoDrawing(){
        if (!canUndo) {return};
        // console.log(redoStorage);
        var drawing = redoStorage.pop();
        drawingStorage.push(drawing);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        drawGrid();
        redrawScreen(drawingStorage);
        // console.log("Everything done")
    }
    
    //#######################################################
    //------------------EVENTLISTENERS-----------------------
    //#######################################################

    canvas.addEventListener("mousedown", startPosition);
    canvas.addEventListener("mouseup", finishedPosition);
    canvas.addEventListener("mouseout", finishedPosition);
    canvas.addEventListener("mousemove", draw);

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
    document.addEventListener("keydown", function(e){
        if(e.key === "Escape") {
            console.log("Escape Pressed");
            //document.exitFullscreen();
        }
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
        if(e.key === "p") {
            fixTranslate();
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
        // remove later
        if(e.key === "t") {
            console.log(" ");
            console.log("TotalX & totalY: "+ totalXtranslate + ", "+ totalYtranslate);
            console.log("Screen Width: " + screenWidth);
            console.log("Canv. W: " + canvasWidth*totalScale + ", Canv. H: "+canvasHeight*totalScale);
            var limitX = screenWidth-totalXtranslate;
            var limitY = screenHeight-totalYtranslate;
            console.log("X limit: " + limitX + ", Y limit: " + limitY);
            console.log("Total Scale: " + totalScale);
            console.log(" ");
            //document.exitFullscreen();
        }
        
    });

    document.addEventListener("keyup", function(e){
        if(e.key === "f") {
            console.log("f Pressed");
            //canvas.requestFullscreen();
        }
        if (e.key === "Control") {
            canvas.style.cursor = "auto";
            //console.log("Control lifted");
                        
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

    for (let index = 0; index < panelBtns.length; index++) {
        if (panelBtns[index].id == "eraser") {
            panelBtns[index].addEventListener("click", function(e){
                tipColor = "#ffffff";

            });

        }else{
            panelBtns[index].addEventListener("click", function(e){
                //console.log("clickingg");
                //console.log(this.id);
                tipColor = "#" + this.id;
            });
        }
    }


    //#######################################################
    //--------------WEBSOCKET EVENTLISTENERS-----------------
    //#######################################################

    //receives the coordinates of where some other user has drawn
    socket.on('somebodyDrew', (data)=>{
        //console.log('Data at client: ' + data.location);
        //drawOnOtherScreens(data.location[0], data.location[1]);

        //converts the percentages to pixels using the screen width and height and then fires the function which draws.
        // drawOnOtherScreens(data.location[0]*window.innerWidth, data.location[1]*window.innerHeight);
        drawOnOtherScreens(data.location[0], data.location[1], data.location[2]);
    });

    //tells that the user who was drawing has lifted their pen
    socket.on('liftThePen', (data)=>{
        //console.log('Somebody lifted the pen!');
        ctx.beginPath();  //resets the path so that all lines don't join together
        drawingStorage.push(otherContinousDrawing);
        otherContinousDrawing = [];
    });

    socket.on('sendCurrentBoard', (data)=>{
        console.log("sending the current board bro!")
        socket.emit('currentBoardSent', {
            roomID: roomid,
            board: drawingStorage
        });
    });
    socket.on('initialBoard', (data)=>{
        console.log("Got thze dataz..");
        console.log(data);
        redrawScreen(data.board);
        drawingStorage = data.board;
    });
});

//fixes canvas width and height when window resized
// window.addEventListener('resize', adjustCanvasDimnesions);
/*global window, document, input, Sprite, resources */
/*eslint no-console: ["error", { allow: ["warn", "error"] }] */

"use strict";

// Set debugMode to true
// to disable collision detection
var debugMode = false;

// use gameIndex to test one type of game. Put game type in double quotes
// game types are: "Book", "Journal Article", "Edited Book", "eBook", "Book chapter", "Report", "Webpage""
// Disable by using null, without quotes.
var gameIndex = null;

/* Configure difficulty */
// Rate at which students are added to the game
// Higher value means more frequent updates
var addStudentRate = 0.006;

// Speeds in pixels per second
var studentSpeed = 30;
var cartLowerSpeed = 80;
var cartMidSpeed = 100;
var cartUpperSpeed = 70;
// End of configuration

var mySound;
var carts = [];
var leftStudents = [];
var rightStudents = [];
var splats = [];
var slots = [];
var smileys = [];
var gameTime = 0;
var scoreEl = document.getElementById("score");
scoreEl.innerHTML = 0;
var scoreTracker = {};
var isGameOver = false;

// entity vertical levels
//larger values are higher up
var cartRows = [97, 144, 193];

//left to right students
//var rightYChoices = [290,355, 390];
var rightYChoices = [290,380];
//right to left students
var leftYChoices = [290,380];

var playerHeight = 30;
var playerWidth = 42;
var cartWidth = 120;
var studentWidth = 30;
var studentHeight = 40;
var canvasWidth = 760;
var canvasHeight = 440;
var homeHeight = 55;
var homeBorder = 10;
var slotHeight = 50;
var centralZone = 44;
var studentZone = (canvasHeight / 2) - (centralZone / 2);
var cartZone = canvasHeight - homeHeight;
var slotFont = "20px DPComic";

// Alternative images for randomisation
var rightSprites = ["img/funky_student@40r.png","img/blonde_student@40r.png"];
var leftSprites = ["img/music_student@40r.png","img/afro_student@40r.png"];
var cartSprites = ["img/yellow_cart_2.png", "img/red_cart@40.png", "img/blue_cart@40.png", "img/plain_cart@40.png"];

var hopLength = ( canvasHeight - ((homeHeight / 2) + (slotHeight / 2)) ) / 8;
var gameName;

// games
var gameOrg = {
    "Book":
    ["Author/s.", "(Year)", "Title.", "Place:", "Publisher."],
    "Journal Article":
    ["Author/s.", "(Year)", "Article Title.", "Journal Name,", "Volume", "(Issue no.)", "Page nos."],
    "Edited Book:":
    ["Editor/s.", "ed.", "(Year)", "Title", "Place.", "Publisher"],
    "eBook":
    ["Author.", "(Year)", "Title.", "[online]", "Place:", "Publisher.", "Available from:", "URL", "(access date)"],
    "Book chapter":
    ["Author.", "(Year)", "Chapter.", "In:", "Editor/s.", "eds.", "Book.", "Place.", "Publisher,", "Pages."],
    "Report":
    ["Author.", "(Year)", "Title", "Place.", "Corporate Author."],
    "Webpage":
    ["Author.", "(Year)", "Title.", "[online]", "Available from:", "url", "(access date)."]
};
/*
var testgameOrg = {
    "Book":
    ["Author/s.", "(Year)", "Title.", "Place:", "Publisher."]
};
*/

function returnHome () {
    player.pos = [(canvas.width - playerWidth) / 2 , canvas.height - ( (homeHeight / 2) + (playerHeight / 2) )];
}

function shallowCopy( original )  
{
    // First create an empty object with
    // same prototype of our original source
    var clone = Object.create( Object.getPrototypeOf( original ) ) ;

    var i , keys = Object.getOwnPropertyNames( original ) ;

    for ( i = 0 ; i < keys.length ; i ++ )
    {
        // copy each property into the clone
        Object.defineProperty( clone , keys[ i ] ,
            Object.getOwnPropertyDescriptor( original , keys[ i ] )
        ) ;
    }

    return clone ;
}

var gameObjs = shallowCopy(gameOrg);
var currentGame;
// Game state
// Track used up players
var playPieces = {};

function makePlayPieces () {
    for (var i = 0; i < currentGame.length; i++){
        playPieces[currentGame[i]] = i;
    }
}

// Game over
function gameOver() {
    gameObjs = shallowCopy(gameOrg);
    document.getElementById("game-over").style.display = "block";
    document.getElementById("game-over-overlay").style.display = "block";
    isGameOver = true;
    mySound.stop();
}

function pickRandomProperty(obj) {
    var result;
    var count = 0;
    for (var prop in obj)
        if (Math.random() < 1/++count)
            result = prop;
    return result;
}

function startPlayer() {
    if (Object.keys(playPieces).length === 0) {
        return null;
    } else {
        var randomPiece = pickRandomProperty(playPieces);
        delete playPieces[randomPiece];
        return randomPiece;
    }
}

var startId;
var player = {
    onCart: false,
    pos: [0, 0],
    sprite: new Sprite("img/book_burgundy.png", [0, 0], [playerWidth, playerHeight], 3, [0, 1])
};

// A cross-browser requestAnimationFrame
// See https://hacks.mozilla.org/2011/08/animating-with-javascript-from-setinterval-to-requestanimationframe/

var requestAnimFrame = (function () {
    return window.requestAnimationFrame ||
        window.webkitRequestAnimationFrame ||
        window.mozRequestAnimationFrame ||
        window.oRequestAnimationFrame ||
        window.msRequestAnimationFrame ||
        function (callback) {
            window.setTimeout(callback, 1000 / 60);
        };
}());

// Create the canvas
var canvas = document.createElement("canvas");
var ctx = canvas.getContext("2d");

canvas.width = canvasWidth;
canvas.height = canvasHeight;
document.getElementById("wrapper").style.width = canvasWidth + "px";
document.getElementById("game-div").appendChild(canvas);

var lastTime;

// Helper to see if any key was pressed
function anyPress(player) {
    if (
        player.upPressed === true ||
        player.downPressed === true ||
        player.rightPressed === true ||
        player.leftPressed === true 
    ) {
        return true;
    }
    return false;
}

var sideHopLength = 0;
function handleInput() {
  
    if (input.isDown("DOWN") || input.isDown("s")) {
        if (player.downPressed === false){
            player.pos[1] += hopLength;
            player.downPressed = true;
            player.onCart = false;
        }
        
    } else {
        player.downPressed = false;
    }

    if (input.isDown("UP") || input.isDown("w")) {
        if (player.upPressed === false) {
            player.pos[1] -= hopLength;
            player.upPressed = true;
            player.onCart = false;
        }
    } else {
        player.upPressed = false;
    }

    if (input.isDown("LEFT") || input.isDown("a")) {
        if (player.leftPressed === false) {
            player.pos[0] -= sideHopLength;
            player.leftPressed = true;
            player.onCart = false;
        }
    } else {
        player.leftPressed = false;
    }

    if (input.isDown("RIGHT") || input.isDown("d")) {
        if (player.rightPressed === false) {
            player.pos[0] += sideHopLength;
            player.rightPressed = true;
            player.onCart = false;
        }
    } else {
        player.rightPressed = false;
    }
}

 
function updateEntities(dt) {
    var i;
    // Update the player sprite animation
    player.sprite.update(dt);
 
    // Update all the carts
    for (i = 0; i < carts.length; i += 1) {
     
        carts[i].pos[0] -= carts[i].velocity * dt;
        carts[i].sprite.update(dt);

        // Remove if offscreen
        if (carts[i].pos[0] + carts[i].sprite.size[0] < 0) {
            carts.splice(i, 1);
            i -= 1;
        }
    }

    // Update all the  left students
    for (i = 0; i < leftStudents.length; i += 1) {
        leftStudents[i].pos[0] -= studentSpeed * dt;
        leftStudents[i].sprite.update(dt);

        // Remove if offscreen
        if (leftStudents[i].pos[0] + leftStudents[i].sprite.size[0] < 0) {
            leftStudents.splice(i, 1);
            i -= 1;
        }
    }

    // Update all the right students
    for (i = 0; i < rightStudents.length; i += 1) {
        rightStudents[i].pos[0] += studentSpeed * dt;
        rightStudents[i].sprite.update(dt);

        // Remove if offscreen
        if (rightStudents[i].pos[0] + rightStudents[i].sprite.size[0] < 0) {
            rightStudents.splice(i, 1);
            i -= 1;
        }
    }
}

// Update game object
// Puts students on different levels
function studentY(heights) {
    var item = heights[Math.floor(Math.random() * heights.length)];
    return item;
}

function checkPlayerBounds() {
    // Check bounds
    // to the left is lower, to the right is higher
    
    if (player.pos[0] < 0) {
        var zone = detectZone(player);
        if (zone === "carts"){
            returnHome();
        } else {
            player.pos[0] = 0;
        }
    } 
    
    else if ((player.pos[0] + playerWidth) > canvas.width) {
        player.pos[0] = canvas.width - playerWidth;
       
    }
    // up is lower
    if (player.pos[1] < 0) {
        player.pos[1] = 0;
    } else if (player.pos[1] > canvas.height - player.sprite.size[1]) {
        player.pos[1] = canvas.height - ( (homeHeight / 2) + (playerHeight / 2));
    }
}

function slotCollides(pos, size, pos2, size2) {
    // pos is position of this slot
    // size of this slot
    // pos2 position of player
    // size2 size of player
    if (
        (pos[1] + size[1]) >= (pos2[1] + size2[1]) && //above bottom edge
        (pos[0] <= (pos2[0] +10)) && // to the right of the left edge
        (pos[0] + size[0]) >= (pos2[0] + size2[0] - 10)// to the left of the right edge
        ) {
        return true;
    }
}

function cartCollides(pos, size, pos2, size2) {
    if (
        pos2[0] >= pos[0]  && // player left edge to the right of left cart edge
        pos2[0] + size2[0] <= pos[0] + size[0] && // player right edge to the left of right cart edge
        pos2[1] >= pos[1]  && // player top edge below cart top edge
        pos2[1] + size2[1] <= pos[1] + size[1] // //player bottom edge above cart bottom edge
        ) {
        return true;
    }
}

function currentScore() {
    var total = 0,
        key,
        value;
    for (key in scoreTracker) {
        if (scoreTracker.hasOwnProperty(key)) {
            value = scoreTracker[key];
            total += value;
        }
    }
    return total;
}

function updateScore(score, id) {
    smileys = [];
    var x = 0,
        y = 0,
        i,
        sprite,
        pos;
    var slotName = gameName + id;
    scoreTracker[slotName] = score;
  
    for (i = 0; i < slots.length; i += 1) {
        var thisSlot = gameName + slots[i].slotId;
        if (scoreTracker[thisSlot] !== undefined) {
            if (scoreTracker[thisSlot] === 1) {
                sprite = new Sprite("img/smiley.png", [0, 0], [20, 20], 1, [0], null, true);
            }

            if (scoreTracker[thisSlot] === 0) {
                sprite = new Sprite("img/frowny.png", [0, 0], [20, 20], 1, [0], null, true);
            }

            x = (slots[i].pos[0] + (slots[i].size[0] / 2)) - (sprite.size[0] / 2);
            y = (slots[i].pos[1] + (slots[i].size[1] / 2)) - (sprite.size[1] / 2);
            pos = [x, y];

            smileys.push({
                pos: pos,
                sprite: sprite
            });
        }
    }
    scoreEl.innerHTML = currentScore();
}

// Collisions
function collides(x, y, r, b, x2, y2, r2, b2) {
    return !(r <= x2 || x > r2 ||
        b <= y2 || y > b2);
}

function boxCollides(pos, size, pos2, size2) {
    return collides(pos[0], pos[1],
        pos[0] + size[0], pos[1] + size[1],
        pos2[0], pos2[1],
        pos2[0] + size2[0], pos2[1] + size2[1]);
}

function checkCarts(dt){
    for (var i = 0; i < carts.length; i += 1) {
        var pos = carts[i].pos;
        var size = carts[i].sprite.size;
     
        if (cartCollides(pos, size, player.pos, player.sprite.size)) {
            player.pos[0] -= carts[i].velocity * dt;
            player.onCart = true;
        } 
    }
}

function detectZone(player) {
    var pos = player.pos;
    var zone = "safe";
    if (pos[1] < (canvasHeight - homeHeight) && pos[1] > (studentZone + centralZone) ){
        zone = "carts";
        return zone;
    }
    return zone;
}

var timer = 0;
function endAndStartTimer() {
    timer++;
    if (timer % 30 === 0) {
        returnHome();
    }
}

function checkCollisions(dt) {
    var i,
        pos,
        size,
        score;
    checkPlayerBounds();
    
    var zone = detectZone(player);
    if (debugMode === false && anyPress(player) === false && player.onCart === false && zone === "carts") {
        returnHome();
    }
    else if (debugMode === false && anyPress(player) === true && player.onCart === false && zone === "carts") {
        endAndStartTimer(0);
    }

    // Collision for slots
    for (i = 0; i < slots.length; i += 1) {
        pos = slots[i].pos;
        size = slots[i].size;
        score = 0;

        if (slotCollides(pos, size, player.pos, player.sprite.size, slots[i].slotId, player.id)) {
            if (slots[i].slotId === startId) {
                score = 1;
            } 
            updateScore(score, slots[i].slotId);
            startId = startPlayer();
            if (debugMode === false) {
                returnHome();
            }
          
            if (startId === null && Object.keys(gameObjs).length > 0) {
                reset();
            } else if (startId === null && Object.keys(gameObjs).length === 0) {
                gameOver();
            }
        }
    }

    checkCarts(dt);
    
    // Collision with students
    for (i = 0; i < leftStudents.length; i += 1) {
        pos = leftStudents[i].pos;
        size = leftStudents[i].sprite.size;
        
        if (debugMode === false && boxCollides(pos, size, player.pos, player.sprite.size)) {
            returnHome();
        }
    }

    for (i = 0; i < rightStudents.length; i += 1) {
        pos = rightStudents[i].pos;
        size = rightStudents[i].sprite.size;

        if (debugMode === false && boxCollides(pos, size, player.pos, player.sprite.size)) {
            returnHome();
        }
    }
}

var lowerTime = 0;
var midTime = 0;
var upperTime = 0;

function randomIntFromInterval(min,max)
{
    return Math.floor(Math.random()*(max-min+1)+min);
}

function callCart(time, width, speed, row, callback){
    if (time > (width / speed)) {
        time = 0;
        
        var cartSprite = cartSprites[Math.floor(Math.random() * cartSprites.length)];
        var cartOffset = randomIntFromInterval(0, width);
        
        carts.push({
            pos: [canvas.width + cartOffset, canvas.height - row],
            velocity: speed,
            sprite: new Sprite(cartSprite, [0, 0], [120, 40], 6, [0, 1])
        });
        
        if (cartOffset > 0) {
            time = 0 - ((cartOffset / width) * (width / speed));
        }
    }
    callback(time);
}

function update(dt) {
    gameTime += dt;
    lowerTime += dt;
    midTime += dt;
    upperTime += dt;
    handleInput(dt);
    updateEntities(dt);
    
    callCart(lowerTime, cartWidth, cartLowerSpeed, cartRows[0], function(t) {
        lowerTime = t;
    });
    
    callCart(midTime, cartWidth, cartMidSpeed, cartRows[1], function(t) {
        midTime = t;
    });
    
    callCart(upperTime, cartWidth, cartUpperSpeed, cartRows[2], function(t) {
        upperTime = t;
    });
   
    if (Math.random() < addStudentRate) {
        leftStudents.push({
            pos: [canvas.width, canvas.height - studentY(leftYChoices)],
            sprite: new Sprite(
                leftSprites[Math.floor(Math.random() * leftSprites.length)],
                [0, 0], [studentWidth, studentHeight], 6, [0, 1])
        });

        rightStudents.push({
            pos: [0, canvas.height - studentY(rightYChoices)],
            sprite: new Sprite(
                rightSprites[Math.floor(Math.random() * rightSprites.length)], 
                [0, 0], [studentWidth, studentHeight], 6, [0, 1])
        });
    }
    checkCollisions(dt);
}

function renderEntity(entity) {
    ctx.save();
    ctx.translate(entity.pos[0], entity.pos[1]);
    entity.sprite.render(ctx);
    ctx.restore();
}
function renderEntities(list) {
    var i;
    for (i = 0; i < list.length; i += 1) {
        renderEntity(list[i]);
    }
}
 
function wrapText(context, text, x, y, maxWidth, lineHeight) {
    var words = text.split(" ");
    var line = "";
    
    for(var n = 0; n < words.length; n++) {
        var testLine = line + words[n] + " ";
        var metrics = context.measureText(testLine);
        var testWidth = metrics.width;
        if (testWidth > maxWidth && n > 0) {
            context.fillText(line, x, y);
            line = words[n] + " ";
            y += lineHeight;
        }
        else {
            line = testLine;
        }
    }
    context.fillText(line, x, y);
}
      
function Component(conf) {
    this.pos = conf.pos;
    this.size = conf.size;
    this.slotId = conf.slotId;
    this.rect = conf.rect;
}

function renderSlots() {
    slots = [];
    var i,
        width,
        height,
        x,
        y,
        slot;

    for (i = 0; i < currentGame.length; i += 1) {
        width = canvas.width / currentGame.length;
        height = slotHeight;
        x = i === 0 ? 0 : (canvas.width / currentGame.length) * i;
        y = 0;

        ctx.beginPath();
        ctx.lineWidth = "1";
        ctx.strokeStyle = "grey";
        ctx.rect(x, y, width, height);
        ctx.stroke();
        ctx.fillStyle = "black";
        if (startId === currentGame[i]) {
            ctx.fillStyle = "red";
        }
       
        ctx.font = slotFont;
        wrapText(ctx, currentGame[i], x + 5, y + 20, width - 5, 20);
        slot = new Component({ pos: [x, y], size: [width, height], slotId: currentGame[i] });
        slots.push(slot);
    }
}

// Draw everything
function render() {

    // The main game area
    ctx.fillStyle = "green";
    ctx.fillRect(0, 0, canvas.width, canvas.height );
    
    // Central zone
    ctx.fillStyle = "gold";
    ctx.fillRect(0, studentZone, canvas.width, centralZone);
    
    //  slot zone
    ctx.fillStyle = "LightGoldenRodYellow";
    ctx.fillRect(0, 0, canvas.width, slotHeight);
   
   // Home zone
    ctx.fillStyle = "black";
    ctx.fillRect(0, cartZone, canvas.width, homeHeight);

    // home top border
    ctx.fillStyle = "DarkGoldenRod";
    ctx.fillRect(0, cartZone, canvas.width, homeBorder);
    
    // home bottom border
    ctx.fillRect(0, canvas.height - homeBorder, canvas.width, homeBorder);
    
    renderEntities(carts);
    renderEntities(leftStudents);
    renderEntities(rightStudents);
    renderEntities(splats);
    renderEntities(smileys);
    renderSlots();
      // Render the player if the game isn't over
    if (!isGameOver) {
        renderEntity(player);
    }
}

function main() {
    var now = Date.now(),
        dt = (now - lastTime) / 1000.0;
    if (isGameOver === false) {
        update(dt);
        render();
    }
    lastTime = now;
    requestAnimFrame(main);
}

function Sound(src) {
    this.sound = document.createElement("audio");
    this.sound.loop = true;
    this.sound.src = src;
    this.sound.setAttribute("preload", "auto");
    this.sound.setAttribute("controls", "none");
    this.sound.style.display = "none";
    document.body.appendChild(this.sound);
    this.play = function () {
        this.sound.play();
    };
    this.stop = function () {
        this.sound.pause();
    };
}

// Reset game to original state
function reset() {

    document.getElementById("game-over").style.display = "none";
    document.getElementById("game-over-overlay").style.display = "none";
    //Pick a random game
    if (gameIndex === null) {
        gameName = pickRandomProperty(gameObjs);
    } else {
        gameName = gameIndex;
    }
   
    document.getElementById("game-name").innerHTML = gameName;
    currentGame = gameObjs[gameName];
    sideHopLength = (canvasWidth / currentGame.length) / 2;
    delete gameObjs[gameName];
    playPieces = {};
    makePlayPieces ();
    isGameOver = false;
    gameTime = 0;
    carts = [];
    leftStudents = [];
    rightStudents = [];
    splats = [];
    slots = [];
    smileys = [];
    startId = startPlayer();
    player.sprite.url = "img/book_burgundy.png";
    returnHome();
    if (mySound === undefined) {
        mySound = new Sound("frogger.mp3");
        mySound.play();
    }
}

function init() {
    document.getElementById("play-again").addEventListener("click", function () {
        scoreTracker = {};
        scoreEl.innerHTML = 0;
        if (mySound !== undefined) {
            mySound.play();
        }
        reset();
    });

    reset();
    lastTime = Date.now();
    main();
}

resources.load([
    "img/red_cart@40.png",
    "img/blue_cart@40.png",
    "img/plain_cart@40.png",
    "img/smiley.png",
    "img/frowny.png",
    "img/yellow_cart_2.png",
    "img/blonde_student@40r.png",
    "img/music_student@40r.png",
    "img/afro_student@40r.png",
    "img/funky_student@40r.png",
    "img/book_burgundy.png"
]);
resources.onReady(init);
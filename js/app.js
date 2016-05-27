/*global window, document, input, Sprite, resources */
"use strict";

var debugMode = false;

// Rate at which entities are added to the game
// Higher values means more frequent updates
// 0.03 seems fast 0.005 is slow enough for development
var addRate = 0.009;
var cartRateLower = 0.004;
var cartRateUpper = 0.004;
var cartRateHigher = 0.004;
// Speed in pixels per second
var playerSpeed = 100;
var studentSpeed = 40;
var cartSpeed = 80;
var upperSpeed = 80;
var mySound;
var carts = [];
var students = [];
var right_students = [];
var splats = [];
var slots = [];
var smileys = [];
var gameTime = 0;
var terrainPattern;
var score = 0;
var scoreEl = document.getElementById('score');
scoreEl.innerHTML = 0;
var scoreTracker = {};
// Height of 'home' slots

var isGameOver = false;

// entity vertical levels
//larger values are higher up
var cartRows = [102, 154, 206];
//var items = [115];
//left to right
//var rightYChoices = [290,355, 390];
var rightYChoices = [310,410];
//right to left
//var leftYChoices = [290, 323, 353, 390];
var leftYChoices = [310,410];

var playerHeight = 30;
var playerWidth = 42;
var cartWidth = 120;
var cartHeight = 40;
var studentWidth = 40;
var studentHeight = 40;
var canvasWidth = 760;
var canvasHeight = 480;
var homeHeight = 60;
var homeBorder = 10;
var slotHeight = 60;
var centralZone = 40;
var studentZone = (canvasHeight / 2) - (centralZone / 2);
var cartZone = canvasHeight - homeHeight;
var slotFont = "20px DPComic";

var hopLength = (canvasHeight - slotHeight) / 8;
var gameName;
// games
var games = [
    ["Author/s.", "(Year)", "Title.", "Place:", "Publisher."],
    ["Author/s.", "(Year)", "Article Title.", "Journal Name,", "Volume", "(Issue no.)", "Page nos."]
];

var gameOrg = {
    "Book":
    ["Author/s.", "(Year)", "Title.", "Place:", "Publisher."],
    "Journal Article":
    ["Author/s.", "(Year)", "Article Title.", "Journal Name,", "Volume", "(Issue no.)", "Page nos."],
    "eBook":
    ["Author.", "(Year)", "Title.", "[online]", "Place:", "Publisher.", "Available from:", "URL", "(access date)"],
    "Book chapter":
    ["Author.", "(Year)", "Chapter.", "In:", "Editor/s.", "eds.", "Book.", "Place.", "Publisher,", "Pages."]
};

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
    document.getElementById('game-over').style.display = 'block';
    document.getElementById('game-over-overlay').style.display = 'block';
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

function pickGame() {
    if (Object.keys(gameObjs).length > 0) {
        return pickRandomProperty(gameObjs);
    } else {
        gameOver();
    }
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
    //sprite: new Sprite('img/' + startId + '.png', [0, 0], [30, 26], 10, [0, 1])
    sprite: new Sprite('img/book_burgundy.png', [0, 0], [playerWidth, playerHeight], 3, [0, 1])
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

// Create the canva
var canvas = document.createElement("canvas");
var ctx = canvas.getContext("2d");

canvas.width = canvasWidth;
canvas.height = canvasHeight;
document.getElementById("game-div").appendChild(canvas);

// Zones. These are just heights
var homeZone = canvasHeight - homeHeight;

// Alternative images for randomisation
//var rightSprites = ['img/funky_student_sprite.png', 'img/blonde_student.png'];
var rightSprites = ['img/funky_student@40.png','img/blonde_student@40.png'];
//var leftSprites = ['img/music_student_sprite.png', 'img/afro_student.png'];
var leftSprites = ['img/music_student@40.png','img/afro_student@40.png'];
//var cartSprites = ['img/yellow_cart.png', 'img/red_cart.png', 'img/blue_cart.png',];
var cartSprites = ['img/yellow_cart_2.png'];

// The main game loop
var lastTime;

function hopper(tracker) {
    if (tracker  === 0) {
        return 65;
    }
    if (tracker === 65) {
        return 65;
    }
    return 0;
}

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
function handleInput(dt) {
  
    if (input.isDown('DOWN') || input.isDown('s')) {
        if (player.downPressed === false){
            player.pos[1] += hopLength;
            player.downPressed = true;
            player.onCart = false;
        }
        
    } else {
        player.downPressed = false;
    }

    if (input.isDown('UP') || input.isDown('w')) {
        if (player.upPressed === false) {
            player.pos[1] -= hopLength;
            player.upPressed = true;
            player.onCart = false;
        }
    } else {
         player.upPressed = false;
    }

    if (input.isDown('LEFT') || input.isDown('a')) {
        if (player.leftPressed === false) {
            player.pos[0] -= sideHopLength;
            player.leftPressed = true;
            player.onCart = false;
        }
    } else {
        player.leftPressed = false;
    }

    if (input.isDown('RIGHT') || input.isDown('d')) {
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
        carts[i].pos[0] -= cartSpeed * dt;
        carts[i].sprite.update(dt);

        // Remove if offscreen
        if (carts[i].pos[0] + carts[i].sprite.size[0] < 0) {
            carts.splice(i, 1);
            i -= 1;
        }
    }

    // Update all the  left students
    for (i = 0; i < students.length; i += 1) {
        students[i].pos[0] -= studentSpeed * dt;
        students[i].sprite.update(dt);

        // Remove if offscreen
        if (students[i].pos[0] + students[i].sprite.size[0] < 0) {
            students.splice(i, 1);
            i -= 1;
        }
    }

    // Update all the right students
    for (i = 0; i < right_students.length; i += 1) {
        right_students[i].pos[0] += studentSpeed * dt;
        right_students[i].sprite.update(dt);

        // Remove if offscreen
        if (right_students[i].pos[0] + right_students[i].sprite.size[0] < 0) {
            right_students.splice(i, 1);
            i -= 1;
        }
    }
}

// Update game object
// Puts carts on different levels
function cartY(heights) {
    var item = heights[Math.floor(Math.random() * heights.length)];
    return item;
}

function checkPlayerBounds() {
    // Check bounds
    if (player.pos[0] < 0) {
        //player.pos[0] = 0;
          player.pos = [canvas.width / 2, canvas.height - 45];
    } else if (player.pos[0] > canvas.width - player.sprite.size[0]) {
        player.pos[0] = canvas.width - player.sprite.size[0];
    }

    if (player.pos[1] < 0) {
        player.pos[1] = 0;
    } else if (player.pos[1] > canvas.height - player.sprite.size[1]) {
        player.pos[1] = canvas.height - (player.sprite.size[1] + 15);
    }
}

function slotCollides(pos, size, pos2, size2) {
    // pos is position of this slot
    // size of this slot
    // pos2 position of player
    // size2 size of player
    if (
        (pos[1] + size[1]) > (pos2[1] + size2[1]) && //above bottom edge
            (pos[0] < pos2[0]) && // to the right of the left edge
            (pos[0] + size[0]) > (pos2[0] + size2[0])// to the left of the right edge
    ) {
        return true;
    }
}

function cartCollides(pos, size, pos2, size2) {
    if (
        (pos2[0] >= pos[0]  && // player left edge to the right of left cart edge
        pos2[0] + size2[0] <= pos[0] + size[0] && // player right edge to the left of right cart edge
        pos2[1] >= pos[1]  && // player top edge below cart top edge
       pos2[1] + size2[1] <= pos[1] + size[1] // //player bottom edge above cart bottom edge
            )
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
                sprite = new Sprite('img/smiley.png', [0, 0], [20, 20], 1, [0], null, true);
            }

            if (scoreTracker[thisSlot] === 0) {
                sprite = new Sprite('img/frowny.png', [0, 0], [20, 20], 1, [0], null, true);
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
            player.pos[0] -= cartSpeed * dt;
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
        player.pos = [canvas.width / 2, canvas.height - 45];
    }
}

function checkCollisions(dt) {
    var i,
        pos,
        size,
        score,
        keyIsPressed = false,
        isOnFloor = true;
    checkPlayerBounds();
    
    var zone = detectZone(player);
    if (debugMode === false && anyPress(player) === false && player.onCart === false && zone === "carts") {
       player.pos = [canvas.width / 2, canvas.height - 45];
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
             player.sprite.url = 'img/book_burgundy.png';
             player.pos = [canvas.width / 2, canvas.height - 45];
           
            if (startId === null && Object.keys(gameObjs).length > 0) {
                reset();
            } else if (startId === null && Object.keys(gameObjs).length === 0) {
                gameOver();
            }
        }
    }

    checkCarts(dt);
    
    // Collision with students
    for (i = 0; i < students.length; i += 1) {
        pos = students[i].pos;
        size = students[i].sprite.size;
        
        if (debugMode === false && boxCollides(pos, size, player.pos, player.sprite.size)) {
             player.pos = [canvas.width / 2, canvas.height - 45];
        }
    }

    for (i = 0; i < right_students.length; i += 1) {
        pos = right_students[i].pos;
        size = right_students[i].sprite.size;

        if (debugMode === false && boxCollides(pos, size, player.pos, player.sprite.size)) {
            player.pos = [canvas.width / 2, canvas.height - 45];
        }
    }
}
var old = 0;
var oldUpper = 0;
var oldHigher = 0;
function cartSpace(old, end) {
    if ((end - old) < (cartSpeed * 7.9)) {
        return true;
    }
    return false;
}
var lastCartPos = 0;
var oldTime = 0;
var upperTime = 0;
var foo = false;

function randomIntFromInterval(min,max)
{
    return Math.floor(Math.random()*(max-min+1)+min);
}
function update(dt) {
    gameTime += dt;
    oldTime += dt;
    upperTime += dt;
    //console.log(dt);
   //oldTime = gameTime;
    var start = new Date().getTime();
    handleInput(dt);
    updateEntities(dt);
    //var calcTime = 1 - Math.pow(0.993, gameTime),
    var rand = Math.random(),
        cSprite,
        lSprite,
        rSprite,
        cartOffset = 0,
        skipCart = false,
        skipUpperCart = false,
        skipHigherCart = false;
        
   if (oldTime > (cartWidth / cartSpeed)) {
       oldTime = 0;
       cSprite = cartSprites[Math.floor(Math.random() * cartSprites.length)];
       cartOffset = randomIntFromInterval(0, cartWidth);
            if (cartOffset > 0) {
                  oldTime = 0 - ((cartOffset / cartWidth) * (cartWidth / cartSpeed));
            }
          
        carts.push({
            pos: [canvas.width + cartOffset, canvas.height - cartRows[0]],
            sprite: new Sprite(cSprite, [0, 0], [120, 40], 6, [0, 1])
        });
       
   }
   
   if (upperTime > (cartWidth / upperSpeed)) {
        upperTime = 0;
       cSprite = cartSprites[Math.floor(Math.random() * cartSprites.length)];
        cartOffset = randomIntFromInterval(0, cartWidth);
         if (cartOffset > 0) {
                 upperTime = 0 - ((cartOffset / cartWidth) * (cartWidth / upperSpeed));
            }
      
        carts.push({
            pos: [canvas.width + cartOffset, canvas.height - cartRows[1]],
            sprite: new Sprite(cSprite, [0, 0], [cartWidth, cartHeight], 6, [0, 1])
        });
       
   }
   
   if (Math.random() < cartRateHigher) {
       if (oldHigher === 0) {
           oldHigher = new Date().getTime();
       } else {
           var end = new Date().getTime();
           skipHigherCart = cartSpace(oldHigher, end);
           oldHigher = end;
       }
       cSprite = cartSprites[Math.floor(Math.random() * cartSprites.length)];
        if (skipHigherCart === false) {
        carts.push({
            pos: [canvas.width + cartOffset, canvas.height - cartRows[2]],
            sprite: new Sprite(cSprite, [0, 0], [cartWidth, cartHeight], 6, [0, 1])
        });
        }
   }
   
    if (rand < addRate) {
        lSprite = leftSprites[Math.floor(Math.random() * leftSprites.length)];
        students.push({
            pos: [canvas.width, canvas.height - cartY(leftYChoices)],
            //sprite: new Sprite(lSprite, [0, 0], [20, 20], 6, [0, 1])
              sprite: new Sprite(lSprite, [0, 0], [studentWidth, studentHeight], 6, [0, 1])
        });

        rSprite = rightSprites[Math.floor(Math.random() * rightSprites.length)];
        right_students.push({
            pos: [0, canvas.height - cartY(rightYChoices)],
            //sprite: new Sprite(rSprite, [0, 0], [20, 20], 6, [0, 1])
             sprite: new Sprite(rSprite, [0, 0], [studentWidth, studentHeight], 6, [0, 1])
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
    var words = text.split(' ');
    var line = '';
    
    for(var n = 0; n < words.length; n++) {
        var testLine = line + words[n] + ' ';
        var metrics = context.measureText(testLine);
        var testWidth = metrics.width;
        if (testWidth > maxWidth && n > 0) {
            context.fillText(line, x, y);
            line = words[n] + ' ';
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
        //ctx.fillText(currentGame[i],x + 10,20);
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
    renderEntities(students);
    renderEntities(right_students);
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

    document.getElementById('game-over').style.display = 'none';
    document.getElementById('game-over-overlay').style.display = 'none';
    //Pick a randowm game
    gameName = pickRandomProperty(gameObjs);
    document.getElementById('game-name').innerHTML = gameName;
    currentGame = gameObjs[gameName];
    sideHopLength = (canvasWidth / currentGame.length) / 2;
    delete gameObjs[gameName];
    playPieces = {};
    makePlayPieces ();
    isGameOver = false;
    gameTime = 0;
    carts = [];
    students = [];
    right_students = [];
    splats = [];
    slots = [];
    smileys = [];
    startId = startPlayer();
    //player.id = startPlayer();
    //player.sprite.url = 'img/' + player.id + '.png';
    player.sprite.url = 'img/book_burgundy.png';
    player.pos = [canvas.width / 2, canvas.height - 45];
    if (mySound === undefined) {
         mySound = new Sound("frogger.ogg");
        mySound.play();
    }
}

function init() {
    document.getElementById('play-again').addEventListener('click', function () {
        scoreTracker = {};
        scoreEl.innerHTML = 0;
        reset();
    });

    reset();
    lastTime = Date.now();
    main();
}

resources.load([
    'img/sprites.png',
    'img/terrain.png',
    'img/chapter.png',
    'img/yellow_cart.png',
    'img/red_cart.png',
    'img/blue_cart.png',
    'img/music_student_sprite.png',
    'img/green_squashed.png',
    'img/funky_student_sprite.png',
    'img/blonde_student.png',
    'img/afro_student.png',
    'img/smiley.png',
    'img/author.png',
    'img/place.png',
    'img/year.png',
    'img/title.png',
    'img/publisher.png',
    'img/frowny.png',
    'img/yellow_cart_2.png',
    'img/chapter_2.png',
    'img/book_35.png',
    'img/blonde_student@40.png',
    'img/music_student@2.png',
     'img/blonde_student@35.png',
     'img/music_student@30.png',
     'img/music_student@40.png',
     'img/afro_student@40.png',
     'img/funky_student@30.png',
     'img/funky_student@40.png',
     'img/book_burgundy.png'
]);
resources.onReady(init);
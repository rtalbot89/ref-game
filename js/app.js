/*global window, document, input, Sprite, resources */
"use strict";

// Rate at which entities are added to the game
// Higher values means more frequent updates
// 0.03 seems fast 0.005 is slow enough for development
var addRate = 0.01;
var cartRateLower = 0.03;
var cartRateUpper = 0.03;
// Speed in pixels per second
var playerSpeed = 500;
var studentSpeed = 60;
var cartSpeed = 120;
var mySound;
var gameTime;
var hopTracker = 0;
var carts = [];
var students = [];
var right_students = [];
var splats = [];
var slots = [];
var smileys = [];
var gameTime = 0;
var terrainPattern;
var score = 0;
var totalScore = 0;
var scoreEl = document.getElementById('score');
// Height of 'home' slots
var slotHeight = 60;
var isGameOver = false;
var hopLength = 70;
// entity vertical levels
//larger values are higher up
var items = [120, 190];
var cartRows = [120, 190];
//var items = [115];
//left to right
var rightYChoices = [290,355, 390];
//right to left
//var leftYChoices = [290, 323, 353, 390];
var leftYChoices = [290, 355, 390];

var canvasWidth = 680;
var canvasHeight = 480;
var homeHeight = 80;
var homeBorder = 10;


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
    ["Author/s.", "(Year)", "Article Title.", "Journal Name,", "Volume", "(Issue no.)", "Page nos."]
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
// get a random game
//var currentGame = games[Math.floor(Math.random() * games.length)];
//var dgame = pickRandomProperty(gameObjs);
//console.log(dgame);
//console.log(gameObjs[dgame]);
//delete gameObjs[dgame];
//console.log(gameObjs);
var currentGame;
var playedGames = [];

// Game state
// Track used up players
//var playerTracker = currentGame.slice(0);
var playPieces = {};

function makePlayPieces () {
    for (var i = 0; i < currentGame.length; i++){
        playPieces[currentGame[i]] = i;
    }
}

//makePlayPieces();

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
    //console.log('pick game');
    var game;
    if (Object.keys(gameObjs).length > 0) {
        game = pickRandomProperty(gameObjs);
        //delete gameObjs[game];
        return game;
    } else {
        gameOver();
    }
}
function startPlayer() {
    //console.log(playPieces);
    if (Object.keys(playPieces).length === 0) {
        //console.log('no more pieces');
        return null;
        // gameOver();
      // reset();
    } else {
        var randomPiece = pickRandomProperty(playPieces);
        delete playPieces[randomPiece];
        //console.log('random piece: ' + randomPiece);
        return randomPiece;
    }
}

var startId;
var player = {
    onCart: false,
    pos: [0, 0],
    id: startId,
    //sprite: new Sprite('img/' + startId + '.png', [0, 0], [30, 26], 10, [0, 1])
    sprite: new Sprite('img/book_35.png', [0, 0], [30, 30], 3, [0, 1])
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
document.getElementById("game-div").appendChild(canvas);

// Zones. These are just heights
var homeZone = canvasHeight - homeHeight;


// Alternative images for randomisation
//var rightSprites = ['img/funky_student_sprite.png', 'img/blonde_student.png'];
var rightSprites = ['img/blonde_student@35.png','img/funky_student@30.png'];
//var leftSprites = ['img/music_student_sprite.png', 'img/afro_student.png'];
var leftSprites = ['img/music_student@30.png','img/afro_student@30.png'];
//var cartSprites = ['img/yellow_cart.png', 'img/red_cart.png', 'img/blue_cart.png',];
var cartSprites = ['img/yellow_cart_2.png'];


// Keeping score
var scoreTracker = {};

// The main game loop
var lastTime;

function hopper(tracker) {
    if (tracker  === 0) {
        hopTracker = 65;
        return 65;
        
    }
    if (tracker === 65) {
        //hopTracker = 0;
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
function sideHop (){
    
}

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
        player.pos[1] = canvas.height - player.sprite.size[1];
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

function currentScore(scoreTracker) {
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
    scoreTracker[id] = score;
    var total = 0;

    for (i = 0; i < slots.length; i += 1) {
        if (scoreTracker[slots[i].slotId] !== undefined) {
            if (scoreTracker[slots[i].slotId] === 1) {
                sprite = new Sprite('img/smiley.png', [0, 0], [20, 20], 1, [0], null, true);
                total += 1;
            }

            if (scoreTracker[slots[i].slotId] === 0) {
                sprite = new Sprite('img/frowny.png', [0, 0], [20, 20], 1, [0], null, true);
                total -= 1;
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
    totalScore += total;
    scoreEl.innerHTML = totalScore;
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
    if (pos[1] < (canvas.height - 60) && pos[1] > ((canvas.height / 2) + 20)) {
        zone = "carts";
        return zone;
    }
    if (pos[1] > (canvas.height - 60)) {
        //console.log('home zone' + pos[1]);
        zone = "home";
        return zone;
    }
    // ctx.fillRect(0, (canvas.height / 2) - 20, canvas.width, 40);
     if (pos[1] > ((canvas.height / 2) - 20) && pos[1] < ((canvas.height / 2) + 20)) {
        //console.log('midzone' + pos[1]);
        zone = "midzone";
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
    //console.log(zone);
    if (anyPress(player) === false && player.onCart === false && zone === "carts") {
       //player.pos = [canvas.width / 2, canvas.height - 45];
    }
    else if (anyPress(player) === true && player.onCart === false && zone === "carts") {
      //endAndStartTimer(0);
    }

    // Collision for slots
    for (i = 0; i < slots.length; i += 1) {
        pos = slots[i].pos;
        size = slots[i].size;

        if (slotCollides(pos, size, player.pos, player.sprite.size, slots[i].slotId, player.id)) {
            score = 0;
            //console.log(slots[i].slotId);
            //console.log(player.id);
            if (slots[i].slotId === startId) {
                score += 1;
                //playerTracker.splice(playerTracker.indexOf(startId), 1);
                startId = startPlayer();
                player.sprite.url = 'img/book_35.png';
                player.pos = [canvas.width / 2, canvas.height - 45];
                
            }
            if (startId !== null) {
                 scoreTracker[slots[i].slotId] = score;
                   updateScore(score, slots[i].slotId);
                   //scoreEl.innerHTML = score;
                
            } else if (startId === null && Object.keys(gameObjs).length > 0) {
                //console.log('no start id');
                reset();
               // gameOver();
            } else {
                gameOver();
            }
           
           //scoreEl.innerHTML = score;
         
           // player.id = startPlayer();
            //renderSlots();
            //console.log(player.id);
            //player.sprite.url = 'img/' + player.id + '.png';
            
        }
    }

    checkCarts(dt);
    
    // Collision with students
    for (i = 0; i < students.length; i += 1) {
        pos = students[i].pos;
        size = students[i].sprite.size;
        
        if (boxCollides(pos, size, player.pos, player.sprite.size)) {
             //player.pos = [canvas.width / 2, canvas.height - 45];
           /* splats.push(
                {
                    pos: pos,
                    sprite: new Sprite('img/green_squashed.png', [0, 0], [34, 16], 1, [0], null, true)
                }
            );
            gameOver();
            */
        }
    }

    for (i = 0; i < right_students.length; i += 1) {
        pos = right_students[i].pos;
        size = right_students[i].sprite.size;

        if (boxCollides(pos, size, player.pos, player.sprite.size)) {
             player.pos = [canvas.width / 2, canvas.height - 45];
            /*
            splats.push(
                {
                    pos: pos,
                    sprite: new Sprite('img/green_squashed.png',
                        [0, 0],
                        [34, 16],
                        1,
                        [0],
                        null,
                        true)
                }
            );
            gameOver();
            */
        }
    }
}
var old = 0;
var oldUpper = 0;
function cartSpace(old, end) {
    if ((end - old) < (cartSpeed * 7.9)) {
        return true;
    }
    return false;
}

function update(dt) {
    gameTime += dt;
    var start = new Date().getTime();
    handleInput(dt);
    updateEntities(dt);
    //var calcTime = 1 - Math.pow(0.993, gameTime),
    var rand = Math.random(),
        cSprite,
        lSprite,
        rSprite;
   var cartOffset = 0;
   var skipCart = false;
   var skipUpperCart = false;
   
   if (Math.random() < cartRateLower) {
       if (old === 0) {
           old = new Date().getTime();
       } else {
           var end = new Date().getTime();
           skipCart = cartSpace(old, end);
           old = end;
       }
       cSprite = cartSprites[Math.floor(Math.random() * cartSprites.length)];
        if (skipCart === false) {
        carts.push({
            pos: [canvas.width + cartOffset, canvas.height - cartRows[0]],
            sprite: new Sprite(cSprite, [0, 0], [120, 40], 6, [0, 1])
        });
        }
   }
   
   if (Math.random() < cartRateUpper) {
       if (oldUpper === 0) {
           oldUpper = new Date().getTime();
       } else {
           var end = new Date().getTime();
           skipUpperCart = cartSpace(oldUpper, end);
           oldUpper = end;
       }
       cSprite = cartSprites[Math.floor(Math.random() * cartSprites.length)];
        if (skipUpperCart === false) {
        carts.push({
            pos: [canvas.width + cartOffset, canvas.height - cartRows[1]],
            sprite: new Sprite(cSprite, [0, 0], [120, 40], 6, [0, 1])
        });
        }
   }
   
    if (rand < addRate) {
        lSprite = leftSprites[Math.floor(Math.random() * leftSprites.length)];
        students.push({
            pos: [canvas.width, canvas.height - cartY(leftYChoices)],
            //sprite: new Sprite(lSprite, [0, 0], [20, 20], 6, [0, 1])
              sprite: new Sprite(lSprite, [0, 0], [30, 30], 6, [0, 1])
        });

        rSprite = rightSprites[Math.floor(Math.random() * rightSprites.length)];
        right_students.push({
            pos: [0, canvas.height - cartY(rightYChoices)],
            //sprite: new Sprite(rSprite, [0, 0], [20, 20], 6, [0, 1])
             sprite: new Sprite(rSprite, [0, 0], [30, 30], 6, [0, 1])
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
       
        ctx.font = "20px DPComic";
        //ctx.fillText(currentGame[i],x + 10,20);
        wrapText(ctx, currentGame[i], x + 5, y + 20, width - 5, 20);
        slot = new Component({ pos: [x, y], size: [width, height], slotId: currentGame[i] });
        slots.push(slot);
    }
}

// Draw everything
function render() {

    //ctx.fillStyle = terrainPattern;
    ctx.fillStyle = "green";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw the scene
    ctx.fillStyle = "gold";
    
    ctx.fillRect(0, (canvas.height / 2) - 20, canvas.width, 40);
    ctx.fillStyle = "LightGoldenRodYellow";
    ctx.fillRect(0, 0, canvas.width, slotHeight);
   
    
    ctx.fillStyle = "DarkGoldenRod";
    ctx.fillRect(0, canvas.height - (homeHeight - (homeBorder * 2)), canvas.width, homeBorder);
    ctx.fillStyle = "black";
    ctx.fillRect(0, canvas.height - (homeHeight - (homeBorder * 3)), canvas.width, homeHeight - (homeBorder * 3));
    ctx.fillStyle = "DarkGoldenRod";
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
    if(Object.keys(gameObjs).length === 0) {
        gameOver();
        
    }
  
    console.log('reset ran');
    
    document.getElementById('game-over').style.display = 'none';
    document.getElementById('game-over-overlay').style.display = 'none';
    var gn = Object.keys(gameObjs)[Math.floor(Math.random() * Object.keys(gameObjs).length)];
    console.log(gn);
    gameName = pickRandomProperty(gameObjs);
    playedGames.push(gameName);
    document.getElementById('game-name').innerHTML =' - ' + gameName;
   // currentGame = games[Math.floor(Math.random() * games.length)];
   // play a game we havent used
    //console.log(gameName);
    currentGame = gameObjs[gameName];
    sideHopLength = (canvasWidth / currentGame.length) / 2;
    delete gameObjs[gameName];
    playPieces = {};
    makePlayPieces ();
    //playerTracker = currentGame.slice(0);
    scoreTracker = {};
    isGameOver = false;
    gameTime = 0;
    score = 0;
    scoreEl.innerHTML = 0;
    carts = [];
    students = [];
    right_students = [];
    splats = [];
    slots = [];
    smileys = [];
    startId = startPlayer();
    //player.id = startPlayer();
    //player.sprite.url = 'img/' + player.id + '.png';
    player.sprite.url = 'img/book_35.png';
    player.pos = [canvas.width / 2, canvas.height - 45];
    if (mySound === undefined) {
         mySound = new Sound("frogger.ogg");
        mySound.play();
        
    }
   
}

function init() {
    //terrainPattern = ctx.createPattern(resources.get('img/terrain.png'), 'repeat');
    document.getElementById('play-again').addEventListener('click', function () {
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
    'img/blonde_student@2.png',
    'img/music_student@2.png',
     'img/blonde_student@35.png',
     'img/music_student@30.png',
     'img/afro_student@30.png',
     'img/funky_student@30.png',
     

]);
resources.onReady(init);
var originalPlayerPos = player.pos.slice(0);
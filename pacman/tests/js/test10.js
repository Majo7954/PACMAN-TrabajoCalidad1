var canvas = document.querySelector("canvas");
var ctx = canvas.getContext("2d");
var w = canvas.width;
var h = canvas.height;

function drawCharacter(ctx, x, y, width, height, color) {
    ctx.beginPath();
    ctx.moveTo(x, y + height);
    ctx.quadraticCurveTo(x + (width / 2), y / 1, x + width, y + height);
    ctx.fillStyle = color;
    ctx.closePath();
    ctx.fill();
}

function moveCharacter(character, speed, checkCollisionFn) {
    character.nearestRow = Math.floor((character.y + character.radius) / thisGame.TILE_HEIGHT);
    character.nearestCol = Math.floor((character.x + character.radius) / thisGame.TILE_WIDTH);

    if (!checkCollisionFn(character)) {
        character.x += character.velX;
        character.y += character.velY;
    } else {
        character.velX = 0;
        character.velY = 0;
    }
}

var GF = function(){
    var frameCount = 0;
    var lastTime;
    var fpsContainer;
    var fps;
    var inputStates = { left: false, up: false, right: false, down: false, space: false };

    const TILE_WIDTH = 24, TILE_HEIGHT = 24;
    var numGhosts = 4;
    var ghostcolor = {
        0: "rgba(255, 0, 0, 255)",
        1: "rgba(255, 128, 255, 255)",
        2: "rgba(128, 255, 255, 255)",
        3: "rgba(255, 128, 0, 255)",
        4: "rgba(50, 50, 255, 255)", 
        5: "rgba(255, 255, 255, 255)" 
    };

    var ghosts = {};

    function createCharacterMovementClass(ghost = false) {
        return function() {
            this.x = 0;
            this.y = 0;
            this.velX = 0;
            this.velY = 0;
            this.speed = 1;
            this.nearestRow = 0;
            this.nearestCol = 0;
            this.ctx = ctx;
            this.id = ghost ? 0 : undefined; 
            this.homeX = 0;
            this.homeY = 0;

            this.draw = function() {
                drawCharacter(this.ctx, this.x, this.y, TILE_WIDTH, TILE_HEIGHT, ghostcolor[this.id]);
                
                // Ojos
                this.ctx.fillStyle = '#fff';
                this.ctx.beginPath();
                this.ctx.arc(this.x + (TILE_WIDTH / 4), this.y + (TILE_WIDTH / 2), 4, 0, 2 * Math.PI, true);
                this.ctx.fill();
                this.ctx.beginPath();
                this.ctx.arc(this.x + (2 * TILE_WIDTH / 4), this.y + (TILE_WIDTH / 2), 4, 0, 4 * Math.PI, true);
                this.ctx.fill();
            };

            this.move = function() {
                this.nearestRow = Math.floor((this.y + thisGame.TILE_HEIGHT / 2) / thisGame.TILE_HEIGHT);
                this.nearestCol = Math.floor((this.x + thisGame.TILE_WIDTH / 2) / thisGame.TILE_WIDTH);

                var posiblesMovimientos = [[0,-this.speed], [this.speed, 0], [0, this.speed], [-this.speed, 0]];
                var soluciones = [];

                for (var i = 0; i < posiblesMovimientos.length; i++) {
                    if (!thisLevel.checkIfHitWall(this.x + posiblesMovimientos[i][0], this.y + posiblesMovimientos[i][1], this.nearestRow, this.nearestCol))
                        soluciones.push(posiblesMovimientos[i]);
                }

                if (thisLevel.checkIfHitWall(this.x + this.velX, this.y + this.velY, this.nearestRow, this.nearestCol) || soluciones.length == 3) {
                    var pos = Math.round(Math.random() * (soluciones.length - 1));
                    this.velX = soluciones[pos][0];
                    this.velY = soluciones[pos][1];
                } else {
                    thisLevel.checkIfHitSomething(this, this.x, this.y, this.nearestRow, this.nearestCol);
                }
                this.x += this.velX;
                this.y += this.velY;
            };
        };
    }

    var Ghost = createCharacterMovementClass(true);
    var Pacman = createCharacterMovementClass(false);

    var player = new Pacman();
    for (var i = 0; i < numGhosts; i++) {
        ghosts[i] = new Ghost();
    }

    var thisGame = {
        getLevelNum: function() {
            return 0;
        },
        screenTileSize: [24, 21],
        TILE_WIDTH: 24,
        TILE_HEIGHT: 24
    };

    // Level object
    var Level = function(ctx) {
        this.ctx = ctx;
        this.lvlWidth = 0;
        this.lvlHeight = 0;
        this.map = [];
        this.pellets = 0;
        this.powerPelletBlinkTimer = 0;

        this.setMapTile = function(row, col, newValue) {
            if (this.map[row]) {
                this.map[row][col] = newValue;
            }
        };

        this.getMapTile = function(row, col) {
            if (this.map[row]) {
                return this.map[row][col];
            }
        };

        this.printMap = function() {
            for (var i = 0; i < thisLevel.lvlHeight; i++) {
                var current = '';
                for (var j = 0; j < thisLevel.lvlWidth; j++) {
                    current += thisLevel.getMapTile(i, j) + ' ';
                }
                console.log(current);
            }
        };

        this.loadLevel = function() {
            $.get("https://raw.githubusercontent.com/AinhoY/froga/main/1.txt", (data) => {
                var trozos = data.split("#");
                this.lvlWidth = trozos[1].split(" ")[2];
                this.lvlHeight = trozos[2].split(" ")[2];
                var valores = trozos[3].split("\n");
                var filas = valores.slice(1, valores.length - 1);
                for (var i = 0; i < filas.length; i++) {
                    var current = filas[i].split(" ");
                    this.map[i] = [];
                    for (var j = 0; j < current.length; j++) {
                        if (current[j] != "") {
                            this.setMapTile(i, j, parseInt(current[j]));
                        }
                    }
                }
            });
        };

        this.drawMap = function() {
            var TILE_WIDTH = thisGame.TILE_WIDTH;
            var TILE_HEIGHT = thisGame.TILE_HEIGHT;

            var tileID = {
                'door-h': 20,
                'door-v': 21,
                'pellet-power': 3
            };

            if (this.powerPelletBlinkTimer < 60) {
                this.powerPelletBlinkTimer++;
            } else {
                this.powerPelletBlinkTimer = 0;
            }

            for (var row = 0; row < thisGame.screenTileSize[0]; row++) {
                for (var col = 0; col < thisGame.screenTileSize[1]; col++) {
                    var type = this.getMapTile(row, col);
                    if (type == 4) {
                        player.homeX = col * TILE_WIDTH;
                        player.homeY = row * TILE_HEIGHT;
                    } else if (type == 2) {
                        ctx.beginPath();
                        ctx.arc(col * TILE_WIDTH + (TILE_WIDTH / 2), row * TILE_HEIGHT + (TILE_HEIGHT / 2), 4, 0, 2 * Math.PI, false);
                        ctx.fillStyle = "#FFFFFF";
                        ctx.stroke();
                        ctx.fill();
                        thisLevel.pellets++;
                    } else if (type == 3) {
                        if (this.powerPelletBlinkTimer < 30) {
                            ctx.beginPath();
                            ctx.arc(col * TILE_WIDTH + (TILE_WIDTH / 2), row * TILE_HEIGHT + (TILE_HEIGHT / 2), 4, 0, 2 * Math.PI, false);
                            ctx.fillStyle = "#FF0000";
                            ctx.fill();
                            this.powerPelletBlinkTimer++;
                        }
                    }
                }
            }
        };
    };

    var thisLevel = new Level(canvas.getContext("2d"));
    thisLevel.loadLevel(thisGame.getLevelNum());

    var measureFPS = function(newTime) {
        if (lastTime === undefined) {
            lastTime = newTime;
            return;
        }

        var diffTime = newTime - lastTime;
        if (diffTime >= 1000) {
            fps = frameCount;
            frameCount = 0;
            lastTime = newTime;
        }
        fpsContainer.innerHTML = 'FPS: ' + fps;
        frameCount++;
    };

    var clearCanvas = function() {
        ctx.clearRect(0, 0, w, h);
    };

    var checkInputs = function() {
        if (inputStates.left) {
            if (!thisLevel.checkIfHitWall(player.x - player.speed, player.y, player.nearestRow, player.nearestCol)) {
                player.velY = 0;
                player.velX = -player.speed;
                inputStates.up = false;
                inputStates.down = false;
                inputStates.right = false;
            } else {
                inputStates.up = false;
                inputStates.left = false;
                inputStates.right = false;
                inputStates.down = false;
            }
        }
    };

    var mainLoop = function(time) {
        measureFPS(time);
        checkInputs();
        for (var i = 0; i < numGhosts; i++) {
            ghosts[i].move();
        }

        player.move();
        clearCanvas();
        thisLevel.drawMap();
        for (var i = 0; i < numGhosts; i++) {
            ghosts[i].draw();
        }
        player.draw();
        requestAnimationFrame(mainLoop);
    };

    var addListeners = function() {
        window.addEventListener('keydown', (event) => {
            const keyName = event.key;
            if (keyName === 'ArrowDown') inputStates.down = true;
            else if (keyName === 'ArrowLeft') inputStates.left = true;
            else if (keyName === 'ArrowRight') inputStates.right = true;
            else if (keyName === 'ArrowUp') inputStates.up = true;
            else if (keyName === ' ') inputStates.space = true;
        });

        window.addEventListener('keyup', (event) => {
            const keyName = event.key;
            if (keyName === 'ArrowDown') inputStates.down = false;
            else if (keyName === 'ArrowLeft') inputStates.left = false;
            else if (keyName === 'ArrowRight') inputStates.right = false;
            else if (keyName === 'ArrowUp') inputStates.up = false;
            else if (keyName === ' ') inputStates.space = false;
        });
    };

    var reset = function() {
        inputStates.right = true;
        player.velY = 0;
        player.velX = player.speed;
        player.x = player.homeX;
        player.y = player.homeY;
        player.nearestCol = parseInt(this.x / thisGame.TILE_WIDTH);
        player.nearestRow = parseInt(this.y / thisGame.TILE_HEIGHT);

        for (var i = 0; i < numGhosts; i++) {
            ghosts[i].x = ghosts[i].homeX;
            ghosts[i].y = ghosts[i].homeY;
            ghosts[i].velY = 0;
            ghosts[i].velX = -ghosts[i].speed;
        }
    };

    var start = function() {
        fpsContainer = document.createElement('div');
        document.body.appendChild(fpsContainer);
        addListeners();
        thisLevel.drawMap();
        reset();
        requestAnimationFrame(mainLoop);
    };

    return { start: start };
};

var game = new GF();
$(document).ajaxStop(function() { game.start(); });

test('Choque con fantasmas', function(assert) {
    var done = assert.async();
    setTimeout(function() {
        var playerX = 240, playerY = 555, x = 23, y = 10, holgura = 10;
        assert.ok(thisLevel.checkIfHit(playerX, playerY, x, y, holgura) == false, "NO hay choque");

        playerX = 240, playerY = 555, x = 235, y = 550, holgura = 10;
        assert.ok(thisLevel.checkIfHit(playerX, playerY, x, y, holgura) == true, "Hay choque");

        playerX = 240, playerY = 555, x = 235, y = 566, holgura = 10;
        assert.ok(thisLevel.checkIfHit(playerX, playerY, x, y, holgura) == false, "No hay choque");

        done();
    }, 1000);
});
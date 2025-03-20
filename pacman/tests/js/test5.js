//<![CDATA[

// Variables globales de utilidad
const canvas = document.querySelector("canvas");
const ctx = canvas.getContext("2d");
const w = canvas.width;
const h = canvas.height;

// Función para dibujar un personaje genérico
function drawCharacter(ctx, x, y, width, height, color) {
    ctx.beginPath();
    ctx.moveTo(x, y + height);
    ctx.quadraticCurveTo(x + (width / 2), y / 1, x + width, y + height);
    ctx.fillStyle = color;
    ctx.closePath();
    ctx.fill();
}

// Función de movimiento genérica para todos los personajes
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

// Generalizar la lógica de entrada para movimiento
function handleMovementInput(inputStates, character) {
    if (inputStates.right) {
        character.velY = 0;
        character.velX = character.speed;
    } else if (inputStates.left) {
        character.velY = 0;
        character.velX = -character.speed;
    } else if (inputStates.up) {
        character.velY = -character.speed;
        character.velX = 0;
    } else if (inputStates.down) {
        character.velY = character.speed;
        character.velX = 0;
    } else {
        character.velX = 0;
        character.velY = 0;
    }
}

// Medir FPS
function measureFPS(newTime) {
    if (lastTime === undefined) {
        lastTime = newTime;
        return;
    }

    const diffTime = newTime - lastTime;
    if (diffTime >= 1000) {
        fps = frameCount;
        frameCount = 0;
        lastTime = newTime;
    }
    fpsContainer.innerHTML = 'FPS: ' + fps;
    frameCount++;
}

// GAME FRAMEWORK
var GF = function() {
    var frameCount = 0;
    var lastTime;
    var fpsContainer;
    var fps;
    var inputStates = { left: false, up: false, right: false, down: false, space: false };

    const TILE_WIDTH = 24, TILE_HEIGHT = 24;
    const numGhosts = 4;
    const ghostColors = {
        0: "rgba(255, 0, 0, 255)",
        1: "rgba(255, 128, 255, 255)",
        2: "rgba(128, 255, 255, 255)",
        3: "rgba(255, 128, 0, 255)",
        4: "rgba(50, 50, 255, 255)", // blue, vulnerable ghost
        5: "rgba(255, 255, 255, 255)" // white, flashing ghost
    };

    // Crear personaje genérico (Pacman o Ghost)
    function createCharacter(id = null) {
        return {
            x: 0,
            y: 0,
            velX: 0,
            velY: 0,
            speed: 5,
            radius: id !== null ? 15 : 20, // Pacman o Ghost
            nearestRow: 0,
            nearestCol: 0,
            ctx: ctx,
            id: id,
            homeX: 0,
            homeY: 0,

            // Función de dibujo común para todos los personajes
            draw() {
                const color = id !== null ? ghostColors[this.id] : '#FFFF00'; // Ghosts vs Pacman color
                drawCharacter(this.ctx, this.x, this.y, TILE_WIDTH, TILE_HEIGHT, color);

                // Dibujar ojos para los fantasmas
                if (id !== null) {
                    this.ctx.fillStyle = '#fff';
                    this.ctx.beginPath();
                    this.ctx.arc(this.x + (TILE_WIDTH / 4), this.y + (TILE_WIDTH / 2), 4, 0, 2 * Math.PI, true);
                    this.ctx.fill();
                    this.ctx.beginPath();
                    this.ctx.arc(this.x + (2 * TILE_WIDTH / 4), this.y + (TILE_WIDTH / 2), 4, 0, 4 * Math.PI, true);
                    this.ctx.fill();
                }
            },

            // Función común de movimiento
            move() {
                this.nearestRow = Math.floor((this.y + thisGame.TILE_HEIGHT / 2) / thisGame.TILE_HEIGHT);
                this.nearestCol = Math.floor((this.x + thisGame.TILE_WIDTH / 2) / thisGame.TILE_WIDTH);

                const posiblesMovimientos = [[0,-this.speed], [this.speed, 0], [0, this.speed], [-this.speed, 0]];
                let soluciones = [];

                for (let i = 0; i < posiblesMovimientos.length; i++) {
                    if (!thisLevel.checkIfHitWall(this.x + posiblesMovimientos[i][0], this.y + posiblesMovimientos[i][1], this.nearestRow, this.nearestCol)) {
                        soluciones.push(posiblesMovimientos[i]);
                    }
                }

                if (thisLevel.checkIfHitWall(this.x + this.velX, this.y + this.velY, this.nearestRow, this.nearestCol) || soluciones.length === 3) {
                    let pos = Math.round(Math.random() * (soluciones.length - 1));
                    this.velX = soluciones[pos][0];
                    this.velY = soluciones[pos][1];
                } else {
                    thisLevel.checkIfHitSomething(this, this.x, this.y, this.nearestRow, this.nearestCol);
                }
                this.x += this.velX;
                this.y += this.velY;
            }
        };
    }

    // Crear instancias de Pacman y Ghosts
    const Pacman = createCharacter();
    const ghosts = [];
    for (let i = 0; i < numGhosts; i++) {
        ghosts.push(createCharacter(i)); // Crear un ghost con un id único
    }

    const thisGame = {
        getLevelNum: function() { return 0; },
        screenTileSize: [24, 21],
        TILE_WIDTH: 24,
        TILE_HEIGHT: 24
    };

    // Nivel object
    const Level = function(ctx) {
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

        // Cargar el nivel desde un archivo
        this.loadLevel = function() {
            jQuery.ajax({
                url: "https://raw.githubusercontent.com/AinhoY/froga/main/1.txt",
                dataType: "text",
                success: function(data) {
                    const lineas = data.split("\n");
                    let inicio = false;
                    let fin = false;
                    let row = 0;
                    for (let i = 0; i < lineas.length; i++) {
                        if (lineas[i].includes("lvlwidth")) thisLevel.lvlWidth = lineas[i].split(" ").slice(-1).pop();
                        else if (lineas[i].includes("lvlheight")) thisLevel.lvlHeight = lineas[i].split(" ").slice(-1).pop();
                        else if (lineas[i].includes("startleveldata")) inicio = true;
                        else if (lineas[i].includes("endleveldata")) fin = true;
                        else if (inicio && !fin) {
                            const fila = lineas[i].split(" ");
                            for (let j = 0; j < fila.length; j++) {
                                if (fila[j] !== "") {
                                    if (!thisLevel.map[row]) thisLevel.map[row] = [];
                                    thisLevel.setMapTile(row, j, fila[j]);
                                }
                            }
                            row++;
                        }
                    }
                }
            });
        };
    };

    const thisLevel = new Level(canvas.getContext("2d"));
    thisLevel.loadLevel(thisGame.getLevelNum());

    // Función principal del juego
    const mainLoop = function(time) {
        measureFPS(time);
        handleMovementInput(inputStates, Pacman);
        clearCanvas();
        Pacman.move();
        Pacman.draw();
        ghosts.forEach(ghost => {
            ghost.move();
            ghost.draw();
        });
        requestAnimationFrame(mainLoop);
    };

    // Agregar eventos de teclado
    const addListeners = function() {
        window.addEventListener('keydown', (event) => {
            const keyName = event.key;
            inputStates.down = keyName === 'ArrowDown';
            inputStates.left = keyName === 'ArrowLeft';
            inputStates.right = keyName === 'ArrowRight';
            inputStates.up = keyName === 'ArrowUp';
            inputStates.space = keyName === ' ';
        });
    };

    const start = function() {
        fpsContainer = document.createElement('div');
        document.body.appendChild(fpsContainer);
        addListeners();
        Pacman.x = 0;
        Pacman.y = 0;
        Pacman.velY = 0;
        Pacman.velX = Pacman.speed;
        requestAnimationFrame(mainLoop);
    };

    return { start: start };
};

const game = new GF();
game.start();

test('Mapa correctamente cargado', function(assert) {
    const done = assert.async();
    setTimeout(function() {
        assert.ok(thisLevel.getMapTile(0, 9) == 113, "Line 0, Column 9: wall");
        assert.ok(thisLevel.getMapTile(24, 20) == 106, "Line 24, Column 21: wall");
        assert.ok(thisLevel.getMapTile(23, 1) == 2, "Line 23, Column 1 : pellet");
        assert.ok(thisLevel.getMapTile(22, 1) == 3, "Line 22, Column 1: power pellet");
        done();
    }, 1000);
});

//]]>

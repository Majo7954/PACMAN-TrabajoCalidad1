// Variables globales de utilidad
let canvas = document.querySelector("canvas");
let ctx = canvas.getContext("2d");
let w = canvas.width;
let h = canvas.height;
var oldDirecrion = "right"; // Esta variable nos permitirá en caso de que Pacman quisiera cambiar de dirección y que no se pueda, seguir por la misma dirección
// Se ha inicializado a right, porque pacman empieza moviendose hacia la derecha

// Incializar las variables de las puntuaciones
let puntos_comer_pildora = 10;
let comer_fantasmas = 100;

// GAME FRAMEWORK
let GF = function () {
	// variables para contar frames/s, usadas por measureFPS
	let frameCount = 0;
	let lastTime;
	let fpsContainer;
	let fps;


	//  variable global temporalmente para poder testear el ejercicio
	let inputStates = { left: false, up: false, right: false, down: false, space: false };

	const TILE_WIDTH = 24, TILE_HEIGHT = 24;
	const numGhosts = 4;
	const ghostcolor = {};
	ghostcolor[0] = "rgba(255, 0, 0, 255)";
	ghostcolor[1] = "rgba(255, 128, 255, 255)";
	ghostcolor[2] = "rgba(128, 255, 255, 255)";
	ghostcolor[3] = "rgba(255, 128, 0,   255)";

	ghostcolor[4] = "rgba(50, 50, 255,   255)"; // blue, vulnerable ghost
	ghostcolor[5] = "rgba(255, 255, 255, 255)"; // white, flashing ghost

	// hold ghost objects
	let ghosts = {};

	let Ghost = function (id, ctx) {

		this.x = 0;
		this.y = 0;
		this.velX = 0;
		this.velY = 0;
		this.speed = 1;

		this.nearestRow = 0;
		this.nearestCol = 0;

		this.ctx = ctx;

		this.id = id;
		this.homeX = 0;
		this.homeY = 0;

		this.state = Ghost.NORMAL;

		this.homeValuesSet = false; // Esta variable nos servirá para saber si los valores del fantasma ya están asignados

		this.draw = function () {

			// cuerpo
			if (this.state !== Ghost.SPECTACLES) {
				this.ctx.beginPath();
				this.ctx.moveTo(this.x, this.y + TILE_HEIGHT);
				this.ctx.quadraticCurveTo(this.x + (TILE_WIDTH / 2), this.y / 1, this.x + TILE_WIDTH, this.y + TILE_HEIGHT);

				if (this.state === Ghost.NORMAL) {
					this.ctx.fillStyle = ghostcolor[this.id];
				} else if (this.state === Ghost.VULNERABLE) {
					if (thisGame.ghostTimer > 100) {
						this.ctx.fillStyle = ghostcolor[4]; // azul
					} else {
						let lastDigit = thisGame.ghostTimer % 10
						if (6 > lastDigit > 0) {
							this.ctx.fillStyle = ghostcolor[4]; // azul
						} else {
							this.ctx.fillStyle = ghostcolor[5]; // blanco
						}
					}
				}

				this.ctx.closePath();
				this.ctx.fill();
			}

			this.ctx.closePath();
			this.ctx.fill();

			// ojo izquierdo
			this.ctx.fillStyle = '#fff';
			this.ctx.beginPath();
			this.ctx.arc(this.x + (TILE_WIDTH / 4), this.y + (TILE_WIDTH / 2), 4, 0, 2 * Math.PI, true);
			this.ctx.fill();
			// ojo izquierdo
			this.ctx.beginPath();
			this.ctx.arc(this.x + (2 * TILE_WIDTH / 4), this.y + (TILE_WIDTH / 2), 4, 0, 4 * Math.PI, true);
			this.ctx.fill();


		}; // draw

		this.move = function () {

			this.nearestRow = parseInt((this.y + thisGame.TILE_HEIGHT / 2) / thisGame.TILE_HEIGHT);
			this.nearestCol = parseInt((this.x + thisGame.TILE_WIDTH / 2) / thisGame.TILE_WIDTH);

			if (this.state !== Ghost.SPECTACLES) {

				let posiblesMovimientos = [[0, -this.speed], [this.speed, 0], [0, this.speed], [-this.speed, 0]];
				let soluciones = [];

				for (let i = 0; i < posiblesMovimientos.length; i++) {
					if (!thisLevel.checkIfHitWall(this.x + posiblesMovimientos[i][0], this.y + posiblesMovimientos[i][1], this.nearestRow, this.nearestCol))
						soluciones.push(posiblesMovimientos[i]);
				}

				if (thisLevel.checkIfHitWall(this.x + this.velX, this.y + this.velY, this.nearestRow, this.nearestCol) || soluciones.length === 3) {
					let pos = Math.round(Math.random() * (soluciones.length - 1));
					this.velX = soluciones[pos][0];
					this.velY = soluciones[pos][1];
				} else
					thisLevel.checkIfHitSomething(this, this.x, this.y, this.nearestRow, this.nearestCol);
				this.x += this.velX;
				this.y += this.velY;

			} else {
				if(this.x < this.homeX) this.x += this.speed;
				if(this.x > this.homeX) this.x -= this.speed;
				if(this.y < this.homeY) this.y += this.speed;
				if(this.y > this.homeY) this.y -= this.speed;
				if(this.x === this.homeX && this.y === this.homeY) {
					this.state = Ghost.NORMAL;
					this.velY = -this.speed;
				}
			}


		};

	}; // fin clase Ghost

	// static variables
	Ghost.NORMAL = 1;
	Ghost.VULNERABLE = 2;
	Ghost.SPECTACLES = 3;

	let Level = function (ctx) {
		this.ctx = ctx;
		this.lvlWidth = 0;
		this.lvlHeight = 0;

		this.map = [];

		this.pellets = 0;
		this.powerPelletBlinkTimer = 0;

		this.setMapTile = function (row, col, newValue) {
			if (this.map[row]) {
				this.map[row][col] = newValue;
			}
		};

		this.getMapTile = function (row, col) {
			if (this.map[row]) {
				return this.map[row][col];
			}
		};

		this.printMap = function () {
			for (let i = 0; i < thisLevel.lvlHeight; i++) {
				let current = '';
				for (let j = 0; j < thisLevel.lvlWidth; j++) {
					current += thisLevel.getMapTile(i, j) + ' ';
				}
				console.log(current)
			}
		};

		this.loadLevel = function () {
			$.get("https://raw.githubusercontent.com/AinhoY/froga/main/1.txt", (data) => {
				// Dividir por tipos
				let trozos = data.split("#");

				// Anchura
				this.lvlWidth = trozos[1].split(" ")[2];

				// Altura
				this.lvlHeight = trozos[2].split(" ")[2];

				// Valores del mapa
				let valores = trozos[3].split("\n");

				// Quitar el startleveldata
				let filas = valores.slice(1, valores.length - 1);
				for (let i = 0; i < filas.length; i++) {
					let current = filas[i].split(" ");
					this.map[i] = [];
					for (let j = 0; j < current.length; j++) {
						if (current[j] !== "") {
							console.log(current[j]);
							if(current[j] == 2) {
								thisLevel.pellets++;
								console.log("pellets: " + thisLevel.pellets)
							}
							this.setMapTile(i, j, parseInt(current[j]));
						}
					}
				}
			});

		};

		this.drawMap = function () {

			const TILE_WIDTH = thisGame.TILE_WIDTH;
			const TILE_HEIGHT = thisGame.TILE_HEIGHT;

			const tileID = {
				'door-h': 20,
				'door-v': 21,
				'pellet': 2,
				'pellet-power': 3,
				'pacman': 4,
				'walls-low-limit': 100,
				'walls-high-limit': 200,
				'ghosts-low-limit': 10,
				'ghosts-high-limit': 14,
			};

			if (this.powerPelletBlinkTimer < 60) {
				this.powerPelletBlinkTimer = this.powerPelletBlinkTimer + 1;
			} else {
				this.powerPelletBlinkTimer = 0;
			}


			for (let row = 0; row < thisGame.screenTileSize[0]; row++) {
				for (let col = 0; col < thisGame.screenTileSize[1]; col++) {
					let type = this.getMapTile(row, col);
					if (type === tileID['pacman']) {
						player.homeX = col * TILE_WIDTH;
						player.homeY = row * TILE_HEIGHT;
					} else if (type === tileID['pellet']) {
						//Pildora
						ctx.beginPath();
						ctx.arc(col * TILE_WIDTH + (TILE_WIDTH / 2), row * TILE_HEIGHT + (TILE_HEIGHT / 2), 4, 0, 2 * Math.PI, false);
						ctx.fillStyle = "#FFFFFF";
						ctx.stroke();
						ctx.fill();
					} else if (type === tileID['pellet-power']) {
						//Pildora de poder
						if (this.powerPelletBlinkTimer < 30) {
							ctx.beginPath();
							ctx.arc(col * TILE_WIDTH + (TILE_WIDTH / 2), row * TILE_HEIGHT + (TILE_HEIGHT / 2), 4, 0, 2 * Math.PI, false);
							ctx.fillStyle = "#FF0000";
							ctx.fill();
						}
					} else if (type >= tileID['walls-low-limit'] && type < tileID['walls-high-limit']) {
						//Pared
						ctx.beginPath();
						ctx.rect(col*TILE_WIDTH,row*TILE_WIDTH,TILE_WIDTH,TILE_HEIGHT);
						ctx.fillStyle = '#0000FF';
						ctx.closePath();
						ctx.fill();
					} else if (type >= tileID['ghosts-low-limit'] && type < tileID['ghosts-high-limit']) {
						if (!ghosts[type - 10].homeValuesSet) {
							ghosts[type - 10].homeX = col * TILE_WIDTH;
							ghosts[type - 10].homeY = row * TILE_HEIGHT;
							ghosts[type - 10].homeValuesSet = true;
						}
					}
				}
			}

			displayScore();

		};

		this.isWall = function (row, col) {
			let pos = thisLevel.getMapTile(row, col);
			return pos >= 100 && pos <= 199;
		};

		this.checkIfHitWall = function (possiblePlayerX, possiblePlayerY, row, col) {
			let wall = false;
			// Para mirar los bloques que lo rodean
			for (let r = row - 1; r < row + 2; r++) {
				for (let c = col - 1; c < col + 2; c++) {
					// Mirar si pacman está por pasar a otro bloque
					if ((Math.abs(possiblePlayerX - (c * thisGame.TILE_WIDTH)) < thisGame.TILE_WIDTH) && (Math.abs(possiblePlayerY - (r * thisGame.TILE_HEIGHT)) < thisGame.TILE_HEIGHT)) {
						if (this.isWall(r, c)) {
							wall = true;
							break;
						}
					}
				}
			}
			return wall;
		};

		this.checkIfHit = function (playerX, playerY, x, y, holgura) {
			return Math.abs(playerX - x) <= holgura && Math.abs(playerY - y) <= holgura;
		};

		this.checkIfHitSomething = function (instancia, playerX, playerY, row, col) {
			let tileID = {
				'door-h': 20,
				'door-v': 21,
				'pellet-power': 3,
				'pellet': 2
			};

			//  Gestiona la recogida de píldoras, normales y de poder
			// Comprobar que el que se las come es pacman
			if(instancia instanceof Pacman) {
				for (let r = row - 1; r < row + 2; r++) {
					for (let c = col - 1; c < col + 2; c++) {
						// Mirar si hemos tocado una píldora
						if ((Math.abs(playerX - (c * thisGame.TILE_WIDTH)) < 4) && (Math.abs(playerY - (r * thisGame.TILE_HEIGHT)) < 4)) {
							let valor = thisLevel.getMapTile(r, c);
							if (valor === tileID['pellet']) {
								thisLevel.setMapTile(r, c, 0);
								thisLevel.pellets--;
								console.log(thisLevel.pellets);
								thisGame.addToScore(puntos_comer_pildora);
								// let sound_eat_pellet = new Audio('../res/sounds/pacman_eatpill.wav');
								thisGame.sound_eat_pellet.play(); // si falla, descomentar arriba y borrar la declaracion de la 470 aprox
								if (thisLevel.pellets == 0) {
									console.log("Has ganado");
									thisGame.setMode(thisGame.WIN);
									// let sound_win = new Audio('../res/sounds/pacman_beginning.wav');
									thisGame.sound_win.play(); // si falla, descomentar arriba y borrar la declaracion de la 470 aprox
								}
							} else if (valor === tileID['pellet-power']) {
								thisLevel.setMapTile(r, c, 0);
								// let sound_eat_pellet = new Audio('../res/sounds/pacman_eatfruit.wav');
								thisGame.sound_eat_powerpellet.play(); // si falla, descomentar arriba y borrar la declaracion de la 470 aprox

								/* for (let ghost in ghosts){
                                    ghost['state'] = Ghost.VULNERABLE; }
                                Da warning: Value assigned to primitive will be lost, y no funciona */

								for (let i = 0; i < numGhosts; i++) {
									ghosts[i].state = Ghost.VULNERABLE;
									thisGame.ghostTimer = 360;
								}
							}
						}
					}
				}
			}

			// Gestiona las puertas teletransportadoras
			for (let r = row-1; r < row+2; r++) {
				for (let c = col-1; c < col+2; c++) {
					if((Math.abs(playerX - (c * thisGame.TILE_WIDTH)) < 8) && (Math.abs(playerY - (r * thisGame.TILE_HEIGHT)) < 8)) {
						let pos = thisLevel.getMapTile(r, c);
						if(pos === tileID['door-h']) {
							console.log("puerta horizontal");
							if(instancia.velX > 0) instancia.x -= (thisGame.screenTileSize[1]-2)*thisGame.TILE_WIDTH;
							else instancia.x += (thisGame.screenTileSize[1]-2)*thisGame.TILE_WIDTH;

						} else if(pos === tileID['door-v']) {
							console.log("puerta vertical");
							if(instancia.velY > 0) instancia.y -= (thisGame.screenTileSize[0]-2)*thisGame.TILE_HEIGHT;
							else instancia.y += (thisGame.screenTileSize[0]-2)*thisGame.TILE_HEIGHT;
						}
					}
				}
			}
		};

	}; // end Level

	let Pacman = function () {
		this.radius = 10;
		this.x = 0;
		this.y = 0;
		this.speed = 3;
		this.angle1 = 0.25;
		this.angle2 = 1.75;
		this.homeX = 0;
		this.homeY = 0;
		this.nearestRow = 0;
		this.nearestCol = 0;
	};

	Pacman.prototype.move = function () {
		this.nearestRow = parseInt((this.y) / thisGame.TILE_HEIGHT);
		this.nearestCol = parseInt((this.x) / thisGame.TILE_WIDTH);

		if (!thisLevel.checkIfHitWall(this.x + this.velX, this.y + this.velY, this.nearestRow, this.nearestCol)) {
			thisLevel.checkIfHitSomething(this, this.x, this.y, this.nearestRow, this.nearestCol);
			for (let i = 0; i < numGhosts; i++) {
				if (thisLevel.checkIfHit(this.x, this.y, ghosts[i].x, ghosts[i].y, thisGame.TILE_WIDTH / 2)) {
					if (ghosts[i].state === Ghost.VULNERABLE) {
						ghosts[i].velX = ghosts[i].velY = 0;
						ghosts[i].state = Ghost.SPECTACLES;
						thisGame.addToScore(comer_fantasmas);

						// let sound_eat_ghost = new Audio('../res/sounds/pacman_eatghost.wav');
						thisGame.sound_eat_ghost.play(); // si falla, descomentar arriba y borrar la declaracion de la 470 aprox

					} else if (ghosts[i].state === Ghost.NORMAL){
						thisGame.lives--; // Quitamos una vida
						if (thisGame.lives > 0) {
							// let sound_die = new Audio('../res/sounds/pacman_death.wav');
							thisGame.sound_die.play(); // si falla, descomentar arriba y borrar la declaracion de la 470 aprox

							thisGame.setMode(thisGame.HIT_GHOST);
						} else {
							// let sound_lose = new Audio('../res/sounds/pacman_intermission.wav');
							thisGame.sound_lose.play(); // si falla, descomentar arriba y borrar la declaracion de la 470 aprox

							thisGame.lives = 0;
							thisGame.setMode(thisGame.GAME_OVER);
						}
					}
				}
			}
			this.x += this.velX;
			this.y += this.velY;
		} else {
			this.velX = 0;
			this.velY = 0;
		}
		//thisLevel.checkIfHitSomething(this.x, this.y, this.nearestRow, this.nearestCol);

	};

	// Función para pintar el Pacman
	Pacman.prototype.draw = function () {
		// Dibujamos el Pacman dependiendo de su dirección
		if (this.velX > 0) {
			this.angle1 = 0.25;
			this.angle2 = 1.75;
		} else if (this.velX < 0) {
			this.angle1 = 1.25;
			this.angle2 = 0.75;
		} else if (this.velY > 0) {
			this.angle1 = 0.75;
			this.angle2 = 0.25;
		} else if (this.velY < 0) {
			this.angle1 = 1.75;
			this.angle2 = 1.25;
		}
		ctx.beginPath();
		ctx.moveTo(this.x + this.radius, this.y + this.radius);
		ctx.arc(this.x + this.radius, this.y + this.radius, this.radius, this.angle1 * Math.PI, this.angle2 * Math.PI, false);
		ctx.fillStyle = 'rgba(255,255,0,255)';
		ctx.strokeStyle = 'black';
		ctx.closePath();
		ctx.fill();
		ctx.stroke();
	};

	let player = new Pacman();
	for (let i = 0; i < numGhosts; i++) {
		ghosts[i] = new Ghost(i, canvas.getContext("2d"));
	}

	let thisGame = {
		getLevelNum: function () {
			return 0;
		},
		setMode : function(mode) {
			this.mode = mode;
			this.modeTimer = 0;
		},
		addToScore: function(puntos) {
			this.points = this.points + puntos;
		},
		screenTileSize: [25, 21],
		TILE_WIDTH: 24,
		TILE_HEIGHT: 24,
		ghostTimer: 0,
		lives: 3,
		points: 0,
		highscore: 0,


		NORMAL : 1,
		HIT_GHOST : 2,
		GAME_OVER : 3,
		WAIT_TO_START: 4,
		WIN: 5, // Se ha añadido nuevo estado para cuando PACMAN coma todos los pellets, aparezca un mensaje
		PAUSE: 6,
		modeTimer: 0,

		sound_eat_pellet: new Audio('../res/sounds/pacman_eatpill.wav'),
		sound_eat_powerpellet: new Audio('../res/sounds/pacman_eatfruit.wav'),
		sound_eat_ghost: new Audio('../res/sounds/pacman_eatghost.wav'),

		sound_die: new Audio('../res/sounds/pacman_death.wav'),
		sound_win: new Audio('../res/sounds/pacman_beginning.wav'),
		sound_lose: new Audio('../res/sounds/pacman_intermission.wav'),

	};

	let thisLevel = new Level(canvas.getContext("2d"));
	thisLevel.loadLevel(thisGame.getLevelNum());
	// thisLevel.printMap();

	let measureFPS = function (newTime) {
		// la primera ejecución tiene una condición especial
		if (lastTime === undefined) {
			lastTime = newTime;
			return;
		}

		// calcular el delta entre el frame actual y el anterior
		let diffTime = newTime - lastTime;

		if (diffTime >= 1000) {
			fps = frameCount;
			frameCount = 0;
			lastTime = newTime;
		}

		// mostrar los FPS en una capa del documento
		// que hemos construído en la función start()
		fpsContainer.innerHTML = 'FPS: ' + fps;
		frameCount++;
	};

	// clears the canvas content
	let clearCanvas = function () {
		ctx.clearRect(0, 0, w, h);
	};

	let checkInputs = function () {
		var fila = Math.trunc(player.y / thisGame.TILE_HEIGHT);
        var colum = Math.trunc(player.x / thisGame.TILE_WIDTH);
		if (inputStates.left) {
			// Si no ha chocado con nada, cambiar los valores para que se desplace a la izquierda
			if (!thisLevel.checkIfHitWall(player.x - (thisGame.TILE_WIDTH / 2) - 1, player.y, fila, colum)) {
				oldDirecrion = "left";
				player.velY = 0;
				player.velX = -player.speed;
				inputStates.up = false;
				inputStates.down = false;
				inputStates.right = false;
			}

		} else if (inputStates.up) {
			if (!thisLevel.checkIfHitWall(player.x, player.y - (thisGame.TILE_HEIGHT / 2) - 1, fila, colum)) {
				oldDirecrion = "up";
				player.velY = -player.speed;
				player.velX = 0;
				inputStates.left = false;
				inputStates.down = false;
				inputStates.right = false;
			}

		} else if (inputStates.down) {
			if (!thisLevel.checkIfHitWall(player.x, player.y + (thisGame.TILE_HEIGHT / 2), fila, colum)) {
				oldDirecrion = "down";
				player.velY = player.speed;
				player.velX = 0;
				inputStates.up = false;
				inputStates.left = false;
				inputStates.right = false;
			}

		} else if (inputStates.right) {
			if (!thisLevel.checkIfHitWall(player.x + (thisGame.TILE_WIDTH / 2), player.y, fila, player.nearestCol)) {
				oldDirecrion = "right";
				player.velY = 0;
				player.velX = player.speed;
				inputStates.up = false;
				inputStates.down = false;
				inputStates.left = false;
			}
			// Ha pulsado 'SpaceBar'
		} else {
			player.velX = player.velY = 0;
			inputStates.up = false;
			inputStates.left = false;
			inputStates.right = false;
			inputStates.down = false;
		}
	};

	let updateTimers = function () {
		/*if (thisGame.ghostTimer > 1) {
            thisGame.ghostTimer -= 1;
        } else if (thisGame.ghostTimer == 1) {
            thisGame.ghostTimer = 0;
            /*for (let ghost in ghosts) {
                ghost.state = Ghost.NORMAL; }
            Mismo warning de antes: Value assigned to primitive will be lost, y no funciona */
		/*for (let i = 0; i < numGhosts; i++) {
            ghosts[i].state = Ghost.NORMAL;
        }
    }*/

		let vulnerables = false;
		for (let i = 0; i < numGhosts; i++) {
			if(ghosts[i].state === Ghost.VULNERABLE) vulnerables = true;
		}

		if(vulnerables) {
			if(thisGame.ghostTimer > 0) {
				thisGame.ghostTimer--;
			} else {
				for (let i = 0; i < numGhosts; i++){
					if(ghosts[i].state !== Ghost.SPECTACLES) { // Si pacman se ha comido al fantasma, primero tiene que volver a casa
						ghosts[i].state = Ghost.NORMAL;
					}
				}
			}
		}


		if(thisGame.mode === thisGame.HIT_GHOST) {
			thisGame.modeTimer++;
			if(thisGame.modeTimer >= 90) {
				thisGame.setMode(thisGame.WAIT_TO_START);
				reset();
			}
		}

		if(thisGame.mode === thisGame.WAIT_TO_START) {
			thisGame.modeTimer++;
			if(thisGame.modeTimer >= 30) {
				thisGame.setMode(thisGame.NORMAL);
			}
		}
	};

	let mainLoop = function(time) {

		// Cuando el juego esté en marcha
		if (thisGame.mode !== thisGame.GAME_OVER && thisGame.mode !== thisGame.WIN && thisGame.mode !== thisGame.PAUSE) {

			measureFPS(time);

			// En caso de que no haya pasado nada
			if (thisGame.mode === thisGame.NORMAL) {
				checkInputs();

				// Mover fantasmas
				for (let i = 0; i < numGhosts; i++) {
					ghosts[i].move();
				}

				player.move();
			}

			// Pacman ha chocado con los fantasmas
			if (thisGame.mode === thisGame.HIT_GHOST) {
				if (thisGame.modeTimer == 90) {
					thisGame.mode = thisGame.WAIT_TO_START;
				}
			}

			// en modo WAIT_TO_START
			if (thisGame.mode === thisGame.WAIT_TO_START) {
				reset();
				if (thisGame.modeTimer == 30) {
					requestAnimationFrame(mainLoop);
				}
			}

			// Clear the canvas
			clearCanvas();

			thisLevel.drawMap();

			// Pintar fantasmas
			for (let i = 0; i < numGhosts; i++) {
				ghosts[i].draw();
			}

			player.draw();

			updateTimers();
			// call the animation loop every 1/60th of second
			requestAnimationFrame(mainLoop);

		} else if (thisGame.mode === thisGame.GAME_OVER || thisGame.mode === thisGame.WIN) { // En caso de que el juego haya terminado

			// Clear the canvas
			clearCanvas();

			thisLevel.drawMap();

			// Pintar fantasmas
			for (let i = 0; i < numGhosts; i++) {
				ghosts[i].draw();
			}

			player.draw();

		}
	}

	let addListeners = function () {
		// Para parar al personaje también se trata el 'onKeyUp'
		window.addEventListener('keydown', (event) => {
			const keyName = event.key;
			if (keyName === 'ArrowDown') {
				inputStates.down = true;
				inputStates.up = false;
				inputStates.left = false;
				inputStates.right = false;
				inputStates.space = false;
				event.preventDefault();
			} else if (keyName === 'ArrowLeft') {
				inputStates.left = true;
				inputStates.up = false;
				inputStates.down = false;
				inputStates.right = false;
				inputStates.space = false;
				event.preventDefault();
			} else if (keyName === 'ArrowRight') {
				inputStates.right = true;
				inputStates.up = false;
				inputStates.down = false;
				inputStates.left = false;
				inputStates.space = false;
				event.preventDefault();
			} else if (keyName === 'ArrowUp') {
				inputStates.up = true;
				inputStates.down = false;
				inputStates.left = false;
				inputStates.right = false;
				inputStates.space = false;
				event.preventDefault();
			} else if (keyName === ' ') {
				inputStates.space = true;
				inputStates.up = false;
				inputStates.down = false;
				inputStates.left = false;
				inputStates.right = false;
				event.preventDefault();
			} else {
			}
		}, false);
	};

	let reset = function () {
		inputStates.right = true;
		player.velY = 0;
		player.velX = player.speed;

		player.x = player.homeX;
		player.y = player.homeY;
		player.nearestCol = parseInt(this.x / thisGame.TILE_WIDTH);
		player.nearestRow = parseInt(this.y / thisGame.TILE_HEIGHT);

		for (let i = 0; i < numGhosts; i++) {
			ghosts[i].x = ghosts[i].homeX;
			ghosts[i].y = ghosts[i].homeY;
			ghosts[i].velY = 0;
			ghosts[i].velX = -ghosts[i].speed;
			ghosts[i].stateBlinkTimer = 360;
			ghosts[i].homeValuesSet = false;
		}

		thisGame.setMode(thisGame.NORMAL);
	};

	let iniciarJuegoDeNuevo = function () { // Este método se ejecutará cuando el usuario haga click en una tecla al perder o ganar en el juego
		window.addEventListener('keydown', (event) => {
			location.reload();
		}, false);
	}

	let displayScore = function() {
		ctx.beginPath();
		ctx.fillStyle = '#FF0000';
		ctx.font = "bold 20px arial";
		ctx.fillText("1UP", 24, 22);
		ctx.fillText("HIGH SCORE", 290, 22);
		ctx.fillStyle = '#FFFFFF';
		ctx.fillText(thisGame.points, 75, 22);
		ctx.fillText(thisGame.highscore, 450, 22);
		ctx.fillText("Lives:", 5, 595);

		for (let i = 0; i < thisGame.lives; i++) {
			ctx.beginPath();
			ctx.arc(72 + 20 * i, 590, 8, 0.25 * Math.PI, 1.75 * Math.PI);
			ctx.lineTo(72 + 20 * i, 590);
			ctx.fillStyle = "#FFFF00";
			ctx.fill();
			ctx.strokeStyle = "#000000"
			ctx.lineWidth = 0.5;
			ctx.stroke();
		}

		if (thisGame.mode === thisGame.GAME_OVER) {
			ctx.fillStyle = '#FFFF00';
			ctx.font = "bold italic 75px arial";
			ctx.fillText("GAME OVER", 20, 325);
			// Mensaje para hacer click para continuar
			ctx.fillStyle = '#FFFF00';
			ctx.font = "bold italic 20px arial";
			ctx.fillText("Click any key to continue", 130, 400);
			ctx.textBaseline = "middle";	
			iniciarJuegoDeNuevo();
		}

		if (thisGame.mode === thisGame.WIN) {
			ctx.fillStyle = '#FFFF00';
			ctx.font = "bold italic 75px arial";
			ctx.fillText("HAS GANADO", 10, 325);
			// Mensaje para hacer click para continuar
			ctx.fillStyle = '#FFFF00';
			ctx.font = "bold italic 20px arial";
			ctx.fillText("Click any key to continue", 130, 400);
			ctx.textBaseline = "middle";	
			iniciarJuegoDeNuevo();
		}

	}

	let start = function () {
		// adds a div for displaying the fps value
		fpsContainer = document.createElement('div');
		document.body.appendChild(fpsContainer);

		addListeners();
		thisLevel.drawMap();
		reset();

		// start the animation
		requestAnimationFrame(mainLoop);
	};

	//our GameFramework returns a public API visible from outside its scope
	return {
		start: start,
	};
};

let game = new GF();
$(document).ajaxStop(function () {
	game.start();
});

// Variables globales de utilidad
var canvas = document.querySelector("canvas");
var ctx = canvas.getContext("2d");
var w = canvas.width;
var h = canvas.height;


// GAME FRAMEWORK 
var GF = function(){
	// variables para contar frames/s, usadas por measureFPS
	var frameCount = 0;
	var lastTime;
	var fpsContainer;
	var fps; 
 
	//  variable global temporalmente para poder testear el ejercicio
    inputStates = { left: false, up: false, right: false, down: false, space: false };

	var Level = function(ctx) {
		this.ctx = ctx;
		this.lvlWidth = 0;
		this.lvlHeight = 0;
		
		this.map = [];
		
		this.pellets = 0;
		this.powerPelletBlinkTimer = 0;

		this.setMapTile = function(row, col, newValue){
			if(this.map[row]) {
				this.map[row][col] = newValue;
			}
		};
	
		this.getMapTile = function(row, col){
			if(this.map[row]) {
				return this.map[row][col];
			}
		};
	
		this.printMap = function(){
			for (var i = 0; i < thisLevel.lvlHeight; i++) {
				var current = '';
				for (var j = 0; j < thisLevel.lvlWidth; j++) {
					current += thisLevel.getMapTile(i,j) + ' ';
				}
				console.log(current)
			}
		};
	
		this.loadLevel = function(){
			$.get("https://raw.githubusercontent.com/AinhoY/froga/main/1.txt", (data) => {
				// Dividir por tipos
				var trozos = data.split("#");
	
				// Anchura
				this.lvlWidth = trozos[1].split(" ")[2];
	
				// Altura
				valores = trozos[2].split(" ");
				this.lvlHeight = trozos[2].split(" ")[2];
	
				// Valores del mapa
				valores = trozos[3].split("\n");
	
				// Quitar el startleveldata
				var filas = valores.slice(1, valores.length - 1);
				for (var i = 0; i < filas.length; i++) {
					var current = filas[i].split(" ");
					this.map[i] = [];
					for (var j = 0; j < current.length; j++) {
						if(current[j] != "") {
							this.setMapTile(i, j, parseInt(current[j]));
						}
					}
				}
			});
		};
	
		this.drawMap = function(){
	
			var TILE_WIDTH = thisGame.TILE_WIDTH;
			var TILE_HEIGHT = thisGame.TILE_HEIGHT;
	
			var tileID = {
				'door-h' : 20,
				'door-v' : 21,
				'pellet-power' : 3
			};

			if (this.powerPelletBlinkTimer < 60) {
                this.powerPelletBlinkTimer = this.powerPelletBlinkTimer + 1;
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
						//Pildora
						ctx.beginPath();
						ctx.arc(col * TILE_WIDTH + (TILE_WIDTH / 2), row * TILE_HEIGHT + (TILE_HEIGHT / 2), 4, 0, 2 * Math.PI, false);
						ctx.fillStyle = "#FFFFFF";
						ctx.stroke();
						ctx.fill();
						thisLevel.pellets = thisLevel.pellets + 1;
					} else if (type == 3) {
						//Pildora de poder
						if (this.powerPelletBlinkTimer < 30) {
							ctx.beginPath();
							ctx.arc(col * TILE_WIDTH + (TILE_WIDTH / 2), row * TILE_HEIGHT + (TILE_HEIGHT / 2), 4, 0, 2 * Math.PI, false);
							ctx.fillStyle = "#FF0000";
							ctx.fill();
							this.powerPelletBlinkTimer = this.powerPelletBlinkTimer + 1;
						}
					} else if (type >= 100 && type < 200) {
						//Pared
						ctx.fillStyle = '#0000FF';
						ctx.fillRect(col * TILE_WIDTH, row * TILE_HEIGHT, TILE_WIDTH, TILE_HEIGHT);
					} else if (type >= 10 && type < 14) {
						//Fantasmas
						ctx.fillStyle = '#000000';
						ctx.fillRect(col * TILE_WIDTH, row * TILE_HEIGHT, TILE_WIDTH, TILE_HEIGHT);
					}
				}
			}
		};
	
	
		this.isWall = function(row, col) {
			var pos = thisLevel.getMapTile(row, col);
			if(pos >=100 && pos <=199) {
				return true;
			} else {
				return false;
			}
		};
	
	
		this.checkIfHitWall = function(possiblePlayerX, possiblePlayerY, row, col){
			var wall = false;
			// Para mirar los bloques que lo rodean
			for (var r = row-1; r < row+2; r++) {
				for (var c = col-1; c < col+2; c++) {
					// Mirar si pacman está por pasar a otro bloque
					if((Math.abs(possiblePlayerX - (c * thisGame.TILE_WIDTH)) < thisGame.TILE_WIDTH) && (Math.abs(possiblePlayerY - (r * thisGame.TILE_HEIGHT)) < thisGame.TILE_HEIGHT)) {
						if(this.isWall(r,c)) {
							wall = true;
							break;
						}
					}
				}
			}
			return wall;
		};

		this.checkIfHitSomething = function(playerX, playerY, row, col){
			var tileID = {
				'door-h' : 20,
				'door-v' : 21,
				'pellet-power' : 3,
				'pellet': 2
			};
			
			//  Gestiona la recogida de píldoras
			for (var r = row-1; r < row+2; r++) {
				for (var c = col-1; c < col+2; c++) {
					// Mirar si hemos tocado una píldora
					if((Math.abs(playerX - (c * thisGame.TILE_WIDTH)) < 4) && (Math.abs(playerY - (r * thisGame.TILE_HEIGHT)) < 4)) {
						valor = thisLevel.getMapTile(r, c);
						if (valor == tileID['pellet']) {
							thisLevel.setMapTile(r, c, 0);
							thisLevel.pellets--;
							if(thisLevel.pellets == 0) {
								console.log("Next level!");
							}
						}
					}
				}
			}

			// Gestiona las puertas teletransportadoras
			for (var r = row-1; r < row+2; r++) {
				for (var c = col-1; c < col+2; c++) {
					// He puesto "Math.abs(playerX - (c * thisGame.TILE_WIDTH)) < 4)", pero no sé qué poner
					if((Math.abs(playerX - (c * thisGame.TILE_WIDTH)) < thisGame.TILE_WIDTH) && (Math.abs(playerY - (r * thisGame.TILE_HEIGHT)) < thisGame.TILE_HEIGHT)) {
						valor = thisLevel.getMapTile(r, c);
						if (valor == tileID["door-h"]) {
							if(player.velX > 0) {
								// Puerta de la derecha
								console.log("Door right");
								player.x -= (thisGame.screenTileSize[1]-2)*thisGame.TILE_WIDTH;
							} else {
								// Puerta de la izquierda
								console.log("Door left");
								player.x += (thisGame.screenTileSize[1]-2)*thisGame.TILE_WIDTH;
							}
						} else if (valor == tileID["door-v"]) {
							if(player.velY > 0) {
								// Puerta de abajo
								console.log("Door down");
								player.y -= (thisGame.screenTileSize[0]-2)*thisGame.TILE_HEIGHT;
							} else {
								// Puerta de arriba
								console.log("Door up");
								player.y += (thisGame.screenTileSize[0]-2)*thisGame.TILE_HEIGHT;
							}
						}
					}
				}
			}
		};

	}; // end Level 

	var Pacman = function() {
		this.radius = 10;
		this.x = 0;
		this.y = 0;
		this.speed = 3;
		this.angle1 = 0.25;
		this.angle2 = 1.75;
		this.homeX = 0;
		this.homeY = 0;
		this.row_cercana = 0;
        this.col_cercana = 0;
	};

	Pacman.prototype.move = function() {
		this.row_cercana = parseInt((this.y + this.radius) / thisGame.TILE_HEIGHT);
		this.col_cercana = parseInt((this.x + this.radius) / thisGame.TILE_WIDTH);

		if(!thisLevel.checkIfHitWall(this.x + this.velX, this.y + this.velXY, this.row_cercana, this.col_cercanae)) {
			thisLevel.checkIfHitSomething(this.x, this.y, this.row_cercana, this.col_cercana);
			this.x += this.velX
            this.y += this.velY
		} else {
			this.velX = 0
            this.velY = 0
		}
	};

	// Función para pintar el Pacman
    Pacman.prototype.draw = function(x, y) {
    	ctx.beginPath();
	    ctx.moveTo(this.x + this.radius,this.y + this.radius);
	    ctx.arc(this.x + this.radius,this.y + this.radius,this.radius,this.angle1*Math.PI,this.angle2*Math.PI,false);
	    ctx.fillStyle = 'rgba(255,255,0,255)';
	    ctx.strokeStyle = 'black';
	    ctx.closePath();
	    ctx.fill();
	    ctx.stroke();
    };

	// player variable global para el test
	player = new Pacman();

	var thisGame = {
		getLevelNum : function(){
			return 0;
		},
		screenTileSize: [25, 21],
		TILE_WIDTH: 24, 
		TILE_HEIGHT: 24
	};

	// thisLevel global para poder realizar las pruebas unitarias
	thisLevel = new Level(canvas.getContext("2d"));
	thisLevel.loadLevel( thisGame.getLevelNum() );
	// thisLevel.printMap(); 

	var measureFPS = function(newTime){
		// la primera ejecución tiene una condición especial
		if(lastTime === undefined) {
			lastTime = newTime; 
			return;
		}

		// calcular el delta entre el frame actual y el anterior
		var diffTime = newTime - lastTime; 

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
	var clearCanvas = function() {
		ctx.clearRect(0, 0, w, h);
	};

	var checkInputs = function(){
		if(inputStates.left) {
			// Si no ha chocado con nada, cambiar los valores para que se desplace a la izquierda
  		  if (!thisLevel.checkIfHitWall(player.x - player.speed, player.y, player.row_cercana, player.col_cercana)) {
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

	    } else if(inputStates.up) {
	      if (!thisLevel.checkIfHitWall(player.x, player.y - player.speed, player.row_cercana, player.col_cercana)) {
		      player.velY = -player.speed;
		      player.velX = 0;
		      inputStates.left = false;
			  inputStates.down = false;
			  inputStates.right = false;
		  } else {
		  	inputStates.up = false;
			inputStates.left = false;
			inputStates.right = false;
			inputStates.down = false;
		  }

	    } else if(inputStates.down) {
	    	if (!thisLevel.checkIfHitWall(player.x, player.y + player.speed, player.row_cercana, player.col_cercana)) {
	          player.velY = player.speed;
	      	  player.velX = 0;
	      	  inputStates.up = false;
			  inputStates.left = false;
			  inputStates.right = false;
	      	} else {
		  	inputStates.up = false;
			inputStates.left = false;
			inputStates.right = false;
			inputStates.down = false;
		  }

	    } else if(inputStates.right) {
	      if (!thisLevel.checkIfHitWall(player.x + player.speed, player.y, player.row_cercana, player.col_cercana)) {
	      	player.velY = 0;
		    player.velX = player.speed;
		    inputStates.up = false;
			inputStates.down = false;
			inputStates.left = false;
	      } else {
	      	inputStates.up = false;
			inputStates.left = false;
			inputStates.right = false;
			inputStates.down = false;
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
 
	var mainLoop = function(time){
		//main function, called each frame 
		measureFPS(time);
     
		checkInputs();
 
		//player.move();
		// Clear the canvas
		clearCanvas();
   
		thisLevel.drawMap();

		player.draw();
		// call the animation loop every 1/60th of second
		requestAnimationFrame(mainLoop);
	};

	var addListeners = function(){
		// Para para al personaje también se trata el 'onKeyUp'
		window.addEventListener('keydown', (event) => {
			const keyName = event.key;
			if (keyName === 'ArrowDown') {
			  inputStates.down = true;
			} else if (keyName === 'ArrowLeft') {
			  inputStates.left = true;
			} else if (keyName === 'ArrowRight') {
			  inputStates.right = true;
			} else if (keyName === 'ArrowUp') {
			  inputStates.up = true;
			} else if (keyName === ' ') {
			  inputStates.space = true;
			} else {}
		  }, false);
		
		  window.addEventListener('keyup', (event) => {
			const keyName = event.key;
			if (keyName === 'ArrowDown') {
			  inputStates.down = false;
			} else if (keyName === 'ArrowLeft') {
			  inputStates.left = false;
			} else if (keyName === 'ArrowRight') {
			  inputStates.right = false;
			} else if (keyName === 'ArrowUp') {
			  inputStates.up = false;
			} else if (keyName === ' ') {
			  inputStates.space = false;
			} else {}
		  }, false);
	};

    var reset = function(){
		inputStates.right = true;
		player.velY = 0;
		player.velX = player.speed;
		
		player.x = player.homeX;
		player.y = player.homeY;
		player.col_cercana = parseInt(this.x / thisGame.TILE_WIDTH);
		player.row_cercana = parseInt(this.y / thisGame.TILE_HEIGHT); 
    };

	var start = function(){
		// adds a div for displaying the fps value
		fpsContainer = document.createElement('div');
		document.body.appendChild(fpsContainer);
       
		addListeners();
			
		reset();

		// start the animation
		requestAnimationFrame(mainLoop);
	};

	//our GameFramework returns a public API visible from outside its scope
	return {
		start: start
	};
};

var game = new GF();
game.start();


test('Puertas teletransportadoras (i)', function(assert) {

  	var done = assert.async();
  	setTimeout(function() {
		player.x = 459;
		player.y = 288;
		player.velY = 0;
		player.velX = player.speed;
		var row = 12;
		var col = 19;
		thisLevel.checkIfHitSomething(player.x, player.y, row, col); // Pacman entra por la puerta lateral derecha
		assert.ok(  player.x < 100 && player.y == 288 , "Pacman debe aparecer en la misma fila, pero en la puerta lateral izquierda" );

    		   done();
  }, 1000);

});

test('Puertas teletransportadoras (ii)', function(assert) {

  	var done = assert.async();
  	setTimeout(function() {
		player.x = 21;
		player.y = 288;
		player.velY = 0;
       	player.velX = -1*player.speed;
		var row = 12;
		var col = 1;
		thisLevel.checkIfHitSomething(player.x, player.y, row, col); // Pacman entra por la puerta lateral izquierda 
		assert.ok(  player.x > 400 && player.y == 288 , "Pacman debe aparecer en la misma fila, pero en la puerta lateral derecha" );

    		   done();
  }, 2000);

});



test('Puertas teletransportadoras (iii)', function(assert) {

  	var done = assert.async();
  	setTimeout(function() {
		player.x = 240;
		player.y = 21;
		player.velY = -1*player.speed;
       	player.velX = 0;
		var row = 1;
		var col = 10;
		thisLevel.checkIfHitSomething(player.x, player.y, row, col); // Pacman entra por la puerta superior  
		assert.ok(  player.x == 240 && player.y > 400 , "Pacman debe aparecer en la misma columna, pero en la puerta inferior" );

    		   done();
  }, 3000);

});

test('Puertas teletransportadoras (iv)', function(assert) {

  	var done = assert.async();
  	setTimeout(function() {
		player.x = 240;
		player.y = 555;
		player.velY = player.speed;
    	player.velX = 0;
		var row = 23;
		var col = 10;
		thisLevel.checkIfHitSomething(player.x, player.y, row, col); // Pacman entra por la puerta inferior
		assert.ok(  player.x == 240 && player.y < 30 , "Pacman debe aparecer en la misma columna, pero en la puerta superior" );

    		   done();
  }, 4000);

});
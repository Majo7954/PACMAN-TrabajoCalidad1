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

  const TILE_WIDTH=24, TILE_HEIGHT=24;
	var numGhosts = 4;
	var ghostcolor = {};
	ghostcolor[0] = "rgba(255, 0, 0, 255)";
	ghostcolor[1] = "rgba(255, 128, 255, 255)";
	ghostcolor[2] = "rgba(128, 255, 255, 255)";
	ghostcolor[3] = "rgba(255, 128, 0,   255)";
	ghostcolor[4] = "rgba(50, 50, 255,   255)"; // blue, vulnerable ghost
	ghostcolor[5] = "rgba(255, 255, 255, 255)"; // white, flashing ghost

	// hold ghost objects
	var ghosts = {};

	var Ghost = function(id, ctx){

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

		this.draw = function(){
  		// test10
    	// Tu código aquí
			this.ctx.beginPath();

			this.ctx.moveTo(this.x,this.y+TILE_HEIGHT);
			this.ctx.quadraticCurveTo(this.x+(TILE_WIDTH/2),this.y/1,this.x+TILE_WIDTH,this.y+TILE_HEIGHT);
			this.ctx.fillStyle = ghostcolor[this.id];
			this.ctx.closePath();
			this.ctx.fill();

			this.ctx.beginPath();
			this.ctx.fillStyle = '#fff';
			this.ctx.arc(this.x+(TILE_WIDTH/4),this.y+(TILE_WIDTH/2),4,0,2*Math.PI,true);
			this.ctx.fill();

			this.ctx.beginPath();
			this.ctx.arc(this.x+(2*TILE_WIDTH/4),this.y+(TILE_WIDTH/2),4,0,4*Math.PI,true);
			this.ctx.fill();

		}; // draw

		this.move = function() {
			this.nearestRow = parseInt((this.y + thisGame.TILE_HEIGHT/2)/thisGame.TILE_HEIGHT);
			this.nearestCol = parseInt((this.x + thisGame.TILE_WIDTH/2)/thisGame.TILE_WIDTH);
			
			var posiblesMovimientos = [[0,-this.speed],[this.speed,0],[0,this.speed],[-this.speed,0]];
			var soluciones = [];

			for (var i = 0; i < posiblesMovimientos.length; i++) {
				if(!thisLevel.checkIfHitWall(this.x+posiblesMovimientos[i][0], this.y+posiblesMovimientos[i][1],this.nearestRow,this.nearestCol))
					soluciones.push(posiblesMovimientos[i]);
			}

			if(thisLevel.checkIfHitWall(this.x + this.velX, this.y + this.velY, this.nearestRow, this.nearestCol)|| soluciones.length == 3) {
				var pos = Math.round(Math.random()*(soluciones.length-1));
				this.velX = soluciones[pos][0];
            	this.velY = soluciones[pos][1];
			} else
				thisLevel.checkIfHitSomething(this,this.x, this.y, this.nearestRow, this.nearestCol);
			this.x += this.velX;
        	this.y += this.velY;
		};

	};

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
						ghosts[type-10].homeX = col*TILE_WIDTH;
						ghosts[type-10].homeY = row*TILE_HEIGHT;
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
		this.nearestRow = 0;
        this.nearestCol = 0;
	};
	
  Pacman.prototype.move = function() {
		this.nearestRow = parseInt((this.y + this.radius) / thisGame.TILE_HEIGHT);
		this.nearestCol = parseInt((this.x + this.radius) / thisGame.TILE_WIDTH);

		if(!thisLevel.checkIfHitWall(this.x + this.velX, this.y + this.velXY, this.nearestRow, this.nearestCole)) {
			thisLevel.checkIfHitSomething(this.x, this.y, this.nearestRow, this.nearestCol);
			this.x += this.velX
			this.y += this.velY
		} else {
			this.velX = 0
			this.velY = 0
		}
		
		// tras actualizar this.x  y  this.y... 
    // check for collisions with other tiles (pellets, etc)
		thisLevel.checkIfHitSomething(this.x, this.y, this.nearestRow, this.nearestCol);
    
	};

	// Función para pintar el Pacman
	Pacman.prototype.draw = function(x, y) {
		// Dibujamos el Pacman dependiendo de su dirección
		if(this.velX > 0) {
    		this.angle1 = 0.25;
	        this.angle2 = 1.75;
    	} else if(this.velX < 0) {
    		this.angle1 = 1.25;
			this.angle2 = 0.75;
    	} else if(this.velY > 0) {
    		this.angle1 = 0.75;
			this.angle2 = 0.25;
    	} else if(this.velY < 0) {
    		this.angle1 = 1.75;
			this.angle2 = 1.25;
    	}         
		ctx.beginPath();
	    ctx.moveTo(this.x + this.radius,this.y + this.radius);
	    ctx.arc(this.x + this.radius,this.y + this.radius,this.radius,this.angle1*Math.PI,this.angle2*Math.PI,false);
	    ctx.fillStyle = 'rgba(255,255,0,255)';
	    ctx.strokeStyle = 'black';
	    ctx.closePath();
	    ctx.fill();
	    ctx.stroke();	     
    };

	var player = new Pacman();
	for (var i=0; i< numGhosts; i++){
		ghosts[i] = new Ghost(i, canvas.getContext("2d"));
	}

	var thisGame = {
		getLevelNum : function(){
			return 0;
		},
		screenTileSize: [25, 21],
		TILE_WIDTH: 24, 
		TILE_HEIGHT: 24
	};

	var thisLevel = new Level(canvas.getContext("2d"));
	thisLevel.loadLevel( thisGame.getLevelNum() );

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

	    } else if(inputStates.up) {
	      if (!thisLevel.checkIfHitWall(player.x, player.y - player.speed, player.nearestRow, player.nearestCol)) {
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
	    	if (!thisLevel.checkIfHitWall(player.x, player.y + player.speed, player.nearestRow, player.nearestCol)) {
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
	      if (!thisLevel.checkIfHitWall(player.x + player.speed, player.y, player.nearestRow, player.nearestCol)) {
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
    
		for (var i=0; i< numGhosts; i++){
			ghosts[i].move();
		}

		player.move();
  		// Clear the canvas
 		clearCanvas();
   
		thisLevel.drawMap();

		for (var i=0; i< numGhosts; i++){
			ghosts[i].draw();
		}
 
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
		player.nearestCol = parseInt(this.x / thisGame.TILE_WIDTH);
		player.nearestRow = parseInt(this.y / thisGame.TILE_HEIGHT); 
		

		for (var i=0; i< numGhosts; i++){
			ghosts[i].x = ghosts[i].homeX;
			ghosts[i].y = ghosts[i].homeY;
			ghosts[i].velY = 0;
			ghosts[i].velX = -ghosts[i].speed;
		}
	};

	var start = function(){
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
		ghost: Ghost // exportando Ghost para poder probarla
	};
};

	var game = new GF();
	$(document).ajaxStop(function() { game.start(); });


test('Clase Ghost bien implementada', function(assert) {

	var done = assert.async();
	setTimeout(function() {
	  var ghost = new game.ghost(4, canvas.getContext("2d"));
	  assert.ok( typeof(ghost)!= "undefined" , "El fantasma existe" );

	  ghost.x = 250;
	  ghost.y = 240;
	  ghost.velX = 3;
	  ghost.velY = 0;
	  ghost.draw(); // no se va a ver, porque no está en el mainloop, pero queremos verificar que no da errores
	  ghost.move();
	  assert.ok( ghost.x > 250 , "El fantasma se mueve hacia la derecha cuando es posible" );

		  ghost.x = 240;
	  ghost.y = 242;
	  ghost.velX = 0;
	  ghost.velY = 3;
	  ghost.draw(); // no se va a ver, porque no está en el mainloop....
	  ghost.move();
	  assert.ok( ghost.y > 240 , "El fantasma se mueve hacia abajo cuando es posible" );
	  
	  ghost.x = 240;
	  ghost.y = 240;
	  ghost.draw(); // no se va a ver, porque no está en el mainloop....
	  ghost.move(); // lo movemos dos veces
	  ghost.move();
	  ghost.velX = 3;
	  ghost.velY = 3;
	  assert.ok( (ghost.x != 240 && ghost.y == 240) || (ghost.x == 240 && ghost.y != 240) , "El fantasma elige una direccio'n al azar cuando encuentra una bifurcacio'n " );
	  
	  done();
}, 1000);

});
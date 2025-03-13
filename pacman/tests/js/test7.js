//<![CDATA[


// Variables globales de utilidad
var canvas = document.querySelector("canvas");
var ctx = canvas.getContext("2d");
var w = canvas.width;
var h = canvas.height;

// GAME FRAMEWORK 
var GF = function() {
	// variables para contar frames/s, usadas por measureFPS
  var frameCount = 0;
  var lastTime;
  var fpsContainer;
  var fps;

  //  variable global temporalmente para poder testear el ejercicio
  inputStates = {};

 	var Level = function(ctx) {
   	this.ctx = ctx;
    this.lvlWidth = 0;
    this.lvlHeight = 0;

    this.map = [];

    this.pellets = 0;
    this.powerPelletBlinkTimer = 0;

    this.setMapTile = function(row, col, newValue){
			this.map[row][col] = newValue;
		};

		this.getMapTile = function(row, col){
			return this.map[row][col];
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
			jQuery.ajax({
				url : "https://raw.githubusercontent.com/AinhoY/froga/main/1.txt",
		        dataType: "text",
		        success : function (data) {
		            var lineas = data.split("\n");
		            var inicio = fin = false;
		            var row = 0;
		            for (var i = 0; i < lineas.length; i++) {
		            	if(lineas[i].includes("lvlwidth"))
		            		thisLevel.lvlWidth = lineas[i].split(" ").slice(-1).pop();

		            	else if(lineas[i].includes("lvlheight"))
		            		thisLevel.lvlHeight = lineas[i].split(" ").slice(-1).pop();

		            	else if(lineas[i].includes("startleveldata"))
		            		inicio = true;

		            	else if(lineas[i].includes("endleveldata"))
		            		fin = true;

		            	else if(inicio && !fin) {
		            		var fila = lineas[i].split(" ");
		            		for (var j = 0; j < fila.length; j++) {
							    if(fila[j] != "") {
							    	if(thisLevel.map[row] === undefined)
							    		thisLevel.map[row] = [];
							    	thisLevel.setMapTile(row,j,fila[j]);
							    }
							}
		            		row++;
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
			for (var fila = 0; fila <= thisGame.screenTileSize[0]; fila++) {
                for (var colum = 0; colum < thisGame.screenTileSize[1]; colum++) {
                    var act = this.getMapTile(fila, colum);
                    if (act == 4) {
                        //Pacman
                    } else if (act == 2) {
                        //Pildora
                        ctx.beginPath();
                        ctx.arc(colum * TILE_WIDTH + (TILE_WIDTH / 2), fila * TILE_HEIGHT + (TILE_HEIGHT / 2), 4, 0, 2 * Math.PI, false);
                        ctx.fillStyle = "#FFFFFF";
                        ctx.fill();
                    } else if (act == 3) {
                        //Pildora de poder
						ctx.beginPath();
						ctx.arc(colum * TILE_WIDTH + (TILE_WIDTH / 2), fila * TILE_HEIGHT + (TILE_HEIGHT / 2), 4, 0, 2 * Math.PI, false);
						ctx.fillStyle = "#FF0000";
						ctx.fill();
                    } else if (act >= 100 && act < 200) {
                        //Pared
                        ctx.fillStyle = '#0000FF';
                        ctx.fillRect(colum * TILE_WIDTH, fila * TILE_HEIGHT, TILE_WIDTH, TILE_HEIGHT);
                    } else if (act >= 10 && act < 14) {
                        //Fantasmas
                        ctx.fillStyle = '#000000';
                        ctx.fillRect(colum * TILE_WIDTH, fila * TILE_HEIGHT, TILE_WIDTH, TILE_HEIGHT);
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
      // Determinar si el jugador va a moverse a una fila,columna que tiene pared 
      // Hacer uso de isWall
      if ((possiblePlayerX % (thisGame.TILE_WIDTH / 2) == 0 || possiblePlayerY % (thisGame.TILE_HEIGHT / 2) == 0)) { // Si el jugador se mueve a una posición de una casilla
        var fila = Math.trunc(possiblePlayerY / thisGame.TILE_HEIGHT); // fila en la que se va a mover
        var colum = Math.trunc(possiblePlayerX / thisGame.TILE_WIDTH); // columna en la que se va a mover
        return this.isWall(fila, colum);

      } else {
          return true;
      }
    };

	}; // end Level 

  var Pacman = function() {
   	this.radius = 10;
    this.x = 0;
    this.y = 0;
    this.speed = 3;
    this.velX = 0;
    this.velY = 0;
    this.angle1 = 0.25;
    this.angle2 = 1.75;
  };
 
	Pacman.prototype.move = function() {
		this.nearestRow = parseInt((this.y + this.radius) / thisGame.TILE_HEIGHT);
		this.nearestCol = parseInt((this.x + this.radius) / thisGame.TILE_WIDTH);

		if(!thisLevel.checkIfHitWall(this.x + this.velX, this.y + this.velXY, this.nearestRow, this.nearestCole)) {
			this.x += this.velX
            this.y += this.velY
		} else {
			this.velX = 0
            this.velY = 0
		}
	};


	// Función para pintar el Pacman
  Pacman.prototype.draw = function(x, y) {
    var rad = 15 
		ctx.beginPath();
		ctx.arc(x+rad /*25*/, y+rad /*115*/, rad, 0.25 * Math.PI, 0.75 * Math.PI, true);
		ctx.fillStyle = "#FFFF00";
		ctx.fill();
		ctx.strokeStyle = '#FFFF00';
		ctx.stroke();
  };

	var player = new Pacman();

	var thisGame = {
		getLevelNum: function() {
    	return 0;
    },
    screenTileSize: [24, 21],
    TILE_WIDTH: 24,
    TILE_HEIGHT: 24
	};

  // thisLevel global para poder realizar las pruebas unitarias
	thisLevel = new Level(canvas.getContext("2d"));
  thisLevel.loadLevel(thisGame.getLevelNum());
  // thisLevel.printMap(); 

	var measureFPS = function(newTime) {
		// la primera ejecución tiene una condición especial
  	if (lastTime === undefined) {
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
		// LEE bien el enunciado, especialmente la nota de ATENCION que
		// se muestra tras el test 7
		if(inputStates.left) {
  		  if (!thisLevel.checkIfHitWall(player.x - player.speed, player.y, player.nearestRow, player.nearestCol)) {
		      player.velY = 0;
		      player.velX = -player.speed;
		      inputStates.up = inputStates.down = inputStates.right = false;
		  } else {
		  	inputStates.up = inputStates.left = inputStates.right = inputStates.down = false;
		  }
	    } else if(inputStates.up) {
	      if (!thisLevel.checkIfHitWall(player.x, player.y - player.speed, player.nearestRow, player.nearestCol)) {
		      player.velY = -player.speed;
		      player.velX = 0;
		      inputStates.left = inputStates.down = inputStates.right = false;
		  } else {
		  	inputStates.up = inputStates.left = inputStates.right = inputStates.down = false;
		  }
	    } else if(inputStates.down) {
	    	if (!thisLevel.checkIfHitWall(player.x, player.y + player.speed, player.nearestRow, player.nearestCol)) {
	          player.velY = player.speed;
	      	  player.velX = 0;
	      	  inputStates.up = inputStates.left = inputStates.right = false;
	      	} else {
		  	inputStates.up = inputStates.left = inputStates.right = inputStates.down = false;
		  }
	    } else if(inputStates.right) {
	      if (!thisLevel.checkIfHitWall(player.x + player.speed, player.y, player.nearestRow, player.nearestCol)) {
	      	player.velY = 0;
		    player.velX = player.speed;
		    inputStates.up = inputStates.down = inputStates.left = false;
	      } else {
	      	inputStates.up = inputStates.left = inputStates.right = inputStates.down = false;
	      }
	    } else {
	      player.velX = player.velY = 0;
	      inputStates.up = inputStates.left = inputStates.right = inputStates.down = false;
	    }
	};

	var mainLoop = function(time) {
		//main function, called each frame 
    measureFPS(time);

    checkInputs();

    player.move();
    // Clear the canvas
    clearCanvas();

    thisLevel.drawMap();

    player.draw();
    // call the animation loop every 1/60th of second
    requestAnimationFrame(mainLoop);
	};

	var addListeners = function(){
		// add the listener to the main, window object, and update the states
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
   };

   var reset = function(){
		// Inicialmente Pacman debe empezar a moverse en horizontal hacia la derecha, con una velocidad igual a su atributo speed
		inputStates.right = true;
		player.velY = 0;
		player.velX = player.speed;
		// inicializa la posición inicial de Pacman tal y como indica el enunciado
		player.x = player.homeX;
		player.y = player.homeY;
		player.nearestCol = parseInt(this.x / thisGame.TILE_WIDTH);
		player.nearestRow = parseInt(this.y / thisGame.TILE_HEIGHT); 
    };

	var start = function() {
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


test('checkIfHitWall bien implementado', function(assert) {

  var done = assert.async();
  setTimeout(function() {
    var x = 315,
      y = 384,
      speed = 5,
      nearestRow = 16,
      nearestCol = 13;
    assert.ok(thisLevel.checkIfHitWall(x, y - speed, nearestRow, nearestCol) == true, "entrar demasiado pronto por la primera salida hacia arriba de la pos. original");
    x = 312;
    assert.ok(thisLevel.checkIfHitWall(x, y - speed, nearestRow, nearestCol) == false, "entrar OK por la primera salida hacia arriba de la pos. original");
    x = 240, y = 144, nearestRow = 6, nearestCol = 10;
    assert.ok(thisLevel.checkIfHitWall(x - speed, y, nearestRow, nearestCol) == false, "apertura horizontal superior izquierda, entrando correctamente hacia la izquierda, no hay pared");
    y = 147;
    assert.ok(thisLevel.checkIfHitWall(x - speed, y, nearestRow, nearestCol) == true, "apertura horizontal superior izquierda, entrando demasiado tarde hacia la izquierda, hay pared");
    done();
  }, 1000);

});



  //]]>
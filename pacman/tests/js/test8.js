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
		$.get("https://raw.githubusercontent.com/AinhoY/froga/main/1.txt", (data) => {
			// Dividir por tipos
			var trozos = data.split("#");

			// Anchura
			this.lvlWidth = trozos[1].split(" ")[2];

			// Altura
			valores = trozos[2].split(" ");
			this.lvlHeight = trozos[2].split(" ");

			// Valores del mapa
			valores = trozos[3].split("\n");

			// Quitar el startleveldata
			var filas = valores.slice(1, valores.length - 1);
			for (var i = 0; i < filas.length; i++) {
				var current = filas[i].split(" ");
				this.map[i] = [];
				for (var j = 0; j < current.length; j++) {
					this.setMapTile(i, j, current[j]);
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
					ctx.fill();
				} else if (type == 3) {
					//Pildora de poder
					if (this.powerPelletBlinkTimer < 30) {
						ctx.beginPath();
						ctx.arc(col * TILE_WIDTH + (TILE_WIDTH / 2), row * TILE_HEIGHT + (TILE_HEIGHT / 2), 4, 0, 2 * Math.PI, false);
						ctx.fillStyle = "#FF0000";
						ctx.fill();
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
		for (var r = row-1; r < row+2; r++) {
			for (var c = col-1; c < col+2; c++) {

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
					if((Math.abs(playerX - (c * thisGame.TILE_WIDTH)) < 4) && (Math.abs(playerY - (r * thisGame.TILE_HEIGHT)) < 4)) {
						pos = thisLevel.getMapTile(r, c);
						if (pos == tileID.pellet) {
							thisLevel.setMapTile(r, c, 0);
							thisLevel.pellets--;
							if(thisLevel.pellets == 0) console.log("Next level!");
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

	var player = new Pacman();

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
	 
		player.move();
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
		thisLevel.drawMap();
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
  $(document).ajaxStop(function() {
  	game.start();
  	numPellets = thisLevel.pellets;
  });

var numPellets = 0
  

test('Comiendo pi`ldoras', function(assert) {

  	var done = assert.async();
  	setTimeout(function() {
		assert.ok( numPellets - 2 == thisLevel.pellets  , "Pacman comienza movi'endose hacia el este. Al parar, habra' comido dos pi'ldoras" );
    		   done();
  }, 1000);

});


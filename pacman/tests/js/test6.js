//<![CDATA[


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

	}; // end Level 

	var Pacman = function() {
		this.radius = 10;
		this.x = 0;
		this.y = 0;
		this.speed = 5;
		this.velX = 0;
	    this.velY = 0;
		this.angle1 = 0.25;
		this.angle2 = 1.75;
	};
	Pacman.prototype.move = function() {
		if(inputStates.right) {
			if(this.x + this.radius*2 + this.velX <= w) {
			  this.x += this.velX;
			  this.angle1 = 0.25;
			  this.angle2 = 1.75;
			}
		} else if(inputStates.left) {
			if(this.x + this.velX >= 0) {
				this.x += this.velX;
				this.angle1 = 1.25;
				this.angle2 = 0.75;
		}
		} else if(inputStates.down) {
			if(this.y + this.radius*2 + this.velY <= h) {
				this.y += this.velY;
				this.angle1 = 0.75;
				this.angle2 = 0.25;
		}
		} else if(inputStates.up) {
			if(this.y + this.velY >= 0) {
				this.y += this.velY;
				this.angle1 = 1.75;
				this.angle2 = 1.25;
		}
		}
	};
  
	// Función para pintar el Pacman
	Pacman.prototype.draw = function(x, y) {   
    	ctx.beginPath();
	    ctx.moveTo(this.x + this.radius,this.y + this.radius);
	    ctx.arc(this.x + this.radius,this.y + this.radius,this.radius,this.angle1*Math.PI,this.angle2*Math.PI,false);
	    ctx.fillStyle = '#FFFF00';
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
		screenTileSize: [24, 21],
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
		if(inputStates.right) {
			player.velY = 0;
			player.velX = player.speed;
		} else if(inputStates.left) {
			player.velY = 0;
			player.velX = -player.speed;
		} else if(inputStates.up) {
			player.velY = -player.speed;
			player.velX = 0;
		} else if(inputStates.down) {
			player.velY = player.speed;
			player.velX = 0;
		} else { // space. Parar a pacman
			player.velX = 0;
			player.velY = 0;
		}
	};
 
	var mainLoop = function(time){
		 //main function, called each frame 
		measureFPS(time);
     
		checkInputs();
 
		// Clear the canvas
		clearCanvas();
   
		thisLevel.drawMap();

		player.move();
 
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

	var start = function(){
		// adds a div for displaying the fps value
		fpsContainer = document.createElement('div');
		document.body.appendChild(fpsContainer);
       
		addListeners();

		player.x = 0;
		player.y = 0; 
		player.velY = 0;
		player.velX = player.speed;
 
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

test('Mapa correctamente dibujado en pantalla', function(assert) {

  	var done = assert.async();
  	setTimeout(function() {


	     	   assert.pixelEqual( canvas,  35,35, 0, 0, 255, 255,"esquina superior izquierda azul"); 
	     	   assert.pixelEqual( canvas, 250,35, 0, 0, 0, 0,"puerta superior negra");
	     	   assert.pixelEqual( canvas, 465,35, 0, 0, 255, 255,"esquina superior derecha azul");
	     	   assert.pixelEqual( canvas, 58,58, 255, 255, 255,255,"primera pi'ldora esquina superior izquierda blanca");
	     	   assert.pixelEqual( canvas, 58,82, 255, 0,0,255,"pi'ldora de poder esquina superior izquierda roja");
	     	   assert.pixelEqual( canvas, 442,82, 255, 0,0,255,"pi'ldora de poder esquina superior derecha roja");

	     	   assert.pixelEqual( canvas, 35,300, 0, 0,0,0 ,"puerta lateral izquierda negra");
	     	   assert.pixelEqual( canvas, 252,300, 0, 0,0, 255,"centro de casa de los fantasmas negro");
	     	   assert.pixelEqual( canvas, 482, 300, 0, 0,0, 0,"puerta lateral derecha negra");
		
		   assert.pixelEqual( canvas, 12, 585, 0, 0,255,255,"esquina inferior izquierda azul"); 
	     	   assert.pixelEqual( canvas, 60, 538, 0, 0,255,255,"cuadrado interior esquina inferior izquierda azul");
	     	   assert.pixelEqual( canvas, 250,538, 255, 255,255,255,"pi'ldora central lateral inferior blanca");
	     	   assert.pixelEqual( canvas, 442,538, 0, 0,255,255,"cuadrado interior esquina inferior derecha azul");
		   assert.pixelEqual( canvas, 488,582, 0, 0,255,255,"esquina inferior derecha azul"); 

    		   done();
  }, 1000);

});



  //]]>
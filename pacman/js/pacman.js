// Variables globales de utilidad
let ctx;  // El contexto se inyectará en las pruebas
const TILE_WIDTH = 24, TILE_HEIGHT = 24;
let oldDirection = "right"; // Dirección inicial de Pacman

// Puntajes iniciales
const pointsPerPellet = 10;
const pointsPerGhost = 100;

// Colores de los fantasmas
const ghostColors = [
  "rgba(255, 0, 0, 255)", // Rojo
  "rgba(255, 128, 255, 255)", // Rosa
  "rgba(128, 255, 255, 255)", // Cian
  "rgba(255, 128, 0, 255)", // Naranja
  "rgba(50, 50, 255, 255)", // Azul (fantasma vulnerable)
  "rgba(255, 255, 255, 255)" // Blanco (fantasma parpadeante)
];

// Clase Ghost
class Ghost {
  constructor(id, ctx) {
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
    this.homeValuesSet = false;
  }

  static NORMAL = 1;
  static VULNERABLE = 2;
  static SPECTACLES = 3;

  draw() {
    if (this.state !== Ghost.SPECTACLES) {
      this.ctx.beginPath();
      this.ctx.moveTo(this.x, this.y + TILE_HEIGHT);
      this.ctx.quadraticCurveTo(this.x + TILE_WIDTH / 2, this.y / 1, this.x + TILE_WIDTH, this.y + TILE_HEIGHT);
      this.ctx.fillStyle = this.state === Ghost.NORMAL ? ghostColors[this.id] :
        (this.state === Ghost.VULNERABLE ? ghostColors[4] : ghostColors[5]);
      this.ctx.closePath();
      this.ctx.fill();
    }

    this.drawEyes();
  }

  drawEyes() {
    this.ctx.fillStyle = '#fff';
    this.ctx.beginPath();
    this.ctx.arc(this.x + TILE_WIDTH / 4, this.y + TILE_WIDTH / 2, 4, 0, 2 * Math.PI, true);
    this.ctx.fill();
    this.ctx.beginPath();
    this.ctx.arc(this.x + 2 * TILE_WIDTH / 4, this.y + TILE_WIDTH / 2, 4, 0, 4 * Math.PI, true);
    this.ctx.fill();
  }

  move() {
    this.nearestRow = Math.floor((this.y + TILE_HEIGHT / 2) / TILE_HEIGHT);
    this.nearestCol = Math.floor((this.x + TILE_WIDTH / 2) / TILE_WIDTH);

    if (this.state !== Ghost.SPECTACLES) {
      this.moveRandomly();
    } else {
      this.moveHome();
    }
  }

  moveRandomly() {
    const possibleMoves = [[0, -this.speed], [this.speed, 0], [0, this.speed], [-this.speed, 0]];
    let solutions = [];

    for (let i = 0; i < possibleMoves.length; i++) {
      if (!thisLevel.checkIfHitWall(this.x + possibleMoves[i][0], this.y + possibleMoves[i][1], this.nearestRow, this.nearestCol)) {
        solutions.push(possibleMoves[i]);
      }
    }

    if (thisLevel.checkIfHitWall(this.x + this.velX, this.y + this.velY, this.nearestRow, this.nearestCol) || solutions.length === 3) {
      const pos = Math.round(Math.random() * (solutions.length - 1));
      this.velX = solutions[pos][0];
      this.velY = solutions[pos][1];
    } else {
      thisLevel.checkIfHitSomething(this, this.x, this.y, this.nearestRow, this.nearestCol);
    }
    this.x += this.velX;
    this.y += this.velY;
  }

  moveHome() {
    if (this.x < this.homeX) this.x += this.speed;
    if (this.x > this.homeX) this.x -= this.speed;
    if (this.y < this.homeY) this.y += this.speed;
    if (this.y > this.homeY) this.y -= this.speed;
    if (this.x === this.homeX && this.y === this.homeY) {
      this.state = Ghost.NORMAL;
      this.velY = -this.speed;
    }
  }
}

// Clase Pacman
class Pacman {
  constructor() {
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
    this.velX = 0;
    this.velY = 0;
    this.pellets = 5;  // Inicializamos los pellets
    this.lives = 3;    // Inicializamos las vidas
  }

  move(direction) {
    // Aseguramos que Pacman no se mueva fuera de los límites
    if (direction === 'right') {
      this.velX = this.speed;
      this.velY = 0;  // Aseguramos que no se mueva verticalmente
    } else if (direction === 'down') {
      this.velY = this.speed;
      this.velX = 0;  // Aseguramos que no se mueva horizontalmente
    } else if (direction === 'left') {
      this.velX = -this.speed;
      this.velY = 0;  // Aseguramos que no se mueva verticalmente
    } else if (direction === 'up') {
      this.velY = -this.speed;
      this.velX = 0;  // Aseguramos que no se mueva horizontalmente
    }

    // Prevenir que Pacman se mueva fuera de los límites
    if (this.x + this.velX < 0) {
      this.x = 0;
    } else if (this.x + this.velX > TILE_WIDTH * 10) {
      this.x = TILE_WIDTH * 10;
    } else {
      this.x += this.velX;
    }

    if (this.y + this.velY < 0) {
      this.y = 0;
    } else if (this.y + this.velY > TILE_HEIGHT * 10) {
      this.y = TILE_HEIGHT * 10;
    } else {
      this.y += this.velY;
    }
  }

  draw() {
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
  }

  eatPellet() {
    if (this.pellets > 0) {
      this.pellets--;
    }
  }

  collideWithGhost() {
    this.lives--;
  }
}

// Clase GF (Game Framework)
class GF {
  constructor() {
    this.gameStarted = false;
  }

  start() {
    if (!this.gameStarted) {
      this.gameStarted = true;
      this.initializeGame();
    }
  }

  initializeGame() {
    this.gameLoop();
  }

  gameLoop() {
    // Llamar a las funciones para actualizar el estado del juego aquí
    // Código para el loop del juego (e.g., mover personajes, renderizar, etc)
  }
}

// Inicio del juego
const game = new GF();
window.addEventListener('load', () => {
  game.start();
});

// Exportar las clases necesarias
export { Pacman, Ghost, GF };  // Eliminamos Level si no la necesitas

let ctx;  
const TILE_WIDTH = 24, TILE_HEIGHT = 24;
let oldDirection = "right"; 
const pointsPerPellet = 10;
const pointsPerGhost = 100;

const ghostColors = [
  "rgba(255, 0, 0, 255)", 
  "rgba(255, 128, 255, 255)", 
  "rgba(128, 255, 255, 255)", 
  "rgba(255, 128, 0, 255)", 
  "rgba(50, 50, 255, 255)", 
  "rgba(255, 255, 255, 255)" 
];

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
    this.nearestRow = Math.floor((this.y + thisGame.TILE_HEIGHT / 2) / thisGame.TILE_HEIGHT);
    this.nearestCol = Math.floor((this.x + thisGame.TILE_WIDTH / 2) / thisGame.TILE_WIDTH);

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

// Clase Level
class Level {
  constructor(ctx) {
    this.ctx = ctx;
    this.lvlWidth = 0;
    this.lvlHeight = 0;
    this.map = [];
    this.pellets = 0;
    this.powerPelletBlinkTimer = 0;
  }

  setMapTile(row, col, newValue) {
    if (this.map[row]) {
      this.map[row][col] = newValue;
    }
  }

  getMapTile(row, col) {
    if (this.map[row]) {
      return this.map[row][col];
    }
  }

  loadLevel() {
    fetch("https://raw.githubusercontent.com/AinhoY/froga/main/1.txt")
      .then((response) => response.text())
      .then((data) => {
        const chunks = data.split("#");
        this.lvlWidth = parseInt(chunks[1].split(" ")[2]);
        this.lvlHeight = parseInt(chunks[2].split(" ")[2]);
        const values = chunks[3].split("\n");
        const rows = values.slice(1, values.length - 1);

        for (let i = 0; i < rows.length; i++) {
          const current = rows[i].split(" ");
          this.map[i] = [];
          for (let j = 0; j < current.length; j++) {
            if (current[j] !== "") {
              if (current[j] == 2) {
                this.pellets++;
              }
              this.setMapTile(i, j, parseInt(current[j]));
            }
          }
        }
      });
  }

  drawMap() {
    const tileID = {
      'door-h': 20, 'door-v': 21, 'pellet': 2, 'pellet-power': 3, 'pacman': 4,
      'walls-low-limit': 100, 'walls-high-limit': 200, 'ghosts-low-limit': 10, 'ghosts-high-limit': 14
    };

    if (this.powerPelletBlinkTimer < 60) {
      this.powerPelletBlinkTimer++;
    } else {
      this.powerPelletBlinkTimer = 0;
    }

    for (let row = 0; row < thisGame.screenTileSize[0]; row++) {
      for (let col = 0; col < thisGame.screenTileSize[1]; col++) {
        let type = this.getMapTile(row, col);
        this.drawTile(type, row, col, tileID);
      }
    }

    displayScore();
  }

  drawTile(type, row, col, tileID) {
    if (type === tileID['pacman']) {
      player.homeX = col * TILE_WIDTH;
      player.homeY = row * TILE_HEIGHT;
    } else if (type === tileID['pellet']) {
      this.drawPellet(row, col);
    } else if (type === tileID['pellet-power']) {
      this.drawPowerPellet(row, col);
    } else if (type >= tileID['walls-low-limit'] && type < tileID['walls-high-limit']) {
      this.drawWall(row, col);
    } else if (type >= tileID['ghosts-low-limit'] && type < tileID['ghosts-high-limit']) {
      this.drawGhost(row, col, type);
    }
  }

  drawPellet(row, col) {
    ctx.beginPath();
    ctx.arc(col * TILE_WIDTH + (TILE_WIDTH / 2), row * TILE_HEIGHT + (TILE_HEIGHT / 2), 4, 0, 2 * Math.PI, false);
    ctx.fillStyle = "#FFFFFF";
    ctx.stroke();
    ctx.fill();
  }

  drawPowerPellet(row, col) {
    if (this.powerPelletBlinkTimer < 30) {
      ctx.beginPath();
      ctx.arc(col * TILE_WIDTH + (TILE_WIDTH / 2), row * TILE_HEIGHT + (TILE_HEIGHT / 2), 4, 0, 2 * Math.PI, false);
      ctx.fillStyle = "#FF0000";
      ctx.fill();
    }
  }

  drawWall(row, col) {
    ctx.beginPath();
    ctx.rect(col * TILE_WIDTH, row * TILE_WIDTH, TILE_WIDTH, TILE_HEIGHT);
    ctx.fillStyle = '#0000FF';
    ctx.closePath();
    ctx.fill();
  }

  drawGhost(row, col, type) {
    if (!ghosts[type - 10].homeValuesSet) {
      ghosts[type - 10].homeX = col * TILE_WIDTH;
      ghosts[type - 10].homeY = row * TILE_HEIGHT;
      ghosts[type - 10].homeValuesSet = true;
    }
  }

  isWall(row, col) {
    return this.getMapTile(row, col) >= 100 && this.getMapTile(row, col) <= 199;
  }

  checkIfHitWall(posX, posY, row, col) {
    let wall = false;
    for (let r = row - 1; r < row + 2; r++) {
      for (let c = col - 1; c < col + 2; c++) {
        if (Math.abs(posX - (c * TILE_WIDTH)) < TILE_WIDTH && Math.abs(posY - (r * TILE_HEIGHT)) < TILE_HEIGHT) {
          if (this.isWall(r, c)) {
            wall = true;
            break;
          }
        }
      }
    }
    return wall;
  }
}

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
  }

  move() {
    this.nearestRow = Math.floor(this.y / TILE_HEIGHT);
    this.nearestCol = Math.floor(this.x / TILE_WIDTH);

    if (!thisLevel.checkIfHitWall(this.x + this.velX, this.y + this.velY, this.nearestRow, this.nearestCol)) {
      thisLevel.checkIfHitSomething(this, this.x, this.y, this.nearestRow, this.nearestCol);
      this.x += this.velX;
      this.y += this.velY;
    } else {
      this.velX = 0;
      this.velY = 0;
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
}

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
    
  }
}

// Inicio del juego
const game = new GF();
window.addEventListener('load', () => {
  game.start();
});

export { Pacman, Ghost, Level, GF };  
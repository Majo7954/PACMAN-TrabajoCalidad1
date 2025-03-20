import { Pacman, Ghost } from '../../js/pacman';  
const $ = require('jquery');  

beforeAll(() => {
  global.document = {
    querySelector: jest.fn(() => {
      return {
        getContext: jest.fn(() => ({
          beginPath: jest.fn(),
          moveTo: jest.fn(),
          arc: jest.fn(),
          fillStyle: '',
          strokeStyle: '',
          closePath: jest.fn(),
          fill: jest.fn(),
          stroke: jest.fn(),
          clearRect: jest.fn(),
          fillText: jest.fn(),
        })), 
        width: 24,
        height: 24
      };
    })
  };


  global.$ = $;  

  global.thisGame = {
    TILE_WIDTH: 24,
    TILE_HEIGHT: 24,
    screenTileSize: [25, 21],
    ghostTimer: 0,
    lives: 3,
    points: 0,
    highscore: 0,
    addToScore: jest.fn(),
    setMode: jest.fn(),
    sound_eat_pellet: { play: jest.fn() },
    sound_eat_powerpellet: { play: jest.fn() },
    sound_eat_ghost: { play: jest.fn() },
    sound_die: { play: jest.fn() },
    sound_win: { play: jest.fn() },
    sound_lose: { play: jest.fn() }
  };


  global.thisLevel = {
    checkIfHitWall: jest.fn(() => false), 
    checkIfHitSomething: jest.fn(),  
  };
});

describe('Pacman', () => {
  let pacman;
  let canvas;
  let ctx;

  beforeEach(() => {
    canvas = {
      getContext: jest.fn().mockReturnValue({
        beginPath: jest.fn(),
        moveTo: jest.fn(),
        arc: jest.fn(),
        fillStyle: '',
        strokeStyle: '',
        closePath: jest.fn(),
        fill: jest.fn(),
        stroke: jest.fn(),
        clearRect: jest.fn(),
        fillText: jest.fn(),
      }),
      width: 24,
      height: 24
    };

    ctx = canvas.getContext('2d');

    pacman = new Pacman();
  });

  test('should initialize Pacman with default values', () => {
    expect(pacman.x).toBe(0);
    expect(pacman.y).toBe(0);
    expect(pacman.radius).toBe(10);
    expect(pacman.speed).toBe(3);
    expect(pacman.angle1).toBe(0.25);
    expect(pacman.angle2).toBe(1.75);
  });

  test('should move Pacman to the right', () => {
    pacman.move('right');
    expect(pacman.x).toBe(3);
    expect(pacman.y).toBe(0);
  });

  test('should move Pacman down', () => {
    pacman.move('down');
    expect(pacman.x).toBe(0);
    expect(pacman.y).toBe(3);
  });

  test('should not move Pacman outside the canvas (left boundary)', () => {
    pacman.x = 0;
    pacman.move('left');
    expect(pacman.x).toBeGreaterThanOrEqual(0);
  });

  test('should not move Pacman outside the canvas (top boundary)', () => {
    pacman.y = 0;
    pacman.move('up');
    expect(pacman.y).toBeGreaterThanOrEqual(0);
  });

  test('should not move Pacman outside the canvas (right boundary)', () => {
    pacman.x = 20;
    pacman.move('right');
    expect(pacman.x).toBeLessThanOrEqual(24);
  });

  test('should not move Pacman outside the canvas (bottom boundary)', () => {
    pacman.y = 20;
    pacman.move('down');
    expect(pacman.y).toBeLessThanOrEqual(24);
  });

});

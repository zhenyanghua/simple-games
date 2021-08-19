const sprite = new Image();
sprite.src = 'sprite.png';
sprite.width = 146
sprite.height = 38;
sprite.onload = load;

const canvas = document.querySelector('#canvas');
const ctx = canvas.getContext('2d');

// constants
const cellSize = 18;
const gridXCount = 19;
const gridYCount = 14;
const flowers = 40;
const images = {};

// This observer acts as the global change detection handler.
const observer = new Proxy({ event: null }, {
  set(obj, prop, value) {
    // trigger hooks when a new event is emitted.
    if (prop === 'event') {
      if (obj.event) {
        if(update()) {
          draw();
        }
      }
    } 
    return Reflect.set(...arguments);   
  }
})

// state
let grid, gameOver, firstClick, selectedX, selectedY;

// Register any events that needs to be observed for change detection.
canvas.addEventListener('mousemove', e => {
  observer.event = e;
});
canvas.addEventListener('mouseup', (e) => {
  observer.event = e; 
});

/**
 * Utitlity method to get mouse X, Y from the canvas.
 * It starts from top-left corner (0, 0) to the bottom right corner (w, h)
 * @param {HTMLCanvasElement} canvas 
 * @param {MouseEvent} evt 
 * @returns mouse x, y
 */
function getMousePos(canvas, evt) {
  const rect = canvas.getBoundingClientRect();
  return {
      x: evt.clientX - rect.left,
      y: evt.clientY - rect.top
  };
}

function drawCell(imageKey, x, y) {
  images[imageKey](x, y);
}

/**
 * Lood hook only runs once when the app is loaded. It is triggered first
 * before any other hooks are triggered.
 */
function load() {
  // loading sprite to an object that contains the drawing function to 
  // draw each section in the sprite.
  for (let i = 1; i <=8; i++) {
    images[i] = (x, y) => ctx.drawImage(sprite, 
      (i - 1) * cellSize + 1, cellSize + 1, cellSize, cellSize, 
      (x - 1) * cellSize, (y - 1) * cellSize, cellSize, cellSize);
  }

  ['covered', 'covered_highlighted', 'uncovered',  
  'flower', 'flag', 'question'].forEach((image, i) => {
    images[image] = (x, y) => ctx.drawImage(sprite,
      i * cellSize + 1, 1, cellSize, cellSize,
      (x - 1) * cellSize, (y - 1) * cellSize, cellSize, cellSize);
  })

  // setting initial state
  function reset() {
    grid = {};
    gameOver = false;
    firstClick = true;

    for (let y = 1; y <= gridYCount; y++) {
      grid[y] = {};
      for (let x = 1; x < gridXCount; x++) {
        grid[y][x] = {
          flower: false,
          state: 'covered',
          surroundingFlowers: 0
        }
      }
    }
  }

  reset();

  draw();
}

/**
 * 'Update' hook runs when any registered events are triggered.
 * @returns {boolean} indicate if any new values are set.
 */
function update() {
  const position = getMousePos(canvas, observer.event);
  newSelectedX = Math.floor(position.x / cellSize) + 1;
  newSelectedY = Math.floor(position.y / cellSize) + 1;

  if (newSelectedX > gridXCount) {
    newSelectedX = gridXCount;
  }
  if (newSelectedY > gridYCount) {
    newSelectedY = gridYCount;
  }

  if (newSelectedX !== selectedX || newSelectedY !== selectedY) {
    selectedX = newSelectedX;
    selectedY = newSelectedY;
    return true;
  }
  return false;
}

/**
 * 'Draw' hook runs when if there is anything updated.
 */
function draw() {
  for (let y = 1; y <= gridYCount; y++) {
    for (let x = 1; x <= gridXCount; x++) {
      let image = 'covered';
      if (x === selectedX && y === selectedY && !gameOver) {
        // don't change hover effect when game is over
        if (observer.event.button !== undefined && observer.event.button == 1) {
          
        } else {
          image = 'covered_highlighted';
        }
      }
      drawCell(image, x, y);
    }
  }
}
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

// keywords for non-numbered images
const COVERED = 'covered';
const COVERED_HIGHLIGHTED = 'covered_highlighted';
const UNCOVERED = 'uncovered';
const FLOWER = 'flower';
const FLAG = 'flag';
const QUESTION = 'question';

// This observer acts as the global change detection handler.
const observer = new Proxy({ event: null }, {
  set(obj, prop, value) {
    // trigger hooks when a new event is emitted.
    if (prop === 'event' && value !== null) {
      if(update(value)) {
        draw();
      }
    } 
    return Reflect.set(...arguments);
  }
})

// state
let grid, gameOver, firstClick, selectedX, selectedY;

// Register any events that needs to be observed for change detection.
canvas.addEventListener('mouseover', e => {
  e.preventDefault();
  observer.event = e;
});
canvas.addEventListener('mousemove', e => {
  e.preventDefault();
  observer.event = e;
});
canvas.addEventListener('mousedown', e => {
  e.preventDefault();
  observer.event = e;
})
canvas.addEventListener('mouseup', e => {
  e.preventDefault();
  // register mouseReleased hook
  const mousePosition = getMousePos(canvas, e);
  mouseReleased(mousePosition.x, mousePosition.y, e.button);
  // signal changes to kickoff the updates
  observer.event = e; 
});
// Disable context menu
canvas.addEventListener('contextmenu', (e) => {
  e.preventDefault()
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

/**
 * 0 - main button (left)
 * 1 - auxiliary button (middle)
 * 2 - secondary button (right)
 * @param {Number} button 
 * @returns 
 */
function isMouseDown(button) {
  return observer.event 
    && observer.event.button === button 
    && observer.event.type === 'mousedown';
}

function drawCell(imageKey, x, y) {
  images[imageKey](x, y);
}

// setting initial state
function reset() {
  observer.event = null
  grid = {};
  gameOver = false;
  firstClick = true;

  for (let y = 1; y <= gridYCount; y++) {
    grid[y] = {};
    for (let x = 1; x <= gridXCount; x++) {
      grid[y][x] = {
        flower: false,
        state: COVERED,
        surroundingFlowers: 0
      }
    }
  }
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

  [COVERED, COVERED_HIGHLIGHTED, UNCOVERED, FLOWER, FLAG, QUESTION]
    .forEach((image, i) => {
      images[image] = (x, y) => ctx.drawImage(sprite,
        i * cellSize + 1, 1, cellSize, cellSize,
        (x - 1) * cellSize, (y - 1) * cellSize, cellSize, cellSize);
    });

  reset();
  draw();
}

/**
 * 'MouseReleased' hook runs when a mouse button is released.
 * @param {Number} mouseX 
 * @param {Number} mouseY 
 * @param {Number} button 
 */
function mouseReleased(mouseX, mouseY, button) {
  if (!gameOver) {
    if (button === 0 && grid[selectedY][selectedX].state !== FLAG) {
      if (firstClick) {
        firstClick = false;
        // randomly generate x number of flowers
        const flowerPositions = [];
        for (let y = 1; y <= gridYCount; y++) {
          for (let x = 1; x <= gridXCount; x++) {
            // exclude the first clicked cell from the flower random pool
            if (!(x === selectedX && y === selectedY)) {
              flowerPositions.push({ x, y });
            }
          }
        }
        for (let x = 1; x <= flowers; x++) {
          const nth = Math.floor(Math.random() * flowerPositions.length);
          const [item] = flowerPositions.splice(nth, 1);
          grid[item.y][item.x].flower = true;
        }

        // derive the surrounding flowers
        for (let y = 1; y <= gridYCount; y++) {
          for (let x = 1; x <= gridXCount; x++) {
            let surroundingFlowers = 0;
            for (let dy = -1; dy <= 1; dy++) {
              for (let dx = -1; dx <= 1; dx++) {
                if (!(dy === y && dx === x)) {
                  if (grid[y + dy]
                    && grid[y + dy][x + dx]
                    && grid[y + dy][x + dx].flower) {
                      surroundingFlowers++;
                    }
                }
              }
            }
            grid[y][x].surroundingFlowers = surroundingFlowers;
          }
        }
      }

      // if a numbered cell is clicked, if its surrounding flags #  === its own number,
      // reveal the rest of the uncovered cells.
      let flags;
      if (grid[selectedY][selectedX].surroundingFlowers > 0) {
        flags = 0;
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            if (grid[selectedY + dy]
              && grid[selectedY + dy][selectedX + dx]
              && grid[selectedY + dy][selectedX + dx].state === FLAG) {
              flags++;
            }
          }
        }
      }

      if (grid[selectedY][selectedX].surroundingFlowers === flags) {
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            if (!(dy === 0 && dx === 0)
              && grid[selectedY + dy]
              && grid[selectedY + dy][selectedX + dx]
              && grid[selectedY + dy][selectedX + dx].state !== FLAG) {
              // game over if the revealed cell is flower
              if (grid[selectedY + dy][selectedX + dx].flower) {
                gameOver = true;
              } else {
                grid[selectedY + dy][selectedX + dx].state = UNCOVERED;
              }
            }
          }
        }
      }

      // game lost: flower is clicked
      if (grid[selectedY][selectedX].flower) {
        grid[selectedY][selectedX].state = UNCOVERED;
        gameOver = true;
      } else {
        // flood fill the grid
        // add the covered cell and its surrounding cells when it doesn't have any
        // surrounding flowers to the stack
        const uncoveredStack = [{ x: selectedX, y: selectedY }];
        while(uncoveredStack.length > 0) {
          const {x, y} = uncoveredStack.pop();
          grid[y][x].state = UNCOVERED;

          if (grid[y][x].surroundingFlowers === 0) {
            for (let dy = -1; dy <= 1; dy++) {
              for (let dx = -1; dx <= 1; dx++) {
                if (!(dy === y && dx === x)
                && grid[y + dy]
                && grid[y + dy][x + dx]
                && (grid[y + dy][x + dx].state === COVERED
                  || grid[y + dy][x + dx].state === QUESTION)) {
                    uncoveredStack.push({
                      x: x + dx,
                      y: y + dy
                    });
                  }
              }
            }
          }
        }
      }

      // game won: all covered cells left have flowers
      // evaluate after the current click
      let complete = true;
      for (let y = 1; y <= gridYCount; y++) {
        for (let x = 1; x <= gridXCount; x++) {
          if (grid[y][x].state !== UNCOVERED && !grid[y][x].flower) {
            complete = false;
          }
        }
      }
      if (complete) {
        gameOver = true;
      }
    } else if (button === 2) {
      // cycle through the images: covered -> flag -> question
      if (grid[selectedY][selectedX].state === COVERED) {
        grid[selectedY][selectedX].state = FLAG;
      } else if (grid[selectedY][selectedX].state === FLAG) {
        grid[selectedY][selectedX].state = QUESTION;
      } else if (grid[selectedY][selectedX].state === QUESTION) {
        grid[selectedY][selectedX].state = COVERED;
      }
    }
  } else {
    reset();
  }
}

/**
 * 'Update' hook runs when any registered events are triggered.
 * @returns {Boolean} indicate if any new values are set.
 */
function update(newEvent) {
  let hasChange = false;
  const position = getMousePos(canvas, newEvent);

  newSelectedX = Math.floor(position.x / cellSize) + 1;
  newSelectedY = Math.floor(position.y / cellSize) + 1;

  if (newSelectedX > gridXCount) {
    newSelectedX = gridXCount;
  }
  if (newSelectedY > gridYCount) {
    newSelectedY = gridYCount;
  }
    
  switch (newEvent.type) {
    case 'mousemove':
      if (newSelectedX !== selectedX || newSelectedY !== selectedY) {
        hasChange = true;
      }
      break;
    case 'mouseup':
    case 'contextmenu':
      hasChange = true;
      break;
  }

  selectedX = newSelectedX;
  selectedY = newSelectedY;
  
  return hasChange;
}

/**
 * 'Draw' hook runs when if there is anything updated.
 */
function draw() {
  for (let y = 1; y <= gridYCount; y++) {
    for (let x = 1; x <= gridXCount; x++) {
      let image = COVERED;
      
      // don't change hover effect when game is over
      if (x === selectedX && y === selectedY && !gameOver) {
        if (isMouseDown(0)) {
          console.debug('mouse is done')
          // make flagged cell always covered background
          if (grid[y][x].state === FLAG) {
            image = COVERED;
          } else {
            image = UNCOVERED;
          }
        } else {
          image = COVERED_HIGHLIGHTED;
        }
      }
      
      if (grid[y][x].state === UNCOVERED) {
        image = UNCOVERED;
      }
      
      drawCell(image, x, y);

      if (grid[y][x].flower) {
        // flowers are only revealed when the game is over
        if (gameOver) {
          drawCell(FLOWER, x, y);
        }
      } else if (grid[y][x].surroundingFlowers > 0) {
        // only reveal cell when it's uncovered
        if (grid[y][x].state === UNCOVERED) {
          drawCell(grid[y][x].surroundingFlowers, x, y);
        }
      }

      if (grid[y][x].state === FLAG) {
        drawCell(FLAG, x, y);
      } else if (grid[y][x].state === QUESTION) {
        drawCell(QUESTION, x, y);
      }
    }
  }
}
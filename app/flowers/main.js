const sprite = new Image();
sprite.src = 'sprite.png';
sprite.width = 146
sprite.height = 38;
sprite.onload = () => {
  load()
}

const canvas = document.querySelector('#canvas');
const ctx = canvas.getContext('2d');

const cellSize = 18;
const gridXCount = 19;
const gridYCount = 14;
const flowers = 40;
const images = {};

let grid, gameOver, firstClick;

function load() {
  // ctx.drawImage(sprite, 0, 0, sprite.width, sprite.height);
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

function drawCell(imageKey, x, y) {
  images[imageKey](x, y);
}

function draw() {
  for (let y = 1; y <= gridYCount; y++) {
    for (let x = 1; x <= gridXCount; x++) {
      drawCell('covered', x, y);
    }
  }
}
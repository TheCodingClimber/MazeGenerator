const canvas = document.getElementById('mazeCanvas');
const ctx = canvas.getContext('2d');
const slider = document.getElementById('sizeSlider');
const sizeDisplay = document.getElementById('sizeValue');
const sizeDisplayY = document.getElementById('sizeValueY');

let rows = parseInt(slider.value);
let cols = parseInt(slider.value);
let cellSize = canvas.width / cols;

let grid = [];
let stack = [];

class Cell {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.walls = [true, true, true, true]; // top, right, bottom, left
    this.visited = false;
  }

  draw() {
    const x = this.x * cellSize;
    const y = this.y * cellSize;

    // Start = green, End = red
    if (this.x === 0 && this.y === 0) {
      ctx.fillStyle = 'lightgreen';
      ctx.fillRect(x, y, cellSize, cellSize);
    } else if (this.x === cols - 1 && this.y === rows - 1) {
      ctx.fillStyle = 'lightcoral';
      ctx.fillRect(x, y, cellSize, cellSize);
    }

    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;

    if (this.walls[0]) drawLine(x, y, x + cellSize, y); // top
    if (this.walls[1]) drawLine(x + cellSize, y, x + cellSize, y + cellSize); // right
    if (this.walls[2]) drawLine(x + cellSize, y + cellSize, x, y + cellSize); // bottom
    if (this.walls[3]) drawLine(x, y + cellSize, x, y); // left
  }

  checkNeighbors() {
    let neighbors = [];

    const top = grid[index(this.x, this.y - 1)];
    const right = grid[index(this.x + 1, this.y)];
    const bottom = grid[index(this.x, this.y + 1)];
    const left = grid[index(this.x - 1, this.y)];

    if (top && !top.visited) neighbors.push(top);
    if (right && !right.visited) neighbors.push(right);
    if (bottom && !bottom.visited) neighbors.push(bottom);
    if (left && !left.visited) neighbors.push(left);

    if (neighbors.length > 0) {
      return neighbors[Math.floor(Math.random() * neighbors.length)];
    }
    return undefined;
  }
}

function drawLine(x1, y1, x2, y2) {
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
}

function index(x, y) {
  if (x < 0 || y < 0 || x >= cols || y >= rows) return -1;
  return x + y * cols;
}

function removeWalls(a, b) {
  const x = a.x - b.x;
  const y = a.y - b.y;

  if (x === 1) {
    a.walls[3] = false;
    b.walls[1] = false;
  } else if (x === -1) {
    a.walls[1] = false;
    b.walls[3] = false;
  }

  if (y === 1) {
    a.walls[0] = false;
    b.walls[2] = false;
  } else if (y === -1) {
    a.walls[2] = false;
    b.walls[0] = false;
  }
}

function generateMaze() {
  const style = document.getElementById('styleSelect').value;
  rows = parseInt(slider.value);
  cols = parseInt(slider.value);
  cellSize = canvas.width / cols;

  if (style === 'dfs') {
    generateWithDFS();
  } else if (style === 'prims') {
    generateWithPrims();
  } else if (style === 'recursive') {
    generateWithRecursiveDivision();
  }
}

// === DFS Generator ===
function generateWithDFS() {
  grid = [];
  stack = [];

  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      grid.push(new Cell(x, y));
    }
  }

  let current = grid[0];
  current.visited = true;
  stack.push(current);

  const loop = () => {
    if (stack.length > 0) {
      const next = current.checkNeighbors();

      if (next) {
        next.visited = true;
        stack.push(current);
        removeWalls(current, next);
        current = next;
      } else {
        current = stack.pop();
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      grid.forEach(cell => cell.draw());

      requestAnimationFrame(loop);
    }
  };

  loop();
}

// === Prim's Generator ===
function generateWithPrims() {
  grid = [];
  const frontier = [];

  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      grid.push(new Cell(x, y));
    }
  }

  const start = grid[index(0, 0)];
  start.visited = true;

  function addFrontier(cell) {
    const directions = [
      [0, -1], [1, 0], [0, 1], [-1, 0]
    ];

    for (const [dx, dy] of directions) {
      const nx = cell.x + dx;
      const ny = cell.y + dy;
      const neighbor = grid[index(nx, ny)];
      if (neighbor && !neighbor.visited && !frontier.includes(neighbor)) {
        frontier.push(neighbor);
      }
    }
  }

  addFrontier(start);

  function loop() {
    if (frontier.length > 0) {
      const randIndex = Math.floor(Math.random() * frontier.length);
      const current = frontier.splice(randIndex, 1)[0];
      const neighbors = [];

      const directions = [
        [0, -1], [1, 0], [0, 1], [-1, 0]
      ];

      for (const [dx, dy] of directions) {
        const nx = current.x + dx;
        const ny = current.y + dy;
        const neighbor = grid[index(nx, ny)];
        if (neighbor && neighbor.visited) {
          neighbors.push(neighbor);
        }
      }

      if (neighbors.length > 0) {
        const chosen = neighbors[Math.floor(Math.random() * neighbors.length)];
        removeWalls(current, chosen);
        current.visited = true;
        addFrontier(current);
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      grid.forEach(cell => cell.draw());

      requestAnimationFrame(loop);
    }
  }

  loop();
}

// === Recursive Division Generator ===
function generateWithRecursiveDivision() {
  grid = [];
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      grid.push(new Cell(x, y));
    }
  }

  // Set all walls back to "true" (full grid)
  grid.forEach(cell => {
    cell.visited = true;
    cell.walls = [true, true, true, true];
  });

  function carveGuaranteedPath() {
    let x = 0;
    let y = 0;
  
    while (x < cols - 1 || y < rows - 1) {
      const cell = grid[index(x, y)];
  
      // Choose to go right or down randomly (but prioritize end point)
      if (x < cols - 1 && (y === rows - 1 || Math.random() > 0.5)) {
        const next = grid[index(x + 1, y)];
        removeWalls(cell, next);
        x++;
      } else if (y < rows - 1) {
        const next = grid[index(x, y + 1)];
        removeWalls(cell, next);
        y++;
      }
    }
  }
  
  carveGuaranteedPath();
divide(0, 0, cols, rows, chooseOrientation(cols, rows));

  function divide(x, y, width, height, orientation) {
    if (width < 2 || height < 2) return;

    const horizontal = orientation === 'H';
    const wx = x + (horizontal ? 0 : Math.floor(Math.random() * (width - 2)));
    const wy = y + (horizontal ? Math.floor(Math.random() * (height - 2)) : 0);
    const px = wx + (horizontal ? Math.floor(Math.random() * width) : 0);
    const py = wy + (horizontal ? 0 : Math.floor(Math.random() * height));

    const dx = horizontal ? 1 : 0;
    const dy = horizontal ? 0 : 1;
    const length = horizontal ? width : height;

    for (let i = 0; i < length; i++) {
      const cx = wx + i * dx;
      const cy = wy + i * dy;

      if (cx === px && cy === py) continue;

      const cellA = grid[index(cx, cy)];
      const cellB = horizontal ? grid[index(cx, cy + 1)] : grid[index(cx + 1, cy)];

      if (cellA && cellB) {
        removeWallBetween(cellA, cellB, horizontal ? 'bottom' : 'right');
      }
    }

    const [w1x, w1y, w1w, w1h] = horizontal
      ? [x, y, width, wy - y + 1]
      : [x, y, wx - x + 1, height];

    const [w2x, w2y, w2w, w2h] = horizontal
      ? [x, wy + 1, width, y + height - wy - 1]
      : [wx + 1, y, x + width - wx - 1, height];

    divide(w1x, w1y, w1w, w1h, chooseOrientation(w1w, w1h));
    divide(w2x, w2y, w2w, w2h, chooseOrientation(w2w, w2h));
  }

  function removeWallBetween(a, b, wall) {
    if (wall === 'right') {
      a.walls[1] = false;
      b.walls[3] = false;
    } else if (wall === 'bottom') {
      a.walls[2] = false;
      b.walls[0] = false;
    }
  }

  function chooseOrientation(w, h) {
    if (w < h) return 'H';
    if (h < w) return 'V';
    return Math.random() > 0.5 ? 'H' : 'V';
  }

  divide(0, 0, cols, rows, chooseOrientation(cols, rows));
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  grid.forEach(cell => cell.draw());
}


// === PDF Export ===
document.getElementById('print').addEventListener('click', () => {
  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF({ orientation: "landscape" });

  const imageData = canvas.toDataURL("image/png");
  pdf.addImage(imageData, 'PNG', 10, 10, 270, 180);
  pdf.save("maze.pdf");
});

// === UI Updates ===
slider.addEventListener('input', () => {
  sizeDisplay.textContent = slider.value;
  sizeDisplayY.textContent = slider.value;
});

document.getElementById('generate').addEventListener('click', generateMaze);

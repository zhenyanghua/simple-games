-- This is a walk around to help debugging
printLines = {}

function print(...)
  for k, v in pairs({...}) do
    table.insert(printLines, tostring(v))
  end
end

-- this is to be placed at the end of the love.draw callback
function doPrint()
  local linesToShow = 20
  -- draws the last 10 items of printLines
  for i = 1, math.min(linesToShow, table.getn(printLines)) do
    local n = math.max(table.getn(printLines) - linesToShow, 0) + i
    love.graphics.setColor(0, 0, 0)
    love.graphics.print(printLines[n], 0, gridYCount * cellSize + i*15 + 1)
  end
end

function love.load()
  love.graphics.setBackgroundColor(1, 1, 1)
  
  cellSize = 5
  gridXCount = 70
  gridYCount = 50
  
  -- initial the grid that holds the cell
  -- from top to bottom horizontally
  grid = {}
  for y = 1, gridYCount do
    grid[y] = {}
    for x = 1, gridXCount do
      grid[y][x] = false
    end
  end
  -- make holding a key to repeat the keypressed callback
  love.keyboard.setKeyRepeat(true)
end

function liveOrDie(x, y)
  local neighborCount = 0
  for dy = -1, 1 do
    for dx = -1, 1 do
      if not (dy == 0 and dx ==0) 
      and grid[y + dy]
      and grid[y + dy][x + dx] then
        neighborCount = neighborCount + 1
      end
    end
  end
  if (grid[selectedY][selectedX] and (neighborCount == 2 or neighborCount == 3))
  or (not grid[selectedY][selectedX] and neighborCount == 3) then
    return true
  else
    return false
  end
end


-- debugging function
function love.mousepressed(x, y, button) 
  if button == 2 then
    local neighborCount = 0
    
    print('Finding neighbors of grid['..selectedY..']['..selectedX..']')
    
    for dy = -1, 1 do
      for dx = -1, 1 do
        print('Checking grid['..selectedY + dy..']['..selectedX + dx..']')
        
        if not (dy == 0 and dx ==0) 
        and grid[selectedY + dy]
        and grid[selectedY + dy][selectedX + dx] then
          print('Neighbor found')
          neighborCount = neighborCount + 1
        end
      end
    end
    print('Total neighbors: '..neighborCount)
  end
end

function love.keypressed()
  local nextGrid = {}
  
  for y = 1, gridYCount do
    nextGrid[y] = {}
    for x = 1, gridXCount do
      nextGrid[y][x] = liveOrDie(x, y)
    end
  end
  grid = nextGrid
end

function love.update()
  selectedX = math.min(math.floor(love.mouse.getX() / cellSize) + 1, gridXCount)
  selectedY = math.min(math.floor(love.mouse.getY() / cellSize) + 1, gridYCount)
  
  -- allow mouse down to make cell alive
  if love.mouse.isDown(1) then
    grid[selectedY][selectedX] = true
  -- allow right click a cell to make it dead
  elseif love.mouse.isDown(2) then
    grid[selectedY][selectedX] = false
  end
end

function love.draw()
  -- draw all the cells from top to bottom horizontally
  for y = 1, gridYCount do
    for x = 1, gridXCount do
      -- set up a border
      local cellDrawSize = cellSize - 1
      
      if x == selectedX and y == selectedY then
        -- color for mouse cursor cell
        love.graphics.setColor(0, 1, 1)
      elseif grid[y][x] then
        -- color for alive cell
        love.graphics.setColor(1, 0, 1)
      else
        -- color for dead cell
        love.graphics.setColor(.86, .86, .86)  
      end
      
      -- draw one cell
      love.graphics.rectangle(
        'fill', 
        (x - 1) * cellSize, 
        (y - 1) * cellSize, 
        cellDrawSize, 
        cellDrawSize
      )
    end
  end
  
  -- debugging
  love.graphics.setColor(0, 0, 0)
  love.graphics.print(
    'Selected x: '..selectedX..', selected y: '..selectedY, 
    0, 
    gridYCount * cellSize
  )
  
  doPrint()
end

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
  love.graphics.setColor(1, 1, 1)
end
  
function love.load()
  -- constants
  cellSize = 18
  gridXCount = 19
  gridYCount = 14
  flowers = 40
  
  -- Prepare sprite images
  love.graphics.setBackgroundColor(1, 1, 1)
  img = love.graphics.newImage('sprite.png')
  
  images = {}
  
  for i = 1, 8 do
    images[i] = love.graphics.newQuad((i - 1) * cellSize + 1, cellSize + 1, cellSize, cellSize, img:getDimensions())
  end
  
  
  for i, image in ipairs({
      'covered', 'covered_highlighted', 'uncovered',  
      'flower', 'flag', 'question' }) do
    images[image] = love.graphics.newQuad((i - 1) * cellSize + 1, 1, cellSize, cellSize, img:getDimensions())
  end
  
  -- set initial state
  function reset()
    grid = {}
    gameOver = false
    firstClick = true
    
    for y = 1, gridYCount do
      grid[y] = {}
      for x = 1, gridXCount do
        grid[y][x] = {
          flower = false,
          state = 'covered',
          surroundingFlowers = 0
        }
      end
    end
  end
  
  reset()
end

function love.update()
  selectedX = math.floor(love.mouse.getX() / cellSize) + 1
  selectedY = math.floor(love.mouse.getY() / cellSize) + 1

  if (selectedX > gridXCount) then
    selectedX = gridXCount
  end
  if (selectedY > gridYCount) then
    selectedY = gridYCount
  end
end

function love.mousereleased(mouseX, mouseY, button)
  if not gameOver then
    if button == 1 and grid[selectedY][selectedX].state ~= 'flag' then
      if firstClick then
        firstClick = false
        -- randomly generate x number of flowers
        local flowerPositions = {}
        
        for y = 1, gridYCount do
          for x = 1, gridXCount do
            -- exclude the first clicked cell from the flower random pool
            if not (x == selectedX and y == selectedY) then
              table.insert(flowerPositions, { x = x, y = y })
            end
          end
        end
        
        for x = 1, flowers do
          item = table.remove(flowerPositions, love.math.random(#flowerPositions))
          grid[item.y][item.x].flower = true
        end
        
        -- derive the surrounding flowers
        for y = 1, gridYCount do
          for x = 1, gridXCount do
            local surroundingFlowers = 0
            for dy = -1, 1 do
              for dx = -1, 1 do
                if not (dy == y and dx == x) then
                  if grid[y + dy]  
                    and grid[y + dy][x + dx]  
                    and grid[y + dy][x + dx].flower then
                    surroundingFlowers = surroundingFlowers + 1
                  end
                end
              end
            end
            grid[y][x].surroundingFlowers = surroundingFlowers
          end
        end
      end
      
      --[[
      if a numbered cell is clicked, 
        if its surrounding flags # == its own number, 
        reveal the rest of the uncovered cells.
      ]]--
      if grid[selectedY][selectedX].surroundingFlowers > 0 then
        local flags = 0
        for dy = -1, 1 do
          for dx = -1, 1 do
            if grid[selectedY + dy][selectedX + dx].state == 'flag' then
              flags = flags + 1
            end
          end
        end
        
        if grid[selectedY][selectedX].surroundingFlowers == flags then
          print('('..selectedY..','..selectedX..') - Flags: '..flags)
          for dy = -1, 1 do
            for dx = -1, 1 do
              if not (dy == 0 and dx == 0)
                and grid[selectedY + dy][selectedX + dx].state ~= 'flag' then
                -- game over if the revealed cell is flower
                if grid[selectedY + dy][selectedX + dx].flower then
                  gameOver = true
                else 
                  grid[selectedY + dy][selectedX + dx].state = 'uncovered'
                end
              end
            end
          end
        end
      end
      
      -- game lost: flower is clicked
      if grid[selectedY][selectedX].flower then
        grid[selectedY][selectedX].state = 'uncovered'
        gameOver = true
      else
        --[[
        flood fill the grid
        add the covered cell and its surrounding cells when it doesn't have any 
        surround flowers to the stack 
        ]]--
        local uncoveredStack = {
          { x = selectedX, y = selectedY }
        }
        while #uncoveredStack > 0 do
          local current = table.remove(uncoveredStack)
          local x = current.x
          local y = current.y
          grid[y][x].state = 'uncovered'
          
          if grid[y][x].surroundingFlowers == 0 then
            for dy = -1, 1 do
              for dx = -1, 1 do
                if not (dx == x and dy == y) 
                and grid[y + dy] 
                and grid[y + dy][x + dx]
                and (
                  grid[y + dy][x + dx].state == 'covered'
                  or grid[y + dy][x + dx].state == 'question'
                ) then
                  table.insert(uncoveredStack, {
                    x = x + dx,
                    y = y + dy
                  })
                end
              end
            end
          end
        end
        -- game won: all covered cells left have flowers
        -- evaluate after the current click
        local complete = true
        for y = 1, gridYCount do
          for x = 1, gridXCount do
            if grid[y][x].state ~= 'uncovered' and not grid[y][x].flower then
              complete = false
            end
          end
        end
        if complete then
          gameOver = true
        end
      end
    elseif button == 2 then
      -- cycle through the images: covered -> flag -> question
      if grid[selectedY][selectedX].state == 'covered' then
        grid[selectedY][selectedX].state = 'flag'
      elseif grid[selectedY][selectedX].state == 'flag' then
        grid[selectedY][selectedX].state = 'question'
      elseif grid[selectedY][selectedX].state == 'question' then
        grid[selectedY][selectedX].state = 'covered'
      end
    end
  else
    reset()
  end
end

function love.draw()
  for y = 1, gridYCount do
    for x = 1, gridXCount do
      local function drawCell(quad, x, y)
        love.graphics.draw(
          img, 
          quad,
          (x - 1) * cellSize, 
          (y - 1) * cellSize
        )
      end
    
      if x == selectedX and y == selectedY 
        and not gameOver then -- don't change hover effect when game is over
        if love.mouse.isDown(1) then
          -- make flagged cell always covered background
          if grid[y][x].state == 'flag' then
            quad = images.covered
          else
            quad = images.uncovered
          end
        else
          quad = images.covered_highlighted
        end
      else
        quad = images.covered
      end
      
      if grid[y][x].state == 'uncovered' then
        quad = images.uncovered
      end
      
      drawCell(quad, x, y)
      
    
      if grid[y][x].flower then
        -- flowers are only revealed when the game is over
        if gameOver then 
          drawCell(images.flower, x, y) 
        end
      elseif grid[y][x].surroundingFlowers > 0 then
        -- only reveal cell when it's uncovered
        if grid[y][x].state == 'uncovered' then
          drawCell(images[grid[y][x].surroundingFlowers], x, y)
        end      
      end
      
      if grid[y][x].state == 'flag' then
        drawCell(images.flag, x, y)
      elseif grid[y][x].state == 'question' then
        drawCell(images.question, x, y)
      end
      
    end
  end
  
  doPrint()
  
  --[[ debugging
  love.graphics.setColor(0, 0, 0)
  love.graphics.print('selected x: '..selectedX..' selected y: '..selectedY)
  love.graphics.setColor(1, 1, 1)
  ]]--
end



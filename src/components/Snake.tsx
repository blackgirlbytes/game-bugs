import React, { useEffect, useRef, useState } from 'react';
import { useGameStore } from '../store/gameStore';

const GRID_SIZE = 20;
const CELL_SIZE = 20;
const INITIAL_SPEED = 150;
const SCORE_MILESTONES = [5, 10, 15, 20, 25, 30]; // Points at which to log success

type Position = {
  x: number;
  y: number;
};

export const Snake: React.FC = () => {
  const [snake, setSnake] = useState<Position[]>([{ x: 10, y: 10 }]);
  const [food, setFood] = useState<Position>({ x: 15, y: 15 });
  const [direction, setDirection] = useState<'UP' | 'DOWN' | 'LEFT' | 'RIGHT'>('RIGHT');
  const [isGameOver, setIsGameOver] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [highScore, setHighScore] = useState(0);
  const gameLoopRef = useRef<number>();
  
  const { updateScore, addLog } = useGameStore();

  const generateFood = () => {
    const newFood = {
      x: Math.floor(Math.random() * GRID_SIZE),
      y: Math.floor(Math.random() * GRID_SIZE),
    };
    setFood(newFood);
    addLog({
      type: 'info',
      message: 'Food generated',
      severity: 'low',
      category: 'game-mechanics',
      details: newFood,
      gameState: {
        score: snake.length - 1,
        snakeLength: snake.length,
        position: snake[0],
      },
    });
  };

  const checkCollision = (head: Position) => {
    // Wall collision
    if (
      head.x < 0 ||
      head.x >= GRID_SIZE ||
      head.y < 0 ||
      head.y >= GRID_SIZE
    ) {
      addLog({
        type: 'error',  // Changed from 'info' to 'error'
        message: 'Wall collision detected',
        severity: 'medium',  // Changed from 'none' to 'medium'
        category: 'collision',
        details: { head, bounds: { width: GRID_SIZE, height: GRID_SIZE } },
        gameState: {
          score: snake.length - 1,
          snakeLength: snake.length,
          position: head,
        },
      });
      return true;
    }

    // Self collision
    const selfCollision = snake.some((segment, index) => {
      if (index === 0) return false;
      return segment.x === head.x && segment.y === head.y;
    });

    if (selfCollision) {
      addLog({
        type: 'error',  // Changed from 'info' to 'error'
        message: 'Self collision detected',
        severity: 'medium',  // Changed from 'none' to 'medium'
        category: 'collision',
        details: { head, snake },
        gameState: {
          score: snake.length - 1,
          snakeLength: snake.length,
          position: head,
        },
      });
    }

    return selfCollision;
  };

  const checkAndLogAchievements = (newScore: number) => {
    // Check for milestone achievements
    if (SCORE_MILESTONES.includes(newScore)) {
      addLog({
        type: 'info',
        message: `Milestone reached: ${newScore} points!`,
        severity: 'medium',
        category: 'achievement',
        details: { milestone: newScore },
        gameState: {
          score: newScore,
          snakeLength: snake.length + 1,
          position: snake[0],
        },
      });
    }

    // Check for new high score
    if (newScore > highScore) {
      setHighScore(newScore);
      addLog({
        type: 'info',
        message: 'New high score!',
        severity: 'high',
        category: 'achievement',
        details: { newHighScore: newScore, previousHighScore: highScore },
        gameState: {
          score: newScore,
          snakeLength: snake.length + 1,
          position: snake[0],
        },
      });
    }
  };

  const moveSnake = () => {
    if (isGameOver || isPaused) return;

    const head = { ...snake[0] };
    switch (direction) {
      case 'UP':
        head.y -= 1;
        break;
      case 'DOWN':
        head.y += 1;
        break;
      case 'LEFT':
        head.x -= 1;
        break;
      case 'RIGHT':
        head.x += 1;
        break;
    }

    if (checkCollision(head)) {
      setIsGameOver(true);
      addLog({
        type: 'info',
        message: 'Game Over',
        severity: 'medium',  // Changed from 'none' to 'medium'
        category: 'game-state',
        details: { finalScore: snake.length - 1 },
        gameState: {
          score: snake.length - 1,
          snakeLength: snake.length,
          position: head,
        },
      });
      return;
    }

    const newSnake = [head];
    const ateFood = head.x === food.x && head.y === food.y;

    if (ateFood) {
      newSnake.push(...snake);
      generateFood();
      const newScore = newSnake.length - 1;
      updateScore(newScore);
      checkAndLogAchievements(newScore);
      addLog({
        type: 'info',
        message: 'Food eaten',
        severity: 'low',  // Changed from 'none' to 'low'
        category: 'game-mechanics',
        details: { newScore: newScore, foodPosition: food },
        gameState: {
          score: newScore,
          snakeLength: newSnake.length,
          position: head,
        },
      });
    } else {
      newSnake.push(...snake.slice(0, -1));
    }

    setSnake(newSnake);
  };

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      const newDirection = (() => {
        switch (e.key) {
          case 'ArrowUp':
            return direction !== 'DOWN' ? 'UP' : undefined;
          case 'ArrowDown':
            return direction !== 'UP' ? 'DOWN' : undefined;
          case 'ArrowLeft':
            return direction !== 'RIGHT' ? 'LEFT' : undefined;
          case 'ArrowRight':
            return direction !== 'LEFT' ? 'RIGHT' : undefined;
          default:
            return undefined;
        }
      })();

      if (newDirection) {
        setDirection(newDirection);
        addLog({
          type: 'info',
          message: 'Direction changed',
          severity: 'low',
          category: 'input',
          details: { oldDirection: direction, newDirection },
          gameState: {
            score: snake.length - 1,
            snakeLength: snake.length,
            position: snake[0],
          },
        });
      }

      if (e.key === ' ') {
        setIsPaused((prev) => {
          addLog({
            type: 'info',
            message: prev ? 'Game resumed' : 'Game paused',
            severity: 'low',  // Changed from 'none' to 'low'
            category: 'game-state',
            gameState: {
              score: snake.length - 1,
              snakeLength: snake.length,
              position: snake[0],
            },
          });
          return !prev;
        });
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [direction, snake]);

  useEffect(() => {
    if (!isGameOver && !isPaused) {
      gameLoopRef.current = window.setInterval(moveSnake, INITIAL_SPEED);
    }
    return () => {
      if (gameLoopRef.current) clearInterval(gameLoopRef.current);
    };
  }, [snake, direction, isGameOver, isPaused]);

  const resetGame = () => {
    setSnake([{ x: 10, y: 10 }]);
    generateFood();
    setDirection('RIGHT');
    setIsGameOver(false);
    updateScore(0);
    addLog({
      type: 'info',
      message: 'Game Reset',
      severity: 'low',  // Changed from 'none' to 'low'
      category: 'game-state',
      gameState: {
        score: 0,
        snakeLength: 1,
        position: { x: 10, y: 10 },
      },
    });
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div
        className="relative bg-gray-800 border-2 border-gray-700"
        style={{
          width: GRID_SIZE * CELL_SIZE,
          height: GRID_SIZE * CELL_SIZE,
        }}
      >
        {snake.map((segment, index) => (
          <div
            key={index}
            className="absolute bg-green-500 rounded-sm"
            style={{
              width: CELL_SIZE - 1,
              height: CELL_SIZE - 1,
              left: segment.x * CELL_SIZE,
              top: segment.y * CELL_SIZE,
            }}
          />
        ))}
        <div
          className="absolute bg-red-500 rounded-full"
          style={{
            width: CELL_SIZE - 1,
            height: CELL_SIZE - 1,
            left: food.x * CELL_SIZE,
            top: food.y * CELL_SIZE,
          }}
        />
      </div>
      <div className="text-center">
        <p className="text-lg">Score: {snake.length - 1}</p>
        <p className="text-sm text-gray-600">High Score: {highScore}</p>
      </div>
      {isGameOver && (
        <div className="text-center">
          <p className="text-xl font-bold text-red-500">Game Over!</p>
          <button
            onClick={resetGame}
            className="mt-2 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            Play Again
          </button>
        </div>
      )}
      {!isGameOver && (
        <button
          onClick={() => setIsPaused((prev) => !prev)}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          {isPaused ? 'Resume' : 'Pause'}
        </button>
      )}
    </div>
  );
};
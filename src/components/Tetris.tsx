import React, { useEffect, useRef, useState } from 'react';
import { useGameStore } from '../store/gameStore';

const GRID_WIDTH = 10;
const GRID_HEIGHT = 20;
const CELL_SIZE = 30;
const INITIAL_SPEED = 1000;

type Position = {
  x: number;
  y: number;
};

type TetrominoType = 'I' | 'O' | 'T' | 'S' | 'Z' | 'J' | 'L';

interface Tetromino {
  type: TetrominoType;
  position: Position;
  shape: number[][];
  color: string;
}

const TETROMINOES: Record<TetrominoType, { shape: number[][], color: string }> = {
  I: {
    shape: [
      [1, 1, 1, 1]
    ],
    color: 'bg-cyan-500'
  },
  O: {
    shape: [
      [1, 1],
      [1, 1]
    ],
    color: 'bg-yellow-500'
  },
  T: {
    shape: [
      [0, 1, 0],
      [1, 1, 1]
    ],
    color: 'bg-purple-500'
  },
  S: {
    shape: [
      [0, 1, 1],
      [1, 1, 0]
    ],
    color: 'bg-green-500'
  },
  Z: {
    shape: [
      [1, 1, 0],
      [0, 1, 1]
    ],
    color: 'bg-red-500'
  },
  J: {
    shape: [
      [1, 0, 0],
      [1, 1, 1]
    ],
    color: 'bg-blue-500'
  },
  L: {
    shape: [
      [0, 0, 1],
      [1, 1, 1]
    ],
    color: 'bg-orange-500'
  }
};

export const Tetris: React.FC = () => {
  const [board, setBoard] = useState<string[][]>(
    Array(GRID_HEIGHT).fill(null).map(() => Array(GRID_WIDTH).fill(''))
  );
  const [currentPiece, setCurrentPiece] = useState<Tetromino | null>(null);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const gameLoopRef = useRef<number>();

  const { updateScore, addLog } = useGameStore();

  const generateNewPiece = (): Tetromino => {
    const types = Object.keys(TETROMINOES) as TetrominoType[];
    const type = types[Math.floor(Math.random() * types.length)];
    const newPiece = {
      type,
      position: { x: Math.floor(GRID_WIDTH / 2) - 1, y: 0 },
      shape: TETROMINOES[type].shape,
      color: TETROMINOES[type].color
    };

    addLog({
      type: 'info',
      message: 'New piece generated',
      severity: 'low',
      category: 'game-mechanics',
      details: { pieceType: type },
      gameState: {
        score,
        currentPiece: type,
        position: newPiece.position
      }
    });

    return newPiece;
  };

  const isValidMove = (piece: Tetromino, offsetX: number, offsetY: number): boolean => {
    return piece.shape.every((row, y) =>
      row.every((cell, x) => {
        if (cell === 0) return true;
        const newX = piece.position.x + x + offsetX;
        const newY = piece.position.y + y + offsetY;
        return (
          newX >= 0 &&
          newX < GRID_WIDTH &&
          newY < GRID_HEIGHT &&
          (newY < 0 || board[newY][newX] === '')
        );
      })
    );
  };

  const rotatePiece = (piece: Tetromino): number[][] => {
    const rotated = piece.shape[0].map((_, index) =>
      piece.shape.map(row => row[index]).reverse()
    );
    return rotated;
  };

  const mergePieceToBoard = (piece: Tetromino) => {
    const newBoard = [...board];
    piece.shape.forEach((row, y) => {
      row.forEach((cell, x) => {
        if (cell === 1) {
          const boardY = piece.position.y + y;
          const boardX = piece.position.x + x;
          if (boardY >= 0 && boardY < GRID_HEIGHT) {
            newBoard[boardY][boardX] = piece.color;
          }
        }
      });
    });
    return newBoard;
  };

  const checkAndClearLines = () => {
    const newBoard = board.filter(row => !row.every(cell => cell !== ''));
    const linesCleared = GRID_HEIGHT - newBoard.length;
    
    if (linesCleared > 0) {
      const newLines = Array(linesCleared)
        .fill(null)
        .map(() => Array(GRID_WIDTH).fill(''));
      
      setBoard([...newLines, ...newBoard]);
      const newScore = score + (linesCleared * 100);
      setScore(newScore);
      updateScore(newScore);

      addLog({
        type: 'info',
        message: `Cleared ${linesCleared} lines`,
        severity: 'medium',
        category: 'game-mechanics',
        details: { linesCleared, newScore },
        gameState: {
          score: newScore,
          linesCleared,
        }
      });

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
          }
        });
      }
    }
  };

  const moveDown = () => {
    if (!currentPiece || isGameOver || isPaused) return;

    if (isValidMove(currentPiece, 0, 1)) {
      setCurrentPiece({
        ...currentPiece,
        position: {
          ...currentPiece.position,
          y: currentPiece.position.y + 1
        }
      });
    } else {
      const newBoard = mergePieceToBoard(currentPiece);
      setBoard(newBoard);
      checkAndClearLines();

      const newPiece = generateNewPiece();
      if (!isValidMove(newPiece, 0, 0)) {
        setIsGameOver(true);
        addLog({
          type: 'info',
          message: 'Game Over',
          severity: 'medium',
          category: 'game-state',
          details: { finalScore: score },
          gameState: { score }
        });
      } else {
        setCurrentPiece(newPiece);
      }
    }
  };

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (!currentPiece || isGameOver) return;

      switch (e.key) {
        case 'ArrowLeft':
          if (isValidMove(currentPiece, -1, 0)) {
            setCurrentPiece({
              ...currentPiece,
              position: {
                ...currentPiece.position,
                x: currentPiece.position.x - 1
              }
            });
          }
          break;
        case 'ArrowRight':
          if (isValidMove(currentPiece, 1, 0)) {
            setCurrentPiece({
              ...currentPiece,
              position: {
                ...currentPiece.position,
                x: currentPiece.position.x + 1
              }
            });
          }
          break;
        case 'ArrowDown':
          moveDown();
          break;
        case 'ArrowUp':
          const rotatedShape = rotatePiece(currentPiece);
          const rotatedPiece = { ...currentPiece, shape: rotatedShape };
          if (isValidMove(rotatedPiece, 0, 0)) {
            setCurrentPiece(rotatedPiece);
          }
          break;
        case ' ':
          setIsPaused(prev => {
            addLog({
              type: 'info',
              message: prev ? 'Game resumed' : 'Game paused',
              severity: 'low',
              category: 'game-state',
              gameState: { score }
            });
            return !prev;
          });
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [currentPiece, board, isGameOver, isPaused]);

  useEffect(() => {
    if (!currentPiece && !isGameOver) {
      setCurrentPiece(generateNewPiece());
    }
  }, [currentPiece, isGameOver]);

  useEffect(() => {
    if (!isGameOver && !isPaused) {
      gameLoopRef.current = window.setInterval(moveDown, INITIAL_SPEED);
    }
    return () => {
      if (gameLoopRef.current) clearInterval(gameLoopRef.current);
    };
  }, [currentPiece, isGameOver, isPaused]);

  const resetGame = () => {
    setBoard(Array(GRID_HEIGHT).fill(null).map(() => Array(GRID_WIDTH).fill('')));
    setCurrentPiece(null);
    setScore(0);
    setIsGameOver(false);
    updateScore(0);
    addLog({
      type: 'info',
      message: 'Game Reset',
      severity: 'none',
      category: 'game-state',
      gameState: {
        score: 0
      }
    });
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div
        className="relative bg-gray-800 border-2 border-gray-700"
        style={{
          width: GRID_WIDTH * CELL_SIZE,
          height: GRID_HEIGHT * CELL_SIZE,
        }}
      >
        {/* Draw board */}
        {board.map((row, y) =>
          row.map((cell, x) => (
            <div
              key={`${x}-${y}`}
              className={`absolute ${cell || 'bg-gray-900'}`}
              style={{
                width: CELL_SIZE - 1,
                height: CELL_SIZE - 1,
                left: x * CELL_SIZE,
                top: y * CELL_SIZE,
              }}
            />
          ))
        )}
        
        {/* Draw current piece */}
        {currentPiece &&
          currentPiece.shape.map((row, y) =>
            row.map((cell, x) => {
              if (cell === 1) {
                return (
                  <div
                    key={`piece-${x}-${y}`}
                    className={`absolute ${currentPiece.color}`}
                    style={{
                      width: CELL_SIZE - 1,
                      height: CELL_SIZE - 1,
                      left: (currentPiece.position.x + x) * CELL_SIZE,
                      top: (currentPiece.position.y + y) * CELL_SIZE,
                    }}
                  />
                );
              }
              return null;
            })
          )}
      </div>

      <div className="text-center">
        <p className="text-lg">Score: {score}</p>
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
          onClick={() => setIsPaused(prev => !prev)}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          {isPaused ? 'Resume' : 'Pause'}
        </button>
      )}
    </div>
  );
};
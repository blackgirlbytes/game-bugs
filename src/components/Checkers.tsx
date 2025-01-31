import React, { useEffect, useState } from 'react';
import { useGameStore } from '../store/gameStore';

const BOARD_SIZE = 8;
const CELL_SIZE = 50;

type Piece = {
  isKing: boolean;
  isPlayer: boolean; // true for player, false for computer
};

type Position = {
  row: number;
  col: number;
};

type Move = {
  from: Position;
  to: Position;
  captured?: Position;
};

export const Checkers: React.FC = () => {
  const [board, setBoard] = useState<(Piece | null)[][]>(initializeBoard());
  const [selectedPiece, setSelectedPiece] = useState<Position | null>(null);
  const [isGameOver, setIsGameOver] = useState(false);
  const [winner, setWinner] = useState<'player' | 'computer' | null>(null);
  const [isPlayerTurn, setIsPlayerTurn] = useState(true);

  const { updateScore, addLog } = useGameStore();

  function initializeBoard(): (Piece | null)[][] {
    const board = Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill(null));
    
    // Place player's pieces (bottom of board)
    for (let row = 5; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        if ((row + col) % 2 === 1) {
          board[row][col] = { isKing: false, isPlayer: true };
        }
      }
    }
    
    // Place computer's pieces (top of board)
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 8; col++) {
        if ((row + col) % 2 === 1) {
          board[row][col] = { isKing: false, isPlayer: false };
        }
      }
    }
    
    return board;
  }

  function getValidMoves(pos: Position): Position[] {
    if (!board[pos.row][pos.col]) return [];

    const piece = board[pos.row][pos.col]!;
    const moves: Position[] = [];
    const directions = piece.isKing ? [-1, 1] : [piece.isPlayer ? -1 : 1];

    directions.forEach(rowDir => {
      [-1, 1].forEach(colDir => {
        // Regular moves
        const newRow = pos.row + rowDir;
        const newCol = pos.col + colDir;
        if (isValidPosition(newRow, newCol) && !board[newRow][newCol]) {
          moves.push({ row: newRow, col: newCol });
        }

        // Capture moves
        const jumpRow = pos.row + (rowDir * 2);
        const jumpCol = pos.col + (colDir * 2);
        if (
          isValidPosition(jumpRow, jumpCol) &&
          !board[jumpRow][jumpCol] &&
          board[newRow][newCol] &&
          board[newRow][newCol]!.isPlayer !== piece.isPlayer
        ) {
          moves.push({ row: jumpRow, col: jumpCol });
        }
      });
    });

    return moves;
  }

  function isValidPosition(row: number, col: number): boolean {
    return row >= 0 && row < BOARD_SIZE && col >= 0 && col < BOARD_SIZE;
  }

  function makeMove(from: Position, to: Position) {
    const newBoard = board.map(row => [...row]);
    const piece = newBoard[from.row][from.col]!;
    
    // Move the piece
    newBoard[to.row][to.col] = piece;
    newBoard[from.row][from.col] = null;

    // Handle captures
    if (Math.abs(to.row - from.row) === 2) {
      const capturedRow = (from.row + to.row) / 2;
      const capturedCol = (from.col + to.col) / 2;
      newBoard[capturedRow][capturedCol] = null;

      addLog({
        type: 'info',
        message: `${piece.isPlayer ? 'Player' : 'Computer'} captured a piece`,
        severity: 'medium',
        category: 'game-mechanics',
        details: { from, to, captured: { row: capturedRow, col: capturedCol } },
        gameState: { position: to },
      });
    }

    // King promotion
    if ((piece.isPlayer && to.row === 0) || (!piece.isPlayer && to.row === BOARD_SIZE - 1)) {
      newBoard[to.row][to.col] = { ...piece, isKing: true };
      
      addLog({
        type: 'info',
        message: `${piece.isPlayer ? 'Player' : 'Computer'} piece promoted to king`,
        severity: 'medium',
        category: 'achievement',
        details: { position: to },
        gameState: { position: to },
      });
    }

    setBoard(newBoard);
    checkGameOver(newBoard);
  }

  function checkGameOver(currentBoard: (Piece | null)[][]) {
    let playerPieces = 0;
    let computerPieces = 0;

    for (let row = 0; row < BOARD_SIZE; row++) {
      for (let col = 0; col < BOARD_SIZE; col++) {
        const piece = currentBoard[row][col];
        if (piece) {
          if (piece.isPlayer) playerPieces++;
          else computerPieces++;
        }
      }
    }

    if (playerPieces === 0 || computerPieces === 0) {
      setIsGameOver(true);
      const winner = playerPieces > 0 ? 'player' : 'computer';
      setWinner(winner);
      updateScore(winner === 'player' ? playerPieces : computerPieces);
      
      addLog({
        type: 'info',
        message: `Game Over - ${winner} wins!`,
        severity: 'high',
        category: 'game-state',
        details: { winner, playerPieces, computerPieces },
        gameState: { score: winner === 'player' ? playerPieces : computerPieces },
      });
    }
  }

  function computerMove() {
    // Simple AI: Find all possible moves and choose one randomly
    const possibleMoves: Move[] = [];
    
    // Collect all possible moves
    for (let row = 0; row < BOARD_SIZE; row++) {
      for (let col = 0; col < BOARD_SIZE; col++) {
        const piece = board[row][col];
        if (piece && !piece.isPlayer) {
          const moves = getValidMoves({ row, col });
          moves.forEach(to => {
            possibleMoves.push({
              from: { row, col },
              to,
              captured: Math.abs(to.row - row) === 2 ? {
                row: (row + to.row) / 2,
                col: (col + to.col) / 2
              } : undefined
            });
          });
        }
      }
    }

    // Prioritize capture moves
    const captureMoves = possibleMoves.filter(move => move.captured);
    const moveToMake = captureMoves.length > 0
      ? captureMoves[Math.floor(Math.random() * captureMoves.length)]
      : possibleMoves[Math.floor(Math.random() * possibleMoves.length)];

    if (moveToMake) {
      setTimeout(() => {
        makeMove(moveToMake.from, moveToMake.to);
        setIsPlayerTurn(true);
        
        addLog({
          type: 'info',
          message: 'Computer made a move',
          severity: 'low',
          category: 'game-mechanics',
          details: moveToMake,
          gameState: { position: moveToMake.to },
        });
      }, 500);
    }
  }

  useEffect(() => {
    if (!isPlayerTurn && !isGameOver) {
      computerMove();
    }
  }, [isPlayerTurn, isGameOver]);

  function handleCellClick(row: number, col: number) {
    if (!isPlayerTurn || isGameOver) return;

    const piece = board[row][col];
    
    // If a piece is already selected
    if (selectedPiece) {
      const validMoves = getValidMoves(selectedPiece);
      const isValidMove = validMoves.some(move => move.row === row && move.col === col);

      if (isValidMove) {
        makeMove(selectedPiece, { row, col });
        setSelectedPiece(null);
        setIsPlayerTurn(false);
      } else {
        setSelectedPiece(null);
      }
    }
    // If selecting a new piece
    else if (piece && piece.isPlayer) {
      setSelectedPiece({ row, col });
    }
  }

  function resetGame() {
    setBoard(initializeBoard());
    setSelectedPiece(null);
    setIsGameOver(false);
    setWinner(null);
    setIsPlayerTurn(true);
    updateScore(0);
    
    addLog({
      type: 'info',
      message: 'Game Reset',
      severity: 'low',
      category: 'game-state',
      gameState: { score: 0 },
    });
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <div
        className="grid grid-cols-8 bg-gray-200"
        style={{
          width: BOARD_SIZE * CELL_SIZE,
          height: BOARD_SIZE * CELL_SIZE,
        }}
      >
        {board.map((row, rowIndex) =>
          row.map((piece, colIndex) => (
            <div
              key={`${rowIndex}-${colIndex}`}
              className={`
                ${(rowIndex + colIndex) % 2 === 0 ? 'bg-green-200' : 'bg-green-700'}
                ${selectedPiece?.row === rowIndex && selectedPiece?.col === colIndex ? 'border-2 border-yellow-400' : ''}
                relative
              `}
              style={{ width: CELL_SIZE, height: CELL_SIZE }}
              onClick={() => handleCellClick(rowIndex, colIndex)}
            >
              {piece && (
                <div
                  className={`
                    absolute rounded-full
                    ${piece.isPlayer ? 'bg-red-600' : 'bg-gray-900'}
                    ${piece.isKing ? 'border-4 border-yellow-400' : ''}
                  `}
                  style={{
                    width: CELL_SIZE * 0.8,
                    height: CELL_SIZE * 0.8,
                    left: CELL_SIZE * 0.1,
                    top: CELL_SIZE * 0.1,
                  }}
                />
              )}
            </div>
          ))
        )}
      </div>

      {isGameOver && (
        <div className="text-center">
          <p className="text-xl font-bold text-blue-500">
            Game Over! {winner === 'player' ? 'You won!' : 'Computer won!'}
          </p>
          <button
            onClick={resetGame}
            className="mt-2 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            Play Again
          </button>
        </div>
      )}

      <div className="text-center">
        <p className="text-lg">
          {isGameOver
            ? `Final Score: ${winner === 'player' ? 'You' : 'Computer'} won!`
            : `Turn: ${isPlayerTurn ? 'Your' : "Computer's"} move`}
        </p>
      </div>
    </div>
  );
};
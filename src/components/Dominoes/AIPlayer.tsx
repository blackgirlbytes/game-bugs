import React, { useEffect } from 'react';
import { useDominoStore } from '@/store/dominoes/dominoStore';
import { DominoTile, Move } from '@/types/dominoes';
import { useGameStore } from '@/store/gameStore';

const calculateBestMove = (
  hand: DominoTile[],
  endpoints: { left: number; right: number }
): Move | null => {
  // Simple AI: just play the first valid move
  for (const tile of hand) {
    if (endpoints.left === -1) {
      // First move of the game
      return { tile, end: 'right' };
    }

    // Check if tile can be played on either end
    if (tile.left === endpoints.left || tile.right === endpoints.left) {
      return { tile, end: 'left' };
    }
    if (tile.left === endpoints.right || tile.right === endpoints.right) {
      return { tile, end: 'right' };
    }
  }
  return null;
};

export const useAIPlayer = () => {
  const { gameState, placeTile, drawTile, passTurn } = useDominoStore();
  const addLog = useGameStore((state) => state.addLog);

  // Track AI moves for runaway detection
  const moveCountRef = React.useRef(0);
  const lastMoveTimeRef = React.useRef(Date.now());
  const MOVE_THRESHOLD = 5; // Max moves allowed
  const TIME_WINDOW = 2000; // Time window in milliseconds (2 seconds)

  useEffect(() => {
    const currentPlayer = gameState.players[gameState.currentPlayerIndex];
    
    // Only act if it's an AI player's turn
    if (currentPlayer.type === 'ai') {
      const currentTime = Date.now();
      
      // Reset counter if we're outside the time window
      if (currentTime - lastMoveTimeRef.current > TIME_WINDOW) {
        moveCountRef.current = 0;
      }
      
      // Increment move counter
      moveCountRef.current++;
      lastMoveTimeRef.current = currentTime;

      // Check for runaway AI
      if (moveCountRef.current > MOVE_THRESHOLD) {
        addLog({
          type: 'error',
          message: `Detected runaway AI in Dominoes - ${moveCountRef.current} moves in ${TIME_WINDOW}ms`,
          severity: 'high',
          category: 'dominoes',
          details: {
            moveCount: moveCountRef.current,
            timeWindow: TIME_WINDOW,
            playerName: currentPlayer.name,
            gameState: {
              boardSize: gameState.board.tiles.length,
              remainingTiles: gameState.boneyard.length,
            }
          }
        });
        return; // Stop the AI from making more moves
      }

      // Add a small delay to make the AI moves more visible
      setTimeout(() => {
        const bestMove = calculateBestMove(
          currentPlayer.hand,
          gameState.board.endpoints
        );

        if (bestMove) {
          // Play the move
          placeTile(bestMove.tile, bestMove.end);
          addLog({
            type: 'info',
            message: `AI ${currentPlayer.name} played ${bestMove.tile.left}-${bestMove.tile.right}`,
            severity: 'low',
            category: 'dominoes',
            details: { player: currentPlayer.id, move: bestMove },
          });
        } else if (gameState.boneyard.length > 0) {
          // Draw a tile if no move is possible
          drawTile();
          addLog({
            type: 'info',
            message: `AI ${currentPlayer.name} drew a tile`,
            severity: 'low',
            category: 'dominoes',
            details: { player: currentPlayer.id },
          });
        } else {
          // Pass if no moves and no tiles to draw
          passTurn();
          addLog({
            type: 'info',
            message: `AI ${currentPlayer.name} passed`,
            severity: 'low',
            category: 'dominoes',
            details: { player: currentPlayer.id },
          });
        }
      }, 1000);
    }
  }, [gameState.currentPlayerIndex]);

  return null;
};

export default useAIPlayer;
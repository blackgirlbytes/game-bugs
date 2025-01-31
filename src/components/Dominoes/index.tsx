import React, { useEffect, useState } from 'react';
import { useDominoStore } from '@/store/dominoes/dominoStore';
import { DominoTile } from '@/types/dominoes';
import { useGameStore } from '@/store/gameStore';
import { useAIPlayer } from './AIPlayer';

const Dominoes: React.FC = () => {
  const [selectedTile, setSelectedTile] = useState<DominoTile | null>(null);
  const [validEnds, setValidEnds] = useState<('left' | 'right')[]>([]);
  
  const {
    gameState,
    initializeGame,
    placeTile,
    drawTile,
    passTurn,
    getValidMoves,
  } = useDominoStore();

  const addLog = useGameStore((state) => state.addLog);

  // Initialize AI player hook
  useAIPlayer();

  useEffect(() => {
    initializeGame(4); // Start with 4 players (1 human + 3 AI)
  }, []);

  const handleTileClick = (tile: DominoTile) => {
    if (gameState.currentPlayerIndex !== 0) return; // Only allow human player to select tiles
    
    const moves = getValidMoves(tile);
    const ends = moves.map(move => move.end);
    
    setSelectedTile(tile);
    setValidEnds(ends);

    // If this is the first move, automatically place in the center
    if (gameState.board.tiles.length === 0) {
      placeTile(tile, 'right');
      setSelectedTile(null);
      setValidEnds([]);
    }
  };

  const handleEndClick = (end: 'left' | 'right') => {
    if (!selectedTile || !validEnds.includes(end)) return;

    placeTile(selectedTile, end);
    setSelectedTile(null);
    setValidEnds([]);
  };

  const handlePass = () => {
    if (gameState.currentPlayerIndex !== 0) return;
    passTurn();
  };

  const handleDraw = () => {
    if (gameState.currentPlayerIndex !== 0) return;
    drawTile();
  };

  const renderTile = (tile: DominoTile, isInHand: boolean = false, rotation: number = 0) => {
    const isSelected = selectedTile?.id === tile.id;
    
    return (
      <div
        key={tile.id}
        className={`
          relative
          border-2 border-gray-300 rounded
          w-20 h-40 m-2 cursor-pointer
          transform transition-all duration-200
          ${isSelected ? 'border-blue-500 scale-105' : ''}
          ${isInHand ? 'hover:border-blue-300' : ''}
          ${rotation ? `rotate-${rotation}` : ''}
        `}
        onClick={() => isInHand && handleTileClick(tile)}
      >
        <div className="flex flex-col items-center justify-between h-full p-2">
          <div className="text-2xl font-bold">{tile.left}</div>
          <div className="border-t-2 border-gray-300 w-full my-2" />
          <div className="text-2xl font-bold">{tile.right}</div>
        </div>
      </div>
    );
  };

  const renderBoard = () => {
    return (
      <div className="relative min-h-[200px] bg-green-100 rounded-lg p-8 mb-8">
        {gameState.board.tiles.length === 0 ? (
          <div className="absolute inset-0 flex items-center justify-center text-gray-500">
            Place first domino
          </div>
        ) : (
          <div className="flex items-center justify-center gap-2">
            {/* Left end zone */}
            {validEnds.includes('left') && (
              <div
                className="absolute left-4 top-1/2 transform -translate-y-1/2 
                          w-20 h-40 border-2 border-blue-300 border-dashed rounded
                          flex items-center justify-center cursor-pointer
                          bg-blue-50 opacity-70 hover:opacity-100"
                onClick={() => handleEndClick('left')}
              >
                Place Here
              </div>
            )}

            {/* Board tiles */}
            <div className="flex items-center flex-wrap justify-center gap-2">
              {gameState.board.tiles.map((placedTile, index) => 
                renderTile(placedTile.tile, false, placedTile.rotation)
              )}
            </div>

            {/* Right end zone */}
            {validEnds.includes('right') && (
              <div
                className="absolute right-4 top-1/2 transform -translate-y-1/2 
                          w-20 h-40 border-2 border-blue-300 border-dashed rounded
                          flex items-center justify-center cursor-pointer
                          bg-blue-50 opacity-70 hover:opacity-100"
                onClick={() => handleEndClick('right')}
              >
                Place Here
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  const renderPlayerHand = () => {
    const humanPlayer = gameState.players[0];
    return (
      <div className="bg-white rounded-lg p-4 shadow-md">
        <h3 className="text-xl font-bold mb-4">Your Hand</h3>
        <div className="flex flex-wrap items-center justify-center gap-2">
          {humanPlayer.hand.map((tile) => renderTile(tile, true))}
        </div>
      </div>
    );
  };

  const renderGameInfo = () => {
    const currentPlayer = gameState.players[gameState.currentPlayerIndex];
    return (
      <div className="bg-white rounded-lg p-4 shadow-md mb-4">
        <h2 className="text-xl font-bold text-center">
          Current Player: {currentPlayer.name}
          {currentPlayer.type === 'human' ? ' (You)' : ''}
        </h2>
        <div className="text-center mt-2">
          Boneyard: {gameState.boneyard.length} tiles remaining
        </div>
      </div>
    );
  };

  const renderControls = () => {
    const isHumanTurn = gameState.currentPlayerIndex === 0;
    return (
      <div className="flex justify-center gap-4 my-4">
        <button
          className={`px-4 py-2 rounded font-bold transition-colors
            ${isHumanTurn && gameState.boneyard.length > 0
              ? 'bg-blue-500 hover:bg-blue-600 text-white'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}
          onClick={handleDraw}
          disabled={!isHumanTurn || gameState.boneyard.length === 0}
        >
          Draw Tile
        </button>
        <button
          className={`px-4 py-2 rounded font-bold transition-colors
            ${isHumanTurn
              ? 'bg-gray-500 hover:bg-gray-600 text-white'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}
          onClick={handlePass}
          disabled={!isHumanTurn}
        >
          Pass
        </button>
      </div>
    );
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold text-center mb-8">Dominoes</h1>
      
      {renderGameInfo()}
      {renderBoard()}
      {renderPlayerHand()}
      {renderControls()}
    </div>
  );
};

export default Dominoes;
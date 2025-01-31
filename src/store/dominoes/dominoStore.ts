import { create } from 'zustand';
import { DominoTile, GameState, Player, Move, Position } from '@/types/dominoes';

const DOMINO_VALUES = [0, 1, 2, 3, 4, 5, 6];

interface DominoGameStore {
  gameState: GameState;
  initializeGame: (playerCount: number) => void;
  placeTile: (tile: DominoTile, end: 'left' | 'right') => void;
  drawTile: () => void;
  passTurn: () => void;
  canPlayTile: (tile: DominoTile) => boolean;
  getValidMoves: (tile: DominoTile) => Move[];
}

// Generate deterministic IDs for tiles
const generateTileId = (left: number, right: number): string => {
  return `tile-${left}-${right}`;
};

const generateDominoSet = (): DominoTile[] => {
  const dominoes: DominoTile[] = [];
  for (let i = 0; i <= 6; i++) {
    for (let j = i; j <= 6; j++) {
      dominoes.push({
        id: generateTileId(i, j),
        left: i,
        right: j,
        rotation: 0,
        isDouble: i === j,
      });
    }
  }
  return shuffleArray(dominoes);
};

// Deterministic shuffle using a seeded random number
const shuffleArray = <T>(array: T[]): T[] => {
  const newArray = [...array];
  const seed = 12345; // Fixed seed for consistent shuffling
  let currentIndex = newArray.length;
  let temporaryValue;
  let randomIndex;

  // Simple seeded random number generator
  const seededRandom = () => {
    let x = Math.sin(seed + currentIndex) * 10000;
    return x - Math.floor(x);
  };

  while (currentIndex !== 0) {
    randomIndex = Math.floor(seededRandom() * currentIndex);
    currentIndex -= 1;
    temporaryValue = newArray[currentIndex];
    newArray[currentIndex] = newArray[randomIndex];
    newArray[randomIndex] = temporaryValue;
  }

  return newArray;
};

const createInitialGameState = (playerCount: number): GameState => {
  const dominoes = generateDominoSet();
  const players: Player[] = [];
  
  // Create human player
  players.push({
    id: 'human',
    name: 'Player',
    type: 'human',
    hand: dominoes.splice(0, 7),
    score: 0,
  });

  // Create AI players
  for (let i = 1; i < playerCount; i++) {
    players.push({
      id: `ai-${i}`,
      name: `AI ${i}`,
      type: 'ai',
      hand: dominoes.splice(0, 7),
      score: 0,
    });
  }

  return {
    players,
    board: {
      tiles: [],
      endpoints: {
        left: -1,
        right: -1,
      },
    },
    currentPlayerIndex: 0,
    boneyard: dominoes,
    status: 'waiting',
  };
};

export const useDominoStore = create<DominoGameStore>((set, get) => ({
  gameState: createInitialGameState(4),

  initializeGame: (playerCount: number) => {
    const gameState = createInitialGameState(playerCount);
    set({ gameState });
  },

  placeTile: (tile: DominoTile, end: 'left' | 'right') => {
    set((state) => {
      const { gameState } = state;
      const currentPlayer = gameState.players[gameState.currentPlayerIndex];
      
      // Remove tile from player's hand
      currentPlayer.hand = currentPlayer.hand.filter((t) => t.id !== tile.id);
      
      // Calculate new position based on end and existing tiles
      const newPosition: Position = { x: 0, y: 0 }; // TODO: Implement proper position calculation
      
      const newTile = {
        tile,
        position: newPosition,
        rotation: 0, // TODO: Calculate proper rotation
      };

      // Update endpoints based on placement
      let newEndpoints = { ...gameState.board.endpoints };
      if (gameState.board.tiles.length === 0) {
        // First tile placement
        newEndpoints = {
          left: tile.left,
          right: tile.right,
        };
      } else {
        if (end === 'left') {
          newEndpoints.left = tile.right === gameState.board.endpoints.left ? tile.left : tile.right;
        } else {
          newEndpoints.right = tile.left === gameState.board.endpoints.right ? tile.right : tile.left;
        }
      }

      // Update board state
      const newBoard = {
        tiles: [...gameState.board.tiles, newTile],
        endpoints: newEndpoints,
      };

      // Move to next player
      const nextPlayerIndex = (gameState.currentPlayerIndex + 1) % gameState.players.length;

      return {
        gameState: {
          ...gameState,
          board: newBoard,
          currentPlayerIndex: nextPlayerIndex,
          lastMove: { tile, end },
        },
      };
    });
  },

  drawTile: () => {
    set((state) => {
      const { gameState } = state;
      if (gameState.boneyard.length === 0) return state;

      const currentPlayer = gameState.players[gameState.currentPlayerIndex];
      const drawnTile = gameState.boneyard[0];
      const newBoneyard = gameState.boneyard.slice(1);

      currentPlayer.hand.push(drawnTile);

      return {
        gameState: {
          ...gameState,
          boneyard: newBoneyard,
        },
      };
    });
  },

  passTurn: () => {
    set((state) => {
      const { gameState } = state;
      const nextPlayerIndex = (gameState.currentPlayerIndex + 1) % gameState.players.length;

      return {
        gameState: {
          ...gameState,
          currentPlayerIndex: nextPlayerIndex,
        },
      };
    });
  },

  canPlayTile: (tile: DominoTile) => {
    const { gameState } = get();
    const { endpoints } = gameState.board;

    if (gameState.board.tiles.length === 0) return true;

    return (
      tile.left === endpoints.left ||
      tile.right === endpoints.left ||
      tile.left === endpoints.right ||
      tile.right === endpoints.right
    );
  },

  getValidMoves: (tile: DominoTile) => {
    const { gameState } = get();
    const validMoves: Move[] = [];
    const { endpoints } = gameState.board;

    if (gameState.board.tiles.length === 0) {
      validMoves.push({ tile, end: 'right' });
      return validMoves;
    }

    if (tile.left === endpoints.left || tile.right === endpoints.left) {
      validMoves.push({ tile, end: 'left' });
    }
    if (tile.left === endpoints.right || tile.right === endpoints.right) {
      validMoves.push({ tile, end: 'right' });
    }

    return validMoves;
  },
}));
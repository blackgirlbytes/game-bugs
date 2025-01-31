export type DominoTile = {
  id: string;
  left: number;
  right: number;
  rotation: number; // 0, 90, 180, 270 degrees
  isDouble: boolean;
};

export type Position = {
  x: number;
  y: number;
};

export type PlacedTile = {
  tile: DominoTile;
  position: Position;
  rotation: number;
};

export type Player = {
  id: string;
  name: string;
  type: 'human' | 'ai';
  hand: DominoTile[];
  score: number;
};

export type GameStatus = 'waiting' | 'playing' | 'finished';

export type Move = {
  tile: DominoTile;
  end: 'left' | 'right';
};

export type BoardState = {
  tiles: PlacedTile[];
  endpoints: {
    left: number;
    right: number;
  };
};

export type GameState = {
  players: Player[];
  board: BoardState;
  currentPlayerIndex: number;
  boneyard: DominoTile[];
  status: GameStatus;
  winner?: Player;
  lastMove?: Move;
};
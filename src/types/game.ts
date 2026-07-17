export type GameMode = 'cash' | 'points';

export type GameStatus = 'setup' | 'active' | 'completed';

export interface Player {
  id: string;
  name: string;
  active: boolean;
  totalScore: number;
}

export interface RoundEntry {
  playerId: string;
  points: number;
  isWinner: boolean;
}

export interface Round {
  id: string;
  roundNumber: number;
  timestamp: number;
  entries: RoundEntry[];
}

export interface Game {
  id: string;
  name: string;
  mode: GameMode;
  maxPoints?: number;
  dollarPerPoint?: number;
  players: Player[];
  rounds: Round[];
  status: GameStatus;
  createdAt: number;
  completedAt?: number;
}

export const MAX_PLAYERS = 12;
export const MIN_PLAYERS_TO_START = 2;

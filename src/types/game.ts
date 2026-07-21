export type GameMode = 'cash' | 'points';

export type GameStatus = 'setup' | 'active' | 'completed';

export interface Player {
  id: string;
  name: string;
  active: boolean;
  totalScore: number;
  buyIns: number;
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
  dropPoints?: number;
  middleDropPoints?: number;
  fullCountPoints?: number;
  buyIn?: number;
  dollarPerPoint?: number;
  players: Player[];
  rounds: Round[];
  status: GameStatus;
  createdAt: number;
  completedAt?: number;
}

export const MAX_PLAYERS = 12;
export const MIN_PLAYERS_TO_START = 2;

export const DEFAULT_MAX_POINTS = 251;
export const DEFAULT_DROP_POINTS = 25;
export const DEFAULT_MIDDLE_DROP_POINTS = 50;
export const DEFAULT_FULL_COUNT_POINTS = 80;

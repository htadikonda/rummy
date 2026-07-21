import { DEFAULT_DROP_POINTS, Game, Player, Round, RoundEntry } from '../types/game';
import { generateId } from './id';

export function isEliminated(game: Game, player: Player): boolean {
  return game.mode === 'points' && game.maxPoints != null && player.totalScore >= game.maxPoints;
}

// A player joining (or rejoining) a points game mid-way can't start with fewer
// points than anyone currently playing, so they take the current worst score + 1.
export function nextJoinScore(game: Game): number {
  const activeScores = game.players.filter((p) => p.active).map((p) => p.totalScore);
  return activeScores.length > 0 ? Math.max(...activeScores) + 1 : 0;
}

// An eliminated player can only rejoin if doing so leaves at least one Drop's
// worth of room before hitting the elimination threshold again.
export function canRejoinAfterElimination(game: Game, rejoinScore: number): boolean {
  if (game.maxPoints == null) return true;
  const drop = game.dropPoints ?? DEFAULT_DROP_POINTS;
  return game.maxPoints - rejoinScore >= drop;
}

export interface RoundInput {
  winnerId: string;
  losses: Record<string, number>; // playerId -> points lost (entered as a positive number)
}

export function buildRoundEntries(game: Game, input: RoundInput): RoundEntry[] {
  const { winnerId, losses } = input;
  const loserEntries: RoundEntry[] = Object.entries(losses).map(([playerId, amount]) => ({
    playerId,
    points: game.mode === 'cash' ? -Math.abs(amount) : Math.abs(amount),
    isWinner: false,
  }));

  const winnerPoints =
    game.mode === 'cash'
      ? loserEntries.reduce((sum, entry) => sum + Math.abs(entry.points), 0)
      : 0;

  return [{ playerId: winnerId, points: winnerPoints, isWinner: true }, ...loserEntries];
}

export function applyRound(game: Game, input: RoundInput): Game {
  const entries = buildRoundEntries(game, input);
  const round: Round = {
    id: generateId(),
    roundNumber: game.rounds.length + 1,
    timestamp: Date.now(),
    entries,
  };

  const players = game.players.map((player) => {
    const entry = entries.find((e) => e.playerId === player.id);
    if (!entry) return player;
    const totalScore = player.totalScore + entry.points;
    const active =
      game.mode === 'points' && game.maxPoints != null
        ? totalScore < game.maxPoints
        : player.active;
    return { ...player, totalScore, active };
  });

  const activeCount = players.filter((p) => p.active).length;
  const shouldComplete = game.mode === 'points' && activeCount <= 1;

  return {
    ...game,
    players,
    rounds: [...game.rounds, round],
    status: shouldComplete ? 'completed' : game.status,
    completedAt: shouldComplete ? Date.now() : game.completedAt,
  };
}

export interface SettlementLine {
  playerId: string;
  playerName: string;
  totalScore: number;
  amount: number;
}

export function computeCashSettlement(game: Game): SettlementLine[] {
  const rate = game.dollarPerPoint ?? 0;
  return game.players
    .map((p) => ({
      playerId: p.id,
      playerName: p.name,
      totalScore: p.totalScore,
      amount: p.totalScore * rate,
    }))
    .sort((a, b) => b.amount - a.amount);
}

export interface Payment {
  fromPlayerId: string;
  fromPlayerName: string;
  toPlayerId: string;
  toPlayerName: string;
  amount: number;
}

// Greedy settlement: match largest debtor with largest creditor until balances clear.
export function computeSettlementPayments(lines: SettlementLine[]): Payment[] {
  const creditors = lines
    .filter((l) => l.amount > 0.005)
    .map((l) => ({ ...l }))
    .sort((a, b) => b.amount - a.amount);
  const debtors = lines
    .filter((l) => l.amount < -0.005)
    .map((l) => ({ ...l, amount: -l.amount }))
    .sort((a, b) => b.amount - a.amount);

  const payments: Payment[] = [];
  let i = 0;
  let j = 0;
  while (i < debtors.length && j < creditors.length) {
    const debtor = debtors[i];
    const creditor = creditors[j];
    const amount = Math.min(debtor.amount, creditor.amount);
    if (amount > 0.005) {
      payments.push({
        fromPlayerId: debtor.playerId,
        fromPlayerName: debtor.playerName,
        toPlayerId: creditor.playerId,
        toPlayerName: creditor.playerName,
        amount,
      });
    }
    debtor.amount -= amount;
    creditor.amount -= amount;
    if (debtor.amount <= 0.005) i += 1;
    if (creditor.amount <= 0.005) j += 1;
  }
  return payments;
}

export function pointsStandings(game: Game) {
  return [...game.players].sort((a, b) => {
    if (a.active !== b.active) return a.active ? -1 : 1;
    return a.totalScore - b.totalScore;
  });
}

export function createRematch(game: Game): Game {
  return {
    ...game,
    id: generateId(),
    name: game.name.endsWith(' (Rematch)') ? game.name : `${game.name} (Rematch)`,
    players: game.players.map((p) => ({ ...p, totalScore: 0, active: true })),
    rounds: [],
    status: 'active',
    createdAt: Date.now(),
    completedAt: undefined,
  };
}

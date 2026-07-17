import AsyncStorage from '@react-native-async-storage/async-storage';
import { Game } from '../types/game';

const GAMES_INDEX_KEY = 'rummy:games:index';
const gameKey = (id: string) => `rummy:games:${id}`;

export async function listGames(): Promise<Game[]> {
  const raw = await AsyncStorage.getItem(GAMES_INDEX_KEY);
  const ids: string[] = raw ? JSON.parse(raw) : [];
  const games = await Promise.all(
    ids.map(async (id) => {
      const gameRaw = await AsyncStorage.getItem(gameKey(id));
      return gameRaw ? (JSON.parse(gameRaw) as Game) : null;
    })
  );
  return games
    .filter((g): g is Game => g !== null)
    .sort((a, b) => b.createdAt - a.createdAt);
}

export async function getGame(id: string): Promise<Game | null> {
  const raw = await AsyncStorage.getItem(gameKey(id));
  return raw ? (JSON.parse(raw) as Game) : null;
}

export async function saveGame(game: Game): Promise<void> {
  await AsyncStorage.setItem(gameKey(game.id), JSON.stringify(game));
  const raw = await AsyncStorage.getItem(GAMES_INDEX_KEY);
  const ids: string[] = raw ? JSON.parse(raw) : [];
  if (!ids.includes(game.id)) {
    ids.push(game.id);
    await AsyncStorage.setItem(GAMES_INDEX_KEY, JSON.stringify(ids));
  }
}

export async function deleteGame(id: string): Promise<void> {
  await AsyncStorage.removeItem(gameKey(id));
  const raw = await AsyncStorage.getItem(GAMES_INDEX_KEY);
  const ids: string[] = raw ? JSON.parse(raw) : [];
  await AsyncStorage.setItem(
    GAMES_INDEX_KEY,
    JSON.stringify(ids.filter((existingId) => existingId !== id))
  );
}

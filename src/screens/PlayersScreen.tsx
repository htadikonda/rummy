import React, { useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { Game, MAX_PLAYERS, MIN_PLAYERS_TO_START, Player } from '../types/game';
import { getGame, saveGame } from '../storage/gameStorage';
import { generateId } from '../utils/id';
import { colors } from '../theme/colors';

type Props = NativeStackScreenProps<RootStackParamList, 'Players'>;

export default function PlayersScreen({ navigation, route }: Props) {
  const { gameId } = route.params;
  const [game, setGame] = useState<Game | null>(null);
  const [name, setName] = useState('');

  useEffect(() => {
    getGame(gameId).then(setGame);
  }, [gameId]);

  if (!game) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.helper}>Loading…</Text>
      </SafeAreaView>
    );
  }

  const atMax = game.players.length >= MAX_PLAYERS;

  const persist = async (updated: Game) => {
    setGame(updated);
    await saveGame(updated);
  };

  const addPlayer = async () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    if (atMax) {
      Alert.alert('Max players reached', 'Remove a player before adding another.');
      return;
    }
    const player: Player = { id: generateId(), name: trimmed, active: true, totalScore: 0 };
    await persist({ ...game, players: [...game.players, player] });
    setName('');
  };

  const removePlayer = (playerId: string) => {
    Alert.alert('Remove player?', undefined, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () =>
          persist({ ...game, players: game.players.filter((p) => p.id !== playerId) }),
      },
    ]);
  };

  const startGame = async () => {
    if (game.players.length < MIN_PLAYERS_TO_START) {
      Alert.alert('Need more players', `Add at least ${MIN_PLAYERS_TO_START} players to start.`);
      return;
    }
    const updated: Game = { ...game, status: 'active' };
    await persist(updated);
    navigation.replace('GameBoard', { gameId: game.id });
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <View style={styles.header}>
          <Text style={styles.title}>{game.name}</Text>
          <Text style={styles.subtitle}>
            {game.players.length} / {MAX_PLAYERS} players
          </Text>
        </View>

        <View style={styles.addRow}>
          <TextInput
            style={styles.input}
            placeholder={atMax ? 'Max players reached' : 'Player name'}
            placeholderTextColor={colors.textMuted}
            value={name}
            onChangeText={setName}
            editable={!atMax}
            onSubmitEditing={addPlayer}
            returnKeyType="done"
          />
          <Pressable
            style={[styles.addButton, atMax && styles.addButtonDisabled]}
            onPress={addPlayer}
            disabled={atMax}
          >
            <Text style={styles.addButtonText}>Add</Text>
          </Pressable>
        </View>

        {atMax && (
          <Text style={styles.warning}>
            Max of {MAX_PLAYERS} reached. Remove someone below to add a different player.
          </Text>
        )}

        <FlatList
          data={game.players}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item, index }) => (
            <View style={styles.playerRow}>
              <View style={styles.playerBadge}>
                <Text style={styles.playerBadgeText}>{index + 1}</Text>
              </View>
              <Text style={styles.playerName}>{item.name}</Text>
              <Pressable onPress={() => removePlayer(item.id)} hitSlop={10}>
                <Text style={styles.removeText}>Remove</Text>
              </Pressable>
            </View>
          )}
          ListEmptyComponent={
            <Text style={styles.helper}>No players yet. Add the first one above.</Text>
          }
        />

        <Pressable style={styles.startButton} onPress={startGame}>
          <Text style={styles.startButtonText}>Start Game</Text>
        </Pressable>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, paddingHorizontal: 20 },
  header: { marginTop: 12, marginBottom: 16 },
  title: { fontSize: 24, fontWeight: '800', color: colors.text },
  subtitle: { fontSize: 14, color: colors.textMuted, marginTop: 4 },
  addRow: { flexDirection: 'row', gap: 10, marginBottom: 8 },
  input: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.text,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
  },
  addButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingHorizontal: 20,
    justifyContent: 'center',
  },
  addButtonDisabled: { backgroundColor: colors.border },
  addButtonText: { color: '#062117', fontWeight: '700', fontSize: 15 },
  warning: { color: colors.warning, fontSize: 12, marginBottom: 10 },
  list: { paddingVertical: 12 },
  helper: { color: colors.textMuted, fontSize: 14, textAlign: 'center', marginTop: 20 },
  playerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    marginBottom: 8,
    gap: 12,
  },
  playerBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playerBadgeText: { color: colors.textMuted, fontWeight: '700', fontSize: 12 },
  playerName: { flex: 1, color: colors.text, fontSize: 16, fontWeight: '600' },
  removeText: { color: colors.danger, fontSize: 13, fontWeight: '600' },
  startButton: {
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginVertical: 16,
  },
  startButtonText: { color: '#062117', fontSize: 16, fontWeight: '700' },
});

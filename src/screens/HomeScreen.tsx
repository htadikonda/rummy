import React, { useCallback, useState } from 'react';
import {
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/types';
import { Game } from '../types/game';
import { deleteGame, listGames } from '../storage/gameStorage';
import { colors } from '../theme/colors';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

export default function HomeScreen({ navigation }: Props) {
  const [games, setGames] = useState<Game[]>([]);

  useFocusEffect(
    useCallback(() => {
      let mounted = true;
      listGames().then((loaded) => {
        if (mounted) setGames(loaded);
      });
      return () => {
        mounted = false;
      };
    }, [])
  );

  const openGame = (game: Game) => {
    if (game.status === 'completed') {
      navigation.navigate('Summary', { gameId: game.id });
    } else if (game.status === 'setup') {
      navigation.navigate('Players', { gameId: game.id });
    } else {
      navigation.navigate('GameBoard', { gameId: game.id });
    }
  };

  const confirmDelete = (game: Game) => {
    Alert.alert('Delete game?', `This removes "${game.name}" and all its rounds.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteGame(game.id);
          setGames((prev) => prev.filter((g) => g.id !== game.id));
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Text style={styles.title}>Indian Rummy</Text>
        <Text style={styles.subtitle}>Score Tracker</Text>
      </View>

      <Pressable style={styles.hostButton} onPress={() => navigation.navigate('HostGame')}>
        <Text style={styles.hostButtonText}>+ Host New Game</Text>
      </Pressable>

      <Text style={styles.sectionLabel}>Your Games</Text>

      {games.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No games yet. Host one to get started.</Text>
        </View>
      ) : (
        <FlatList
          data={games}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <Pressable
              style={styles.gameRow}
              onPress={() => openGame(item)}
              onLongPress={() => confirmDelete(item)}
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.gameName}>{item.name}</Text>
                <Text style={styles.gameMeta}>
                  {item.mode === 'cash' ? 'Cash Game' : 'Points Game'} ·{' '}
                  {item.players.length} players · {item.rounds.length} rounds
                </Text>
              </View>
              <View style={[styles.badge, badgeStyle(item.status)]}>
                <Text style={styles.badgeText}>{statusLabel(item.status)}</Text>
              </View>
            </Pressable>
          )}
        />
      )}
    </SafeAreaView>
  );
}

function statusLabel(status: Game['status']) {
  if (status === 'setup') return 'Setup';
  if (status === 'active') return 'Active';
  return 'Done';
}

function badgeStyle(status: Game['status']) {
  if (status === 'setup') return { backgroundColor: colors.surfaceAlt };
  if (status === 'active') return { backgroundColor: colors.primaryDark };
  return { backgroundColor: colors.border };
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, paddingHorizontal: 20 },
  header: { marginTop: 12, marginBottom: 20 },
  title: { fontSize: 30, fontWeight: '800', color: colors.text },
  subtitle: { fontSize: 15, color: colors.textMuted, marginTop: 2 },
  hostButton: {
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 24,
  },
  hostButtonText: { color: '#062117', fontSize: 17, fontWeight: '700' },
  sectionLabel: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  list: { paddingBottom: 24 },
  emptyState: { paddingVertical: 40, alignItems: 'center' },
  emptyText: { color: colors.textMuted, fontSize: 14 },
  gameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  gameName: { color: colors.text, fontSize: 16, fontWeight: '700' },
  gameMeta: { color: colors.textMuted, fontSize: 13, marginTop: 4 },
  badge: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20 },
  badgeText: { color: colors.text, fontSize: 12, fontWeight: '700' },
});

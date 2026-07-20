import React, { useCallback, useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/types';
import { Game, Player } from '../types/game';
import { getGame, saveGame } from '../storage/gameStorage';
import { isEliminated } from '../utils/scoring';
import { colors } from '../theme/colors';

type Props = NativeStackScreenProps<RootStackParamList, 'GameBoard'>;

export default function GameBoardScreen({ navigation, route }: Props) {
  const { gameId } = route.params;
  const [game, setGame] = useState<Game | null>(null);

  useFocusEffect(
    useCallback(() => {
      let mounted = true;
      getGame(gameId).then((loaded) => {
        if (mounted) setGame(loaded);
      });
      return () => {
        mounted = false;
      };
    }, [gameId])
  );

  if (!game) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.helper}>Loading…</Text>
      </SafeAreaView>
    );
  }

  const standings = [...game.players].sort((a, b) => {
    if (game.mode === 'points' && a.active !== b.active) return a.active ? -1 : 1;
    return game.mode === 'cash' ? b.totalScore - a.totalScore : a.totalScore - b.totalScore;
  });

  const endCashGame = () => {
    Alert.alert('End game and settle up?', 'This locks in the current totals.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'End & Settle',
        onPress: async () => {
          const updated: Game = { ...game, status: 'completed', completedAt: Date.now() };
          await saveGame(updated);
          navigation.replace('Summary', { gameId: game.id });
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>{game.name}</Text>
            <Text style={styles.subtitle}>
              {game.mode === 'cash'
                ? `Cash Game · $${game.dollarPerPoint}/point`
                : `Points Game · max ${game.maxPoints}`}
            </Text>
          </View>
          {game.status !== 'completed' && (
            <Pressable
              style={styles.playersButton}
              onPress={() => navigation.navigate('Players', { gameId: game.id })}
            >
              <Text style={styles.playersButtonText}>Players ({game.players.length})</Text>
            </Pressable>
          )}
        </View>
      </View>

      {game.status === 'completed' && (
        <Pressable
          style={styles.completeBanner}
          onPress={() => navigation.replace('Summary', { gameId: game.id })}
        >
          <Text style={styles.completeBannerText}>Game complete — view final results →</Text>
        </Pressable>
      )}

      <Text style={styles.sectionLabel}>Standings</Text>
      <FlatList
        data={standings}
        keyExtractor={(item) => item.id}
        style={{ maxHeight: '38%' }}
        contentContainerStyle={{ paddingBottom: 12 }}
        renderItem={({ item, index }) => <StandingRow player={item} rank={index + 1} game={game} />}
      />

      <Text style={styles.sectionLabel}>Rounds ({game.rounds.length})</Text>
      <FlatList
        data={[...game.rounds].reverse()}
        keyExtractor={(item) => item.id}
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 100 }}
        ListEmptyComponent={<Text style={styles.helper}>No rounds recorded yet.</Text>}
        renderItem={({ item }) => {
          const winner = item.entries.find((e) => e.isWinner);
          const winnerPlayer = game.players.find((p) => p.id === winner?.playerId);
          return (
            <View style={styles.roundCard}>
              <Text style={styles.roundTitle}>
                Round {item.roundNumber} · {winnerPlayer?.name ?? 'Unknown'} won
              </Text>
              <View style={styles.roundEntries}>
                {item.entries.map((entry) => {
                  const player = game.players.find((p) => p.id === entry.playerId);
                  return (
                    <Text key={entry.playerId} style={styles.roundEntryText}>
                      {player?.name ?? '—'}:{' '}
                      <Text style={{ color: entry.points >= 0 ? colors.primary : colors.danger }}>
                        {entry.points >= 0 ? '+' : ''}
                        {entry.points}
                      </Text>
                    </Text>
                  );
                })}
              </View>
            </View>
          );
        }}
      />

      {game.status !== 'completed' && (
        <View style={styles.footer}>
          <Pressable
            style={styles.addRoundButton}
            onPress={() => navigation.navigate('AddRound', { gameId: game.id })}
          >
            <Text style={styles.addRoundButtonText}>+ Add Round</Text>
          </Pressable>
          {game.mode === 'cash' && (
            <Pressable style={styles.endButton} onPress={endCashGame}>
              <Text style={styles.endButtonText}>End Game</Text>
            </Pressable>
          )}
        </View>
      )}
    </SafeAreaView>
  );
}

function StandingRow({ player, rank, game }: { player: Player; rank: number; game: Game }) {
  const statusLabel = !player.active
    ? isEliminated(game, player)
      ? '  · eliminated'
      : '  · left'
    : '';
  return (
    <View style={[styles.standingRow, !player.active && styles.standingRowEliminated]}>
      <Text style={styles.standingRank}>{rank}</Text>
      <Text style={[styles.standingName, !player.active && styles.eliminatedText]}>
        {player.name}
        {statusLabel}
      </Text>
      <Text
        style={[
          styles.standingScore,
          { color: player.totalScore >= 0 ? colors.primary : colors.danger },
        ]}
      >
        {player.totalScore >= 0 ? '+' : ''}
        {player.totalScore}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, paddingHorizontal: 20 },
  header: { marginTop: 12, marginBottom: 12 },
  title: { fontSize: 22, fontWeight: '800', color: colors.text },
  subtitle: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
  headerRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  playersButton: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  playersButtonText: { color: colors.text, fontSize: 12, fontWeight: '700' },
  completeBanner: {
    backgroundColor: colors.primaryDark,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  completeBannerText: { color: '#062117', fontWeight: '700', textAlign: 'center' },
  sectionLabel: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 8,
    marginBottom: 8,
  },
  helper: { color: colors.textMuted, fontSize: 14, textAlign: 'center', marginTop: 12 },
  standingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 10,
  },
  standingRowEliminated: { opacity: 0.5 },
  standingRank: { color: colors.textMuted, fontWeight: '700', width: 20 },
  standingName: { flex: 1, color: colors.text, fontSize: 15, fontWeight: '600' },
  eliminatedText: { textDecorationLine: 'line-through' },
  standingScore: { fontSize: 15, fontWeight: '800' },
  roundCard: {
    backgroundColor: colors.surface,
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  roundTitle: { color: colors.gold, fontWeight: '700', marginBottom: 6, fontSize: 13 },
  roundEntries: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  roundEntryText: { color: colors.textMuted, fontSize: 13 },
  footer: {
    position: 'absolute',
    left: 20,
    right: 20,
    bottom: 20,
    flexDirection: 'row',
    gap: 10,
  },
  addRoundButton: {
    flex: 1,
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  addRoundButtonText: { color: '#062117', fontSize: 16, fontWeight: '700' },
  endButton: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 18,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  endButtonText: { color: colors.text, fontSize: 15, fontWeight: '700' },
});

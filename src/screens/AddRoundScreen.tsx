import React, { useEffect, useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { Game } from '../types/game';
import { getGame, saveGame } from '../storage/gameStorage';
import { applyRound } from '../utils/scoring';
import { notifyAction } from '../utils/dialog';
import { colors } from '../theme/colors';

type Props = NativeStackScreenProps<RootStackParamList, 'AddRound'>;

export default function AddRoundScreen({ navigation, route }: Props) {
  const { gameId } = route.params;
  const [game, setGame] = useState<Game | null>(null);
  const [winnerId, setWinnerId] = useState<string | null>(null);
  const [losses, setLosses] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getGame(gameId).then(setGame);
  }, [gameId]);

  const activePlayers = useMemo(
    () => (game ? game.players.filter((p) => p.active) : []),
    [game]
  );

  if (!game) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.helper}>Loading…</Text>
      </SafeAreaView>
    );
  }

  const winnerTotal = winnerId
    ? Object.entries(losses)
        .filter(([playerId]) => playerId !== winnerId)
        .reduce((sum, [, value]) => sum + (Number(value) || 0), 0)
    : 0;

  const onSave = async () => {
    setError(null);
    if (!winnerId) {
      setError('Select who won this round.');
      return;
    }
    const lossMap: Record<string, number> = {};
    for (const player of activePlayers) {
      if (player.id === winnerId) continue;
      const raw = losses[player.id];
      const value = Number(raw);
      if (raw == null || raw === '' || !Number.isFinite(value) || value < 0) {
        setError(`Enter valid points for ${player.name}.`);
        return;
      }
      lossMap[player.id] = value;
    }

    const updated = applyRound(game, { winnerId, losses: lossMap });
    await saveGame(updated);

    if (updated.status === 'completed') {
      await notifyAction('Game complete', 'Only one player remains. Showing final results.');
      navigation.replace('Summary', { gameId: game.id });
      return;
    }
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scroll}>
          <Text style={styles.title}>Round {game.rounds.length + 1}</Text>
          <Text style={styles.subtitle}>
            {game.mode === 'cash'
              ? 'Pick the winner, then enter how many points each other player lost.'
              : 'Pick the winner (scores 0), then enter each other player’s hand points.'}
          </Text>

          {activePlayers.map((player) => {
            const isWinner = player.id === winnerId;
            return (
              <View key={player.id} style={styles.playerCard}>
                <Pressable
                  style={styles.winnerRow}
                  onPress={() => setWinnerId(player.id)}
                >
                  <View style={[styles.radio, isWinner && styles.radioActive]}>
                    {isWinner && <View style={styles.radioDot} />}
                  </View>
                  <Text style={styles.playerName}>{player.name}</Text>
                  {isWinner && <Text style={styles.winnerTag}>WINNER</Text>}
                </Pressable>

                {isWinner ? (
                  <Text style={styles.winnerPreview}>
                    {game.mode === 'cash'
                      ? `Gets +${winnerTotal} (sum of others' losses)`
                      : 'Gets +0 points'}
                  </Text>
                ) : (
                  <TextInput
                    style={styles.input}
                    keyboardType="number-pad"
                    placeholder="Points"
                    placeholderTextColor={colors.textMuted}
                    value={losses[player.id] ?? ''}
                    onChangeText={(text) =>
                      setLosses((prev) => ({ ...prev, [player.id]: text }))
                    }
                  />
                )}
              </View>
            );
          })}

          {error && <Text style={styles.error}>{error}</Text>}

          <Pressable style={styles.saveButton} onPress={onSave}>
            <Text style={styles.saveButtonText}>Save Round</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: 20, paddingBottom: 48 },
  title: { fontSize: 22, fontWeight: '800', color: colors.text },
  subtitle: { fontSize: 13, color: colors.textMuted, marginTop: 4, marginBottom: 16 },
  helper: { color: colors.textMuted, fontSize: 14, padding: 20 },
  playerCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    marginBottom: 10,
  },
  winnerRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: colors.textMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioActive: { borderColor: colors.primary },
  radioDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: colors.primary },
  playerName: { flex: 1, color: colors.text, fontSize: 16, fontWeight: '600' },
  winnerTag: { color: colors.gold, fontSize: 11, fontWeight: '800', letterSpacing: 0.5 },
  winnerPreview: { color: colors.primary, fontSize: 13, marginTop: 8, fontWeight: '600' },
  input: {
    marginTop: 10,
    backgroundColor: colors.surfaceAlt,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.text,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 16,
  },
  error: { color: colors.danger, marginTop: 4, marginBottom: 12, fontSize: 13 },
  saveButton: {
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  saveButtonText: { color: '#062117', fontSize: 16, fontWeight: '700' },
});

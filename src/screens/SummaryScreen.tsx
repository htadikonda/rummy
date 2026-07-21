import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { Game } from '../types/game';
import { getGame, saveGame } from '../storage/gameStorage';
import {
  computeCashSettlement,
  computePointsPayout,
  computeSettlementPayments,
  createRematch,
  isEliminated,
  pointsStandings,
} from '../utils/scoring';
import { colors } from '../theme/colors';

type Props = NativeStackScreenProps<RootStackParamList, 'Summary'>;

export default function SummaryScreen({ navigation, route }: Props) {
  const { gameId } = route.params;
  const [game, setGame] = useState<Game | null>(null);
  const [rateInput, setRateInput] = useState('');

  useEffect(() => {
    getGame(gameId).then((loaded) => {
      setGame(loaded);
      if (loaded?.dollarPerPoint != null) setRateInput(String(loaded.dollarPerPoint));
    });
  }, [gameId]);

  if (!game) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.helper}>Loading…</Text>
      </SafeAreaView>
    );
  }

  const updateRate = async (text: string) => {
    setRateInput(text);
    const value = Number(text);
    if (!Number.isFinite(value)) return;
    const updated = { ...game, dollarPerPoint: value };
    setGame(updated);
    await saveGame(updated);
  };

  const playAgain = async () => {
    const rematch = createRematch(game);
    await saveGame(rematch);
    navigation.replace('GameBoard', { gameId: rematch.id });
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <Text style={styles.title}>{game.name}</Text>
          <Text style={styles.subtitle}>Final Results · {game.rounds.length} rounds played</Text>
        </View>

        {game.mode === 'cash' ? (
          <CashSummary game={game} rateInput={rateInput} onRateChange={updateRate} />
        ) : (
          <PointsSummary game={game} />
        )}

        <View style={styles.footerButtons}>
          <Pressable style={styles.playAgainButton} onPress={playAgain}>
            <Text style={styles.playAgainButtonText}>Play Again · Same Players</Text>
          </Pressable>
          <Pressable style={styles.homeButton} onPress={() => navigation.popToTop()}>
            <Text style={styles.homeButtonText}>Back to Home</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function CashSummary({
  game,
  rateInput,
  onRateChange,
}: {
  game: Game;
  rateInput: string;
  onRateChange: (text: string) => void;
}) {
  const lines = computeCashSettlement(game);
  const payments = computeSettlementPayments(lines);

  return (
    <>
      <Text style={styles.label}>$ per point</Text>
      <TextInput
        style={styles.rateInput}
        keyboardType="decimal-pad"
        value={rateInput}
        onChangeText={onRateChange}
      />

      <Text style={styles.sectionLabel}>Player Totals</Text>
      {lines.map((item) => (
        <View key={item.playerId} style={styles.row}>
          <Text style={styles.rowName}>{item.playerName}</Text>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.rowPoints}>{item.totalScore} pts</Text>
            <Text
              style={[
                styles.rowAmount,
                { color: item.amount >= 0 ? colors.primary : colors.danger },
              ]}
            >
              {item.amount >= 0 ? '+' : '-'}${Math.abs(item.amount).toFixed(2)}
            </Text>
          </View>
        </View>
      ))}

      <Text style={styles.sectionLabel}>Settle Up</Text>
      {payments.length === 0 ? (
        <Text style={styles.helper}>Nothing to settle.</Text>
      ) : (
        payments.map((item, index) => (
          <View key={`${item.fromPlayerId}-${item.toPlayerId}-${index}`} style={styles.paymentRow}>
            <Text style={styles.paymentText}>
              <Text style={{ color: colors.danger, fontWeight: '700' }}>
                {item.fromPlayerName}
              </Text>{' '}
              pays{' '}
              <Text style={{ color: colors.primary, fontWeight: '700' }}>
                {item.toPlayerName}
              </Text>
            </Text>
            <Text style={styles.paymentAmount}>${item.amount.toFixed(2)}</Text>
          </View>
        ))
      )}
    </>
  );
}

function PointsSummary({ game }: { game: Game }) {
  const standings = pointsStandings(game);
  const winner = standings.find((p) => p.active) ?? standings[0];
  const hasBuyIn = game.buyIn != null && game.buyIn > 0;
  const totalBuyIns = game.players.reduce((sum, p) => sum + p.buyIns, 0);
  const totalPot = hasBuyIn ? totalBuyIns * (game.buyIn as number) : 0;
  const payoutByPlayerId = new Map(computePointsPayout(game).map((p) => [p.playerId, p]));

  return (
    <>
      {winner && (
        <View style={styles.winnerBanner}>
          <Text style={styles.winnerBannerLabel}>🏆 Winner</Text>
          <Text style={styles.winnerBannerName}>{winner.name}</Text>
        </View>
      )}
      <Text style={styles.sectionLabel}>Final Standings</Text>
      {standings.map((item, index) => (
        <View key={item.id} style={[styles.row, !item.active && { opacity: 0.5 }]}>
          <Text style={styles.rowName}>
            {index + 1}. {item.name}
            {!item.active ? (isEliminated(game, item) ? '  · eliminated' : '  · left') : ''}
          </Text>
          <Text style={styles.rowPoints}>{item.totalScore} pts</Text>
        </View>
      ))}

      {hasBuyIn && (
        <>
          <Text style={styles.sectionLabel}>Payments</Text>
          <Text style={styles.helper}>
            Total pot: ${totalPot.toFixed(2)} ({totalBuyIns} buy-in{totalBuyIns === 1 ? '' : 's'}{' '}
            × ${game.buyIn}), split among remaining players by drops left before Game For.
          </Text>
          {standings.map((item) => {
            const payout = payoutByPlayerId.get(item.id);
            if (!payout) return null;
            return (
              <View key={item.id} style={styles.row}>
                <View>
                  <Text style={styles.rowName}>{item.name}</Text>
                  <Text style={styles.rowPoints}>
                    {item.active
                      ? `${payout.dropsRemaining} drop${payout.dropsRemaining === 1 ? '' : 's'} remaining`
                      : isEliminated(game, item)
                        ? 'Eliminated'
                        : 'Left'}
                  </Text>
                </View>
                <Text
                  style={[
                    styles.rowAmount,
                    { color: payout.net >= 0 ? colors.primary : colors.danger },
                  ]}
                >
                  {payout.net >= 0 ? '+' : '-'}${Math.abs(payout.net).toFixed(2)}
                </Text>
              </View>
            );
          })}
        </>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { paddingHorizontal: 20, paddingBottom: 24 },
  header: { marginTop: 12, marginBottom: 16 },
  title: { fontSize: 24, fontWeight: '800', color: colors.text },
  subtitle: { fontSize: 13, color: colors.textMuted, marginTop: 4 },
  label: { color: colors.text, fontSize: 14, fontWeight: '600', marginBottom: 6 },
  rateInput: {
    backgroundColor: colors.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.text,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 16,
    marginBottom: 16,
    width: 120,
  },
  sectionLabel: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 8,
    marginBottom: 8,
  },
  helper: { color: colors.textMuted, fontSize: 14 },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
    marginBottom: 6,
  },
  rowName: { color: colors.text, fontSize: 15, fontWeight: '600' },
  rowPoints: { color: colors.textMuted, fontSize: 12 },
  rowAmount: { fontSize: 15, fontWeight: '800', marginTop: 2 },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surfaceAlt,
    borderRadius: 10,
    padding: 12,
    marginBottom: 6,
  },
  paymentText: { color: colors.text, fontSize: 14 },
  paymentAmount: { color: colors.gold, fontSize: 15, fontWeight: '800' },
  winnerBanner: {
    backgroundColor: colors.primary,
    borderRadius: 14,
    padding: 18,
    alignItems: 'center',
    marginBottom: 16,
  },
  winnerBannerLabel: { fontSize: 14, fontWeight: '700', color: '#062117' },
  winnerBannerName: { fontSize: 22, fontWeight: '800', color: '#062117', marginTop: 4 },
  footerButtons: { marginTop: 16, gap: 10 },
  playAgainButton: {
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  playAgainButtonText: { color: '#062117', fontSize: 16, fontWeight: '700' },
  homeButton: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  homeButtonText: { color: colors.text, fontSize: 15, fontWeight: '700' },
});

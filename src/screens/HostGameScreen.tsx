import React, { useState } from 'react';
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
import { Game, GameMode } from '../types/game';
import { saveGame } from '../storage/gameStorage';
import { generateId } from '../utils/id';
import { colors } from '../theme/colors';

type Props = NativeStackScreenProps<RootStackParamList, 'HostGame'>;

export default function HostGameScreen({ navigation }: Props) {
  const [name, setName] = useState('');
  const [mode, setMode] = useState<GameMode>('points');
  const [maxPoints, setMaxPoints] = useState('201');
  const [dollarPerPoint, setDollarPerPoint] = useState('1');
  const [error, setError] = useState<string | null>(null);

  const onContinue = async () => {
    setError(null);

    if (mode === 'points') {
      const parsed = Number(maxPoints);
      if (!Number.isFinite(parsed) || parsed <= 0) {
        setError('Enter a valid max points value.');
        return;
      }
    } else {
      const parsed = Number(dollarPerPoint);
      if (!Number.isFinite(parsed) || parsed <= 0) {
        setError('Enter a valid $ per point value.');
        return;
      }
    }

    const game: Game = {
      id: generateId(),
      name: name.trim() || defaultGameName(mode),
      mode,
      maxPoints: mode === 'points' ? Number(maxPoints) : undefined,
      dollarPerPoint: mode === 'cash' ? Number(dollarPerPoint) : undefined,
      players: [],
      rounds: [],
      status: 'setup',
      createdAt: Date.now(),
    };

    await saveGame(game);
    navigation.navigate('Players', { gameId: game.id });
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scroll}>
          <Text style={styles.title}>Host a Game</Text>

          <Text style={styles.label}>Game name (optional)</Text>
          <TextInput
            style={styles.input}
            placeholder="Friday Night Rummy"
            placeholderTextColor={colors.textMuted}
            value={name}
            onChangeText={setName}
          />

          <Text style={styles.label}>Game type</Text>
          <View style={styles.segment}>
            <Pressable
              style={[styles.segmentOption, mode === 'points' && styles.segmentOptionActive]}
              onPress={() => setMode('points')}
            >
              <Text
                style={[styles.segmentText, mode === 'points' && styles.segmentTextActive]}
              >
                Points Game
              </Text>
            </Pressable>
            <Pressable
              style={[styles.segmentOption, mode === 'cash' && styles.segmentOptionActive]}
              onPress={() => setMode('cash')}
            >
              <Text style={[styles.segmentText, mode === 'cash' && styles.segmentTextActive]}>
                Cash Game
              </Text>
            </Pressable>
          </View>

          {mode === 'points' ? (
            <View>
              <Text style={styles.label}>Max points</Text>
              <Text style={styles.helper}>
                Players are eliminated once their total reaches this value.
              </Text>
              <TextInput
                style={styles.input}
                keyboardType="number-pad"
                value={maxPoints}
                onChangeText={setMaxPoints}
                placeholder="201"
                placeholderTextColor={colors.textMuted}
              />
            </View>
          ) : (
            <View>
              <Text style={styles.label}>$ per point</Text>
              <Text style={styles.helper}>
                Used to convert final points into a cash settlement.
              </Text>
              <TextInput
                style={styles.input}
                keyboardType="decimal-pad"
                value={dollarPerPoint}
                onChangeText={setDollarPerPoint}
                placeholder="1"
                placeholderTextColor={colors.textMuted}
              />
            </View>
          )}

          {error && <Text style={styles.error}>{error}</Text>}

          <Pressable style={styles.continueButton} onPress={onContinue}>
            <Text style={styles.continueButtonText}>Continue → Add Players</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function defaultGameName(mode: GameMode) {
  const date = new Date().toLocaleDateString();
  return `${mode === 'cash' ? 'Cash' : 'Points'} Game · ${date}`;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: 20, paddingBottom: 40 },
  title: { fontSize: 26, fontWeight: '800', color: colors.text, marginBottom: 20 },
  label: { color: colors.text, fontSize: 15, fontWeight: '600', marginBottom: 8 },
  helper: { color: colors.textMuted, fontSize: 12, marginBottom: 8, marginTop: -4 },
  input: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.text,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 20,
  },
  segment: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  segmentOption: { flex: 1, paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  segmentOptionActive: { backgroundColor: colors.primary },
  segmentText: { color: colors.textMuted, fontWeight: '700' },
  segmentTextActive: { color: '#062117' },
  error: { color: colors.danger, marginBottom: 12, fontSize: 13 },
  continueButton: {
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  continueButtonText: { color: '#062117', fontSize: 16, fontWeight: '700' },
});

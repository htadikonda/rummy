import 'react-native-gesture-handler';
import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { RootStackParamList } from './src/navigation/types';
import HomeScreen from './src/screens/HomeScreen';
import HostGameScreen from './src/screens/HostGameScreen';
import PlayersScreen from './src/screens/PlayersScreen';
import GameBoardScreen from './src/screens/GameBoardScreen';
import AddRoundScreen from './src/screens/AddRoundScreen';
import SummaryScreen from './src/screens/SummaryScreen';
import { colors } from './src/theme/colors';

const Stack = createNativeStackNavigator<RootStackParamList>();

const navTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: colors.background,
    card: colors.surface,
    border: colors.border,
    primary: colors.primary,
    text: colors.text,
  },
};

export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer theme={navTheme}>
        <StatusBar style="light" />
        <Stack.Navigator
          screenOptions={{
            headerStyle: { backgroundColor: colors.surface },
            headerTintColor: colors.text,
            headerShadowVisible: false,
            contentStyle: { backgroundColor: colors.background },
          }}
        >
          <Stack.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />
          <Stack.Screen
            name="HostGame"
            component={HostGameScreen}
            options={{ title: 'Host Game' }}
          />
          <Stack.Screen name="Players" component={PlayersScreen} options={{ title: 'Players' }} />
          <Stack.Screen
            name="GameBoard"
            component={GameBoardScreen}
            options={{ title: 'Game', headerBackVisible: false }}
          />
          <Stack.Screen name="AddRound" component={AddRoundScreen} options={{ title: 'Add Round' }} />
          <Stack.Screen
            name="Summary"
            component={SummaryScreen}
            options={{ title: 'Results', headerBackVisible: false }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

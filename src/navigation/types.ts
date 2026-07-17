export type RootStackParamList = {
  Home: undefined;
  HostGame: undefined;
  Players: { gameId: string };
  GameBoard: { gameId: string };
  AddRound: { gameId: string };
  Summary: { gameId: string };
};

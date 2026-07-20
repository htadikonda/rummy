import { Alert, Platform } from 'react-native';

export function confirmAction(options: {
  title: string;
  message?: string;
  confirmLabel: string;
}): Promise<boolean> {
  const { title, message, confirmLabel } = options;
  if (Platform.OS === 'web') {
    return Promise.resolve(window.confirm([title, message].filter(Boolean).join('\n\n')));
  }
  return new Promise((resolve) => {
    Alert.alert(title, message, [
      { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
      { text: confirmLabel, style: 'destructive', onPress: () => resolve(true) },
    ]);
  });
}

export function notifyAction(title: string, message?: string): Promise<void> {
  if (Platform.OS === 'web') {
    window.alert([title, message].filter(Boolean).join('\n\n'));
    return Promise.resolve();
  }
  return new Promise((resolve) => {
    Alert.alert(title, message, [{ text: 'OK', onPress: () => resolve() }]);
  });
}

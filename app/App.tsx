import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer, DarkTheme } from '@react-navigation/native';
import { SettingsProvider } from './src/context/SettingsContext';
import { FirebaseProvider } from './src/context/FirebaseContext';
import { RoleProvider } from './src/context/RoleContext';
import { MedicationProvider } from './src/context/MedicationContext';
import { SOSProvider } from './src/context/SOSContext';
import { RootNavigator } from './src/navigation/RootNavigator';

const PulseTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: '#030712',
    card: '#0B132B',
    text: '#F8FAFC',
    border: '#1E293B',
    primary: '#0D9488',
  },
};

export default function App() {
  return (
    <SafeAreaProvider>
      <SettingsProvider>
        <FirebaseProvider>
          <RoleProvider>
            <MedicationProvider>
              <SOSProvider>
                <NavigationContainer theme={PulseTheme}>
                  <StatusBar style="light" />
                  <RootNavigator />
                </NavigationContainer>
              </SOSProvider>
            </MedicationProvider>
          </RoleProvider>
        </FirebaseProvider>
      </SettingsProvider>
    </SafeAreaProvider>
  );
}

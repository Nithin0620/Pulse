import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useFirebase } from '../context/FirebaseContext';
import { useRole } from '../context/RoleContext';
import { LoginScreen } from '../screens/LoginScreen';
import { OnboardingScreen } from '../screens/OnboardingScreen';
import { BottomTabNavigator } from './BottomTabNavigator';
import { AppointmentsScreen } from '../screens/AppointmentsScreen';
import { NearbyCareScreen } from '../screens/NearbyCareScreen';
import { CaregiverLinkScreen } from '../screens/CaregiverLinkScreen';
import { AdherenceReportScreen } from '../screens/AdherenceReportScreen';
import { ProfileScreen } from '../screens/ProfileScreen';

const Stack = createNativeStackNavigator();

export const RootNavigator: React.FC = () => {
  const { user, loading: authLoading } = useFirebase();
  const { profile, profileLoading } = useRole();

  if (authLoading || (user && profileLoading)) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0D9488" />
      </View>
    );
  }

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: '#0B132B' },
        headerTintColor: '#F8FAFC',
        headerTitleStyle: { fontWeight: '700' },
        contentStyle: { backgroundColor: '#030712' },
      }}
    >
      {!user ? (
        <Stack.Screen
          name="Login"
          component={LoginScreen}
          options={{ headerShown: false }}
        />
      ) : profile && !profile.role && !profile.onboardingCompleted ? (
        <Stack.Screen
          name="Onboarding"
          component={OnboardingScreen}
          options={{ headerShown: false }}
        />
      ) : (
        <>
          <Stack.Screen
            name="Main"
            component={BottomTabNavigator}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Appointments"
            component={AppointmentsScreen}
            options={{ title: 'Doctor Appointments' }}
          />
          <Stack.Screen
            name="NearbyCare"
            component={NearbyCareScreen}
            options={{ title: 'Nearby Hospitals & Care' }}
          />
          <Stack.Screen
            name="CaregiverLink"
            component={CaregiverLinkScreen}
            options={{ title: 'Caregiver Link Hub' }}
          />
          <Stack.Screen
            name="AdherenceReport"
            component={AdherenceReportScreen}
            options={{ title: 'Adherence & Reports' }}
          />
          <Stack.Screen
            name="Profile"
            component={ProfileScreen}
            options={{ title: 'Profile & Settings' }}
          />
        </>
      )}
    </Stack.Navigator>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: '#030712',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

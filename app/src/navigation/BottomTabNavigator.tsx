import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { DashboardScreen } from '../screens/DashboardScreen';
import { MedicinesScreen } from '../screens/MedicinesScreen';
import { VitalsScreen } from '../screens/VitalsScreen';
import { DocumentsScreen } from '../screens/DocumentsScreen';
import { AssistantScreen } from '../screens/AssistantScreen';
import { Header } from '../components/Header';
import { SOSAlertBanner } from '../components/SOSAlertBanner';
import { useSettings } from '../context/SettingsContext';
import { View, StyleSheet } from 'react-native';

const Tab = createBottomTabNavigator();

export const BottomTabNavigator: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { t, language } = useSettings();

  return (
    <View style={styles.container}>
      {/* Real-time SOS alert banner for caregiver */}
      <SOSAlertBanner />

      <Tab.Navigator
        screenOptions={({ route }) => ({
          header: () => <Header onProfilePress={() => navigation.navigate('Profile')} />,
          tabBarStyle: {
            backgroundColor: '#0B132B',
            borderTopColor: '#1E293B',
            borderTopWidth: 1,
            height: 60,
            paddingBottom: 8,
            paddingTop: 6,
          },
          tabBarActiveTintColor: '#0D9488',
          tabBarInactiveTintColor: '#94A3B8',
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: '600',
          },
          tabBarIcon: ({ focused, color, size }) => {
            let iconName: any = 'home';
            if (route.name === 'HomeTab') {
              iconName = focused ? 'grid' : 'grid-outline';
            } else if (route.name === 'MedicinesTab') {
              iconName = focused ? 'medkit' : 'medkit-outline';
            } else if (route.name === 'VitalsTab') {
              iconName = focused ? 'pulse' : 'pulse-outline';
            } else if (route.name === 'DocumentsTab') {
              iconName = focused ? 'document-text' : 'document-text-outline';
            } else if (route.name === 'AssistantTab') {
              iconName = focused ? 'chatbubble-ellipses' : 'chatbubble-ellipses-outline';
            }
            return <Ionicons name={iconName} size={22} color={color} />;
          },
        })}
      >
        <Tab.Screen
          name="HomeTab"
          component={DashboardScreen}
          options={{ title: language === 'hi' ? 'डैशबोर्ड' : 'Dashboard' }}
        />
        <Tab.Screen
          name="MedicinesTab"
          component={MedicinesScreen}
          options={{ title: language === 'hi' ? 'दवाइयाँ' : 'Medicines' }}
        />
        <Tab.Screen
          name="VitalsTab"
          component={VitalsScreen}
          options={{ title: language === 'hi' ? 'वाइटल्स' : 'Vitals' }}
        />
        <Tab.Screen
          name="DocumentsTab"
          component={DocumentsScreen}
          options={{ title: language === 'hi' ? 'पर्चे' : 'Prescriptions' }}
        />
        <Tab.Screen
          name="AssistantTab"
          component={AssistantScreen}
          options={{ title: language === 'hi' ? 'सहायक' : 'AI Assistant' }}
        />
      </Tab.Navigator>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#030712',
  },
});

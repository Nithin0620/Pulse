import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSettings, LANGUAGES } from '../context/SettingsContext';
import { useRole } from '../context/RoleContext';
import { useFirebase } from '../context/FirebaseContext';
import { useSOS } from '../context/SOSContext';
import { PatientSwitcherModal } from './PatientSwitcherModal';
import { AccessibilityModal } from './AccessibilityModal';

interface HeaderProps {
  onProfilePress?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onProfilePress }) => {
  const { t, language } = useSettings();
  const { role, activePatientName } = useRole();
  const { user } = useFirebase();
  const { unacknowledgedCount } = useSOS();

  const [isSwitcherVisible, setSwitcherVisible] = useState(false);
  const [isSettingsVisible, setSettingsVisible] = useState(false);

  return (
    <View style={styles.container}>
      <View style={styles.leftRow}>
        <View style={styles.logoBadge}>
          <Text style={styles.logoIcon}>⚡</Text>
        </View>
        <Text style={styles.brandTitle}>PULSE</Text>

        {role === 'caregiver' && (
          <TouchableOpacity
            style={styles.caregiverBadge}
            onPress={() => setSwitcherVisible(true)}
            activeOpacity={0.7}
          >
            <Ionicons name="people-outline" size={14} color="#10B981" />
            <Text style={styles.caregiverText} numberOfLines={1}>
              {activePatientName || 'Patient'}
            </Text>
            <Ionicons name="chevron-down" size={12} color="#10B981" />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.rightRow}>
        {/* Unacknowledged SOS Alert Ping for Caregivers */}
        {role === 'caregiver' && unacknowledgedCount > 0 && (
          <View style={styles.sosAlertDot}>
            <Text style={styles.sosAlertDotText}>{unacknowledgedCount}</Text>
          </View>
        )}

        {/* Language quick switcher */}
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => setSettingsVisible(true)}
          accessibilityLabel="Change Language & Settings"
        >
          <Ionicons name="globe-outline" size={18} color="#94A3B8" />
          <Text style={styles.langCodeText}>{language.toUpperCase()}</Text>
        </TouchableOpacity>

        {/* Profile Avatar */}
        <TouchableOpacity
          style={styles.avatarBtn}
          onPress={onProfilePress}
          accessibilityLabel="Open Profile"
        >
          <Text style={styles.avatarText}>
            {(user?.displayName || user?.email || 'U').charAt(0).toUpperCase()}
          </Text>
        </TouchableOpacity>
      </View>

      <PatientSwitcherModal
        visible={isSwitcherVisible}
        onClose={() => setSwitcherVisible(false)}
      />

      <AccessibilityModal
        visible={isSettingsVisible}
        onClose={() => setSettingsVisible(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 56,
    backgroundColor: '#0B132B',
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  leftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  logoBadge: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: 'rgba(13, 148, 136, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoIcon: {
    fontSize: 14,
  },
  brandTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0D9488',
    letterSpacing: 1,
  },
  caregiverBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    borderRadius: 16,
    paddingHorizontal: 8,
    paddingVertical: 4,
    maxWidth: 120,
    marginLeft: 4,
  },
  caregiverText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#10B981',
    maxWidth: 70,
  },
  rightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: '#1E293B',
  },
  langCodeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#CBD5E1',
  },
  avatarBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#0D9488',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  sosAlertDot: {
    backgroundColor: '#EF4444',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sosAlertDotText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
});

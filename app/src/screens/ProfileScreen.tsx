import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFirebase } from '../context/FirebaseContext';
import { useRole } from '../context/RoleContext';
import { useSettings } from '../context/SettingsContext';
import { AccessibilityModal } from '../components/AccessibilityModal';

export const ProfileScreen: React.FC = () => {
  const { user, logout } = useFirebase();
  const { role, profile } = useRole();
  const { language, t } = useSettings();
  const [isSettingsOpen, setSettingsOpen] = useState(false);

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to log out of PULSE?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log Out', style: 'destructive', onPress: () => logout() },
    ]);
  };

  const name = profile?.fullName || user?.displayName || user?.email?.split('@')[0] || 'User';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.avatarCard}>
        <View style={styles.bigAvatar}>
          <Text style={styles.bigAvatarText}>
            {name.charAt(0).toUpperCase()}
          </Text>
        </View>
        <Text style={styles.userName}>{name}</Text>
        <Text style={styles.userEmail}>{user?.email}</Text>

        <View style={styles.roleBadge}>
          <Ionicons
            name={role === 'caregiver' ? 'people' : 'person'}
            size={14}
            color="#0D9488"
          />
          <Text style={styles.roleBadgeText}>
            {role === 'caregiver' ? 'Caregiver Account' : 'Patient Account'}
          </Text>
        </View>
      </View>

      {/* Details Section */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Profile Details</Text>

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Role</Text>
          <Text style={styles.detailVal}>{role || 'Patient'}</Text>
        </View>

        {Boolean(profile?.dateOfBirth) && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Date of Birth</Text>
            <Text style={styles.detailVal}>{profile?.dateOfBirth}</Text>
          </View>
        )}

        {Boolean(profile?.bloodGroup) && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Blood Group</Text>
            <Text style={styles.detailVal}>{profile?.bloodGroup}</Text>
          </View>
        )}

        {Boolean(profile?.medicalConditions?.length) && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Conditions</Text>
            <Text style={styles.detailVal}>
              {profile?.medicalConditions?.join(', ')}
            </Text>
          </View>
        )}

        {Boolean(profile?.emergencyContacts?.length) && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Emergency Contact</Text>
            <Text style={styles.detailVal}>
              {profile?.emergencyContacts?.[0]?.name} (
              {profile?.emergencyContacts?.[0]?.phone})
            </Text>
          </View>
        )}
      </View>

      {/* Settings & Accessibility Quick Action */}
      <TouchableOpacity
        style={styles.actionCard}
        onPress={() => setSettingsOpen(true)}
      >
        <View style={styles.actionIconWrap}>
          <Ionicons name="accessibility-outline" size={20} color="#0D9488" />
        </View>
        <View style={styles.actionInfo}>
          <Text style={styles.actionTitle}>Language & Accessibility</Text>
          <Text style={styles.actionSubtitle}>
            Change language (9 available), font size, voice TTS
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color="#64748B" />
      </TouchableOpacity>

      {/* Sign Out Button */}
      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={18} color="#EF4444" />
        <Text style={styles.logoutBtnText}>Sign Out</Text>
      </TouchableOpacity>

      <AccessibilityModal
        visible={isSettingsOpen}
        onClose={() => setSettingsOpen(false)}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#030712',
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  avatarCard: {
    backgroundColor: '#0F172A',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1E293B',
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
  },
  bigAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#0D9488',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  bigAvatarText: {
    fontSize: 26,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  userName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  userEmail: {
    fontSize: 13,
    color: '#94A3B8',
    marginTop: 2,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(13, 148, 136, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(13, 148, 136, 0.3)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
    marginTop: 10,
  },
  roleBadgeText: {
    color: '#0D9488',
    fontSize: 12,
    fontWeight: '700',
  },
  sectionCard: {
    backgroundColor: '#0F172A',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1E293B',
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#94A3B8',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  detailLabel: {
    color: '#94A3B8',
    fontSize: 14,
  },
  detailVal: {
    color: '#F8FAFC',
    fontSize: 14,
    fontWeight: '600',
    maxWidth: '60%',
    textAlign: 'right',
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1E293B',
    padding: 16,
    marginBottom: 16,
  },
  actionIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: 'rgba(13, 148, 136, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  actionInfo: {
    flex: 1,
  },
  actionTitle: {
    color: '#F8FAFC',
    fontSize: 15,
    fontWeight: '600',
  },
  actionSubtitle: {
    color: '#94A3B8',
    fontSize: 12,
    marginTop: 2,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    borderRadius: 14,
    paddingVertical: 14,
  },
  logoutBtnText: {
    color: '#EF4444',
    fontSize: 15,
    fontWeight: '700',
  },
});

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRole } from '../context/RoleContext';
import { useSettings } from '../context/SettingsContext';
import { UserRole, BloodGroup } from '../types';

const BLOOD_GROUPS: BloodGroup[] = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const CONDITIONS = ['Diabetes', 'Hypertension', 'Asthma', 'Heart Condition', 'Arthritis', 'Thyroid'];

interface OnboardingScreenProps {
  onFinish?: () => void;
}

export const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ onFinish }) => {
  const { saveRole, savePersonalDetails } = useRole();
  const { language } = useSettings();

  const [step, setStep] = useState<'role' | 'details'>('role');
  const [selectedRole, setSelectedRole] = useState<UserRole>('patient');
  const [fullName, setFullName] = useState('');
  const [dob, setDob] = useState('1960-01-01');
  const [bloodGroup, setBloodGroup] = useState<BloodGroup>('O+');
  const [selectedConditions, setSelectedConditions] = useState<string[]>([]);
  const [emergencyName, setEmergencyName] = useState('');
  const [emergencyPhone, setEmergencyPhone] = useState('');
  const [saving, setSaving] = useState(false);

  const toggleCondition = (cond: string) => {
    if (selectedConditions.includes(cond)) {
      setSelectedConditions(selectedConditions.filter((c) => c !== cond));
    } else {
      setSelectedConditions([...selectedConditions, cond]);
    }
  };

  const handleRoleContinue = async () => {
    setSaving(true);
    try {
      await saveRole(selectedRole);
      setStep('details');
    } finally {
      setSaving(false);
    }
  };

  const handleFinish = async () => {
    setSaving(true);
    try {
      await savePersonalDetails({
        role: selectedRole,
        fullName: fullName.trim() || (selectedRole === 'patient' ? 'Elderly Patient' : 'Family Caregiver'),
        dateOfBirth: dob,
        bloodGroup: selectedRole === 'patient' ? bloodGroup : undefined,
        medicalConditions: selectedRole === 'patient' ? selectedConditions : undefined,
        emergencyContacts: emergencyName && emergencyPhone ? [
          { name: emergencyName, phone: emergencyPhone, relationship: 'Family' },
        ] : undefined,
        onboardingCompleted: true,
      });
      onFinish?.();
    } catch (e) {
      console.warn('Failed to complete onboarding', e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View style={styles.badgeWrap}>
          <Ionicons name="medical" size={24} color="#0D9488" />
        </View>
        <Text style={styles.title}>
          {step === 'role' ? 'Welcome to PULSE' : 'Personal & Health Profile'}
        </Text>
        <Text style={styles.subtitle}>
          {step === 'role'
            ? 'Tell us how you will be using PULSE today'
            : 'Fill in essential emergency and medical details'}
        </Text>
      </View>

      {step === 'role' ? (
        <View style={styles.roleContainer}>
          {/* Patient Card */}
          <TouchableOpacity
            style={[styles.roleCard, selectedRole === 'patient' && styles.roleCardActive]}
            onPress={() => setSelectedRole('patient')}
            activeOpacity={0.8}
          >
            <View style={styles.roleIconWrap}>
              <Ionicons name="person" size={28} color="#0D9488" />
            </View>
            <View style={styles.roleInfo}>
              <Text style={styles.roleTitle}>I am a Patient</Text>
              <Text style={styles.roleDesc}>
                I want to manage my medicines, log doses, monitor vitals, and access emergency SOS.
              </Text>
            </View>
            {selectedRole === 'patient' && (
              <Ionicons name="checkmark-circle" size={24} color="#0D9488" />
            )}
          </TouchableOpacity>

          {/* Caregiver Card */}
          <TouchableOpacity
            style={[styles.roleCard, selectedRole === 'caregiver' && styles.roleCardActive]}
            onPress={() => setSelectedRole('caregiver')}
            activeOpacity={0.8}
          >
            <View style={[styles.roleIconWrap, { backgroundColor: 'rgba(16, 185, 129, 0.2)' }]}>
              <Ionicons name="people" size={28} color="#10B981" />
            </View>
            <View style={styles.roleInfo}>
              <Text style={styles.roleTitle}>I am a Caregiver</Text>
              <Text style={styles.roleDesc}>
                I care for a parent or family member and want to monitor their adherence & emergency alerts.
              </Text>
            </View>
            {selectedRole === 'caregiver' && (
              <Ionicons name="checkmark-circle" size={24} color="#10B981" />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.continueBtn}
            onPress={handleRoleContinue}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.continueBtnText}>Continue</Text>
            )}
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.formContainer}>
          <Text style={styles.label}>Full Name</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Ramesh Kumar"
            placeholderTextColor="#64748B"
            value={fullName}
            onChangeText={setFullName}
          />

          <Text style={styles.label}>Date of Birth (YYYY-MM-DD)</Text>
          <TextInput
            style={styles.input}
            placeholder="1960-01-01"
            placeholderTextColor="#64748B"
            value={dob}
            onChangeText={setDob}
          />

          {selectedRole === 'patient' && (
            <>
              <Text style={styles.label}>Blood Group</Text>
              <View style={styles.bloodGrid}>
                {BLOOD_GROUPS.map((bg) => (
                  <TouchableOpacity
                    key={bg}
                    style={[styles.bloodChip, bloodGroup === bg && styles.bloodChipActive]}
                    onPress={() => setBloodGroup(bg)}
                  >
                    <Text style={[styles.bloodText, bloodGroup === bg && styles.bloodTextActive]}>
                      {bg}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.label}>Known Conditions</Text>
              <View style={styles.conditionsWrap}>
                {CONDITIONS.map((c) => {
                  const active = selectedConditions.includes(c);
                  return (
                    <TouchableOpacity
                      key={c}
                      style={[styles.condChip, active && styles.condChipActive]}
                      onPress={() => toggleCondition(c)}
                    >
                      <Text style={[styles.condText, active && styles.condTextActive]}>
                        {c}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={styles.label}>Emergency Contact Person</Text>
              <TextInput
                style={styles.input}
                placeholder="Contact Name (e.g. Son / Daughter)"
                placeholderTextColor="#64748B"
                value={emergencyName}
                onChangeText={setEmergencyName}
              />

              <Text style={styles.label}>Emergency Phone Number</Text>
              <TextInput
                style={styles.input}
                placeholder="+91 98765 43210"
                placeholderTextColor="#64748B"
                keyboardType="phone-pad"
                value={emergencyPhone}
                onChangeText={setEmergencyPhone}
              />
            </>
          )}

          <TouchableOpacity
            style={styles.continueBtn}
            onPress={handleFinish}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.continueBtnText}>Complete Setup</Text>
            )}
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#030712',
  },
  content: {
    padding: 24,
    paddingTop: 50,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  badgeWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: 'rgba(13, 148, 136, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#F8FAFC',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 13,
    color: '#94A3B8',
    marginTop: 4,
    textAlign: 'center',
  },
  roleContainer: {
    gap: 16,
  },
  roleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    borderWidth: 1.5,
    borderColor: '#1E293B',
    borderRadius: 16,
    padding: 16,
  },
  roleCardActive: {
    borderColor: '#0D9488',
    backgroundColor: 'rgba(13, 148, 136, 0.08)',
  },
  roleIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: 'rgba(13, 148, 136, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  roleInfo: {
    flex: 1,
  },
  roleTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#F8FAFC',
    marginBottom: 4,
  },
  roleDesc: {
    fontSize: 12,
    color: '#94A3B8',
    lineHeight: 16,
  },
  continueBtn: {
    backgroundColor: '#0D9488',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  continueBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  formContainer: {
    backgroundColor: '#0F172A',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1E293B',
    padding: 18,
  },
  label: {
    color: '#CBD5E1',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
    marginTop: 10,
  },
  input: {
    backgroundColor: '#1E293B',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#334155',
    color: '#FFFFFF',
    paddingHorizontal: 12,
    height: 46,
    fontSize: 14,
  },
  bloodGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  bloodChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#334155',
  },
  bloodChipActive: {
    backgroundColor: '#0D9488',
    borderColor: '#0D9488',
  },
  bloodText: {
    color: '#CBD5E1',
    fontSize: 13,
    fontWeight: '700',
  },
  bloodTextActive: {
    color: '#FFFFFF',
  },
  conditionsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  condChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#334155',
  },
  condChipActive: {
    backgroundColor: 'rgba(13, 148, 136, 0.2)',
    borderColor: '#0D9488',
  },
  condText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '600',
  },
  condTextActive: {
    color: '#2DD4BF',
  },
});

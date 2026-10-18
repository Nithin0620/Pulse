import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  doc,
  updateDoc,
  arrayUnion,
  onSnapshot,
} from 'firebase/firestore';
import { db } from '../firebase';
import { useFirebase } from '../context/FirebaseContext';
import { useRole } from '../context/RoleContext';
import { useSettings } from '../context/SettingsContext';

const generateInviteCode = (): string => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let res = '';
  for (let i = 0; i < 6; i++) {
    res += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return res;
};

export const CaregiverLinkScreen: React.FC = () => {
  const { user } = useFirebase();
  const { role, profile, refreshLinkedPatients } = useRole();
  const { language } = useSettings();

  // Patient state
  const [activeCode, setActiveCode] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [activeCaregivers, setActiveCaregivers] = useState<{ id: string; name: string }[]>([]);

  // Caregiver state
  const [inputCode, setInputCode] = useState('');
  const [linking, setLinking] = useState(false);

  // Subscribe to caregiverLinks
  useEffect(() => {
    if (!user) return;

    if (role === 'patient') {
      const q = query(
        collection(db, 'caregiverLinks'),
        where('patientId', '==', user.uid)
      );
      const unsub = onSnapshot(q, (snapshot) => {
        snapshot.forEach((d) => {
          const data = d.data();
          if (data.status === 'pending') {
            setActiveCode(data.inviteCode);
          }
        });
      });
      return unsub;
    }
  }, [user, role]);

  const handleGenerateCode = async () => {
    if (!user) return;
    setGenerating(true);
    try {
      const code = generateInviteCode();
      await addDoc(collection(db, 'caregiverLinks'), {
        inviteCode: code,
        patientId: user.uid,
        patientName: profile?.fullName || user.displayName || 'Patient',
        caregiverId: null,
        status: 'pending',
        createdAt: new Date().toISOString(),
        expiresAtMs: Date.now() + 24 * 60 * 60 * 1000,
      });
      setActiveCode(code);
      Alert.alert('Code Created', `Your 6-digit invite code is: ${code}`);
    } catch (e) {
      Alert.alert('Error', 'Failed to generate invite code.');
    } finally {
      setGenerating(false);
    }
  };

  const handleLinkCode = async () => {
    const clean = inputCode.trim().toUpperCase();
    if (clean.length !== 6 || !user) {
      Alert.alert('Invalid Code', 'Please enter a 6-digit invite code.');
      return;
    }

    setLinking(true);
    try {
      const q = query(
        collection(db, 'caregiverLinks'),
        where('inviteCode', '==', clean),
        where('status', '==', 'pending')
      );
      const snap = await getDocs(q);

      if (snap.empty) {
        Alert.alert('Invalid or Expired', 'No pending link found with this code.');
        return;
      }

      const linkDoc = snap.docs[0];
      const linkData = linkDoc.data();
      const patientId = linkData.patientId;

      // Update caregiverLink
      await updateDoc(doc(db, 'caregiverLinks', linkDoc.id), {
        caregiverId: user.uid,
        caregiverName: profile?.fullName || user.displayName || 'Caregiver',
        status: 'active',
        linkedAt: new Date().toISOString(),
      });

      // Update caregiver's linkedPatientIds
      await updateDoc(doc(db, 'users', user.uid), {
        linkedPatientIds: arrayUnion(patientId),
        activePatientId: patientId,
      });

      // Update patient's linkedCaregiverIds
      await updateDoc(doc(db, 'users', patientId), {
        linkedCaregiverIds: arrayUnion(user.uid),
      });

      await refreshLinkedPatients();
      setInputCode('');
      Alert.alert(
        'Success',
        `Successfully linked to patient (${linkData.patientName || 'Patient'})!`
      );
    } catch (e: any) {
      Alert.alert('Link Error', e.message || 'Failed to complete linking.');
    } finally {
      setLinking(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View style={styles.headerIcon}>
          <Ionicons name="link" size={24} color="#0D9488" />
        </View>
        <Text style={styles.title}>Caregiver Link Hub</Text>
        <Text style={styles.subtitle}>
          Securely connect patients and family caregivers for real-time medication visibility and emergency alerts.
        </Text>
      </View>

      {role === 'patient' ? (
        /* Patient View: Generate & Share Invite Code */
        <View style={styles.card}>
          <Text style={styles.cardHeading}>Share Invite Code with Caregiver</Text>
          <Text style={styles.cardDesc}>
            Generate a 6-digit code for your son, daughter, or nurse to link with your account.
          </Text>

          {activeCode ? (
            <View style={styles.codeContainer}>
              <Text style={styles.codeLabel}>YOUR ACTIVE INVITE CODE</Text>
              <Text style={styles.codeDisplay}>{activeCode}</Text>
              <Text style={styles.codeExpiry}>Valid for 24 hours</Text>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={handleGenerateCode}
              disabled={generating}
            >
              {generating ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name="key" size={18} color="#FFFFFF" />
                  <Text style={styles.actionBtnText}>Generate 6-Digit Code</Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>
      ) : (
        /* Caregiver View: Enter Code to Link */
        <View style={styles.card}>
          <Text style={styles.cardHeading}>Link a Patient Account</Text>
          <Text style={styles.cardDesc}>
            Enter the 6-digit invite code shown on your patient's PULSE app.
          </Text>

          <TextInput
            style={styles.codeInput}
            placeholder="ABC123"
            placeholderTextColor="#64748B"
            autoCapitalize="characters"
            maxLength={6}
            value={inputCode}
            onChangeText={setInputCode}
          />

          <TouchableOpacity
            style={styles.actionBtn}
            onPress={handleLinkCode}
            disabled={linking}
          >
            {linking ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={18} color="#FFFFFF" />
                <Text style={styles.actionBtnText}>Link Patient</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}

      {/* Safety & Privacy Notice */}
      <View style={styles.privacyCard}>
        <Ionicons name="shield-checkmark" size={20} color="#0D9488" />
        <View style={{ flex: 1 }}>
          <Text style={styles.privacyTitle}>Clinical Privacy Shield</Text>
          <Text style={styles.privacyDesc}>
            Only authorized caregivers with a verified invite code can monitor patient adherence and emergency alerts.
          </Text>
        </View>
      </View>
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
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  headerIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: 'rgba(13, 148, 136, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#F8FAFC',
  },
  subtitle: {
    color: '#94A3B8',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 18,
  },
  card: {
    backgroundColor: '#0F172A',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1E293B',
    padding: 18,
    marginBottom: 16,
  },
  cardHeading: {
    color: '#F8FAFC',
    fontSize: 16,
    fontWeight: '700',
  },
  cardDesc: {
    color: '#94A3B8',
    fontSize: 12,
    marginTop: 4,
    marginBottom: 16,
    lineHeight: 16,
  },
  codeContainer: {
    alignItems: 'center',
    backgroundColor: '#1E293B',
    borderWidth: 1.5,
    borderColor: '#0D9488',
    borderRadius: 14,
    padding: 20,
  },
  codeLabel: {
    color: '#0D9488',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },
  codeDisplay: {
    color: '#FFFFFF',
    fontSize: 36,
    fontWeight: '900',
    letterSpacing: 8,
    marginVertical: 10,
  },
  codeExpiry: {
    color: '#64748B',
    fontSize: 11,
  },
  codeInput: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: 6,
    textAlign: 'center',
    height: 54,
    marginBottom: 14,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#0D9488',
    paddingVertical: 14,
    borderRadius: 12,
  },
  actionBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  privacyCard: {
    flexDirection: 'row',
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#1E293B',
    borderRadius: 14,
    padding: 14,
    gap: 12,
    alignItems: 'center',
  },
  privacyTitle: {
    color: '#F8FAFC',
    fontSize: 13,
    fontWeight: '700',
  },
  privacyDesc: {
    color: '#64748B',
    fontSize: 11,
    marginTop: 2,
    lineHeight: 15,
  },
});

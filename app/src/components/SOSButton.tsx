import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system/legacy';
import { useSOS } from '../context/SOSContext';
import { useSettings } from '../context/SettingsContext';
import { useRole } from '../context/RoleContext';
import { SarvamService } from '../services/sarvamService';

export const SOSButton: React.FC = () => {
  const { triggerSOS } = useSOS();
  const { language, t } = useSettings();
  const { profile } = useRole();

  const [modalVisible, setModalVisible] = useState(false);
  const [phase, setPhase] = useState<'idle' | 'recording' | 'processing' | 'sent' | 'error'>('idle');
  const [recordingDuration, setRecordingDuration] = useState(0);
  const recordingRef = useRef<Audio.Recording | null>(null);
  const timerRef = useRef<any>(null);

  const startRecording = async () => {
    try {
      const permission = await Audio.requestPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Microphone Required', 'Please enable microphone access to record your SOS distress message.');
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      recordingRef.current = recording;
      setPhase('recording');
      setRecordingDuration(0);

      timerRef.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);
    } catch (e) {
      console.warn('Failed to start recording', e);
      setPhase('error');
    }
  };

  const stopAndSend = async () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (!recordingRef.current) return;

    setPhase('processing');
    try {
      await recordingRef.current.stopAndUnloadAsync();
      const uri = recordingRef.current.getURI();
      recordingRef.current = null;

      let transcription = 'Emergency SOS triggered.';
      let urgency: 'HIGH' | 'MED' | 'LOW' = 'HIGH';
      let summary = 'Patient triggered an urgent SOS alert.';
      let audioBase64 = '';

      if (uri) {
        audioBase64 = await FileSystem.readAsStringAsync(uri, {
          encoding: FileSystem.EncodingType.Base64,
        });

        try {
          transcription = await SarvamService.speechToText(uri, language);
          const triage = await SarvamService.triageSOS(transcription);
          urgency = triage.urgency;
          summary = triage.summary;
        } catch (err) {
          console.warn('Sarvam processing fallback', err);
        }
      }

      await triggerSOS({
        patientName: profile?.fullName || 'Patient',
        urgencyScore: urgency,
        transcription,
        translatedText: transcription,
        aiSummary: summary,
        language,
        audioBase64,
      });

      setPhase('sent');
      setTimeout(() => {
        setModalVisible(false);
        setPhase('idle');
      }, 2500);
    } catch (err) {
      console.warn('Failed to process SOS', err);
      setPhase('error');
    }
  };

  const cancelRecording = async () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (recordingRef.current) {
      try {
        await recordingRef.current.stopAndUnloadAsync();
      } catch {}
      recordingRef.current = null;
    }
    setModalVisible(false);
    setPhase('idle');
  };

  // Instant trigger without voice
  const handleInstantSOS = async () => {
    setModalVisible(true);
    setPhase('processing');
    try {
      await triggerSOS({
        patientName: profile?.fullName || 'Patient',
        urgencyScore: 'HIGH',
        transcription: 'Instant Emergency SOS button pressed',
        aiSummary: 'Instant Emergency SOS alert triggered by patient.',
        language,
      });
      setPhase('sent');
      setTimeout(() => {
        setModalVisible(false);
        setPhase('idle');
      }, 2000);
    } catch (e) {
      setPhase('error');
    }
  };

  return (
    <>
      <TouchableOpacity
        style={styles.sosButton}
        onPress={() => {
          setModalVisible(true);
          startRecording();
        }}
        onLongPress={handleInstantSOS}
        activeOpacity={0.85}
        accessibilityLabel="Emergency SOS button"
      >
        <View style={styles.innerCircle}>
          <Text style={styles.sosText}>SOS</Text>
          <Text style={styles.subText}>EMERGENCY</Text>
        </View>
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={cancelRecording}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            {phase === 'recording' && (
              <>
                <View style={styles.pulsingIcon}>
                  <Ionicons name="mic" size={36} color="#FFFFFF" />
                </View>
                <Text style={styles.modalTitle}>
                  {language === 'hi' ? 'अपनी समस्या बोलिए' : 'Speak Your Emergency'}
                </Text>
                <Text style={styles.timerText}>{recordingDuration}s</Text>
                <Text style={styles.modalSubtitle}>
                  {language === 'hi'
                    ? 'अपनी परेशानी बोलें, फिर "भेजें" दबाएँ।'
                    : 'Speak your symptoms clearly, then press "Stop & Send".'}
                </Text>

                <View style={styles.btnRow}>
                  <TouchableOpacity
                    style={styles.cancelBtn}
                    onPress={cancelRecording}
                  >
                    <Text style={styles.cancelText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.sendBtn}
                    onPress={stopAndSend}
                  >
                    <Ionicons name="paper-plane" size={16} color="#FFFFFF" />
                    <Text style={styles.sendText}>Stop & Send</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}

            {phase === 'processing' && (
              <>
                <ActivityIndicator size="large" color="#EF4444" style={{ marginBottom: 16 }} />
                <Text style={styles.modalTitle}>
                  {language === 'hi'
                    ? 'AI विश्लेषण और अलर्ट भेजा जा रहा है…'
                    : 'Analysing distress note & notifying caregivers…'}
                </Text>
                <Text style={styles.modalSubtitle}>
                  Sarvam AI is transcribing and rating the urgency.
                </Text>
              </>
            )}

            {phase === 'sent' && (
              <>
                <View style={styles.successIcon}>
                  <Ionicons name="checkmark-circle" size={48} color="#10B981" />
                </View>
                <Text style={styles.modalTitle}>
                  {language === 'hi'
                    ? 'केयरगिवर को सूचित कर दिया गया!'
                    : 'Emergency Alert Sent!'}
                </Text>
                <Text style={styles.modalSubtitle}>
                  Your emergency contacts and linked caregivers have received your alert.
                </Text>
              </>
            )}

            {phase === 'error' && (
              <>
                <Ionicons name="alert-circle" size={48} color="#EF4444" style={{ marginBottom: 12 }} />
                <Text style={styles.modalTitle}>Failed to send alert</Text>
                <Text style={styles.modalSubtitle}>Please check connection or call 112 directly.</Text>
                <TouchableOpacity style={styles.cancelBtn} onPress={cancelRecording}>
                  <Text style={styles.cancelText}>Dismiss</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  sosButton: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: '#DC2626',
    borderWidth: 4,
    borderColor: 'rgba(239, 68, 68, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#EF4444',
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 8,
  },
  innerCircle: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  sosText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 1,
  },
  subText: {
    color: '#FEE2E2',
    fontSize: 8,
    fontWeight: '800',
    marginTop: -2,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    backgroundColor: '#0F172A',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#334155',
    padding: 24,
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
  },
  pulsingIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  timerText: {
    fontSize: 28,
    fontWeight: '800',
    color: '#EF4444',
    marginVertical: 4,
  },
  successIcon: {
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#F8FAFC',
    textAlign: 'center',
    marginBottom: 6,
  },
  modalSubtitle: {
    fontSize: 13,
    color: '#94A3B8',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 18,
  },
  btnRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#334155',
    alignItems: 'center',
  },
  cancelText: {
    color: '#CBD5E1',
    fontWeight: '600',
    fontSize: 14,
  },
  sendBtn: {
    flex: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#EF4444',
  },
  sendText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
});

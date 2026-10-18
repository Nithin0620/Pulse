import React, { useState, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import { useMedication } from '../context/MedicationContext';
import { useSettings } from '../context/SettingsContext';
import { SarvamService } from '../services/sarvamService';

interface MedicineModalProps {
  visible: boolean;
  onClose: () => void;
}

type Slot = 'morning' | 'afternoon' | 'evening' | 'night';
const SLOTS: Slot[] = ['morning', 'afternoon', 'evening', 'night'];

export const MedicineModal: React.FC<MedicineModalProps> = ({ visible, onClose }) => {
  const { addMedication } = useMedication();
  const { language, t } = useSettings();

  const [name, setName] = useState('');
  const [dosage, setDosage] = useState('');
  const [instructions, setInstructions] = useState('');
  const [timing, setTiming] = useState<Slot[]>(['morning']);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessingVoice, setIsProcessingVoice] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const recordingRef = useRef<Audio.Recording | null>(null);

  const resetForm = () => {
    setName('');
    setDosage('');
    setInstructions('');
    setTiming(['morning']);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const toggleSlot = (slot: Slot) => {
    if (timing.includes(slot)) {
      if (timing.length > 1) {
        setTiming(timing.filter((s) => s !== slot));
      }
    } else {
      setTiming([...timing, slot]);
    }
  };

  const handleVoiceRecord = async () => {
    if (isRecording) {
      // Stop recording
      setIsRecording(false);
      setIsProcessingVoice(true);
      try {
        if (!recordingRef.current) return;
        await recordingRef.current.stopAndUnloadAsync();
        const uri = recordingRef.current.getURI();
        recordingRef.current = null;

        if (uri) {
          const transcript = await SarvamService.speechToText(uri, language);
          if (transcript) {
            const extracted = await SarvamService.extractMedicationFromText(transcript);
            if (extracted.name) setName(extracted.name);
            if (extracted.dosage) setDosage(extracted.dosage);
            if (extracted.instructions) setInstructions(extracted.instructions);
            if (Array.isArray(extracted.timing) && extracted.timing.length > 0) {
              setTiming(extracted.timing);
            }
          }
        }
      } catch (e) {
        console.warn('Voice add failed', e);
        Alert.alert('Voice Recognition', 'Could not process voice input. Please type manually.');
      } finally {
        setIsProcessingVoice(false);
      }
    } else {
      // Start recording
      try {
        const perm = await Audio.requestPermissionsAsync();
        if (!perm.granted) {
          Alert.alert('Permission needed', 'Microphone permission is required for voice input.');
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
        setIsRecording(true);
      } catch (e) {
        console.warn('Could not start recording', e);
      }
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Validation', 'Please enter a medicine name.');
      return;
    }

    setSubmitting(true);
    try {
      await addMedication({
        name: name.trim(),
        dosage: dosage.trim() || '1 Tablet',
        frequency:
          timing.length === 1 ? 'Once Daily' : timing.length === 2 ? 'Twice Daily' : 'Multiple Times Daily',
        timing,
        instructions: instructions.trim() || 'After meals',
        startDate: new Date().toISOString().split('T')[0],
      });
      handleClose();
    } catch (e) {
      console.warn('Failed to add medicine', e);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <View style={styles.backdrop}>
        <View style={styles.modalSheet}>
          <View style={styles.sheetHeader}>
            <View style={styles.headerLeft}>
              <Ionicons name="medkit" size={20} color="#0D9488" />
              <Text style={styles.sheetTitle}>
                {language === 'hi' ? 'नई दवाई जोड़ें' : 'Add Medication'}
              </Text>
            </View>
            <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
              <Ionicons name="close" size={20} color="#94A3B8" />
            </TouchableOpacity>
          </View>

          {/* Voice Input Helper Banner */}
          <TouchableOpacity
            style={[styles.voiceBanner, isRecording && styles.voiceBannerActive]}
            onPress={handleVoiceRecord}
            disabled={isProcessingVoice}
            activeOpacity={0.8}
          >
            {isProcessingVoice ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Ionicons
                name={isRecording ? 'stop-circle' : 'mic'}
                size={20}
                color={isRecording ? '#EF4444' : '#0D9488'}
              />
            )}
            <View style={styles.voiceTextWrap}>
              <Text style={styles.voiceTitle}>
                {isRecording
                  ? 'Recording... Tap to stop'
                  : isProcessingVoice
                  ? 'Sarvam AI is extracting details...'
                  : 'Tap to Add by Voice (बोलकर जोड़ें)'}
              </Text>
              <Text style={styles.voiceSub}>
                {isRecording
                  ? 'Speak medicine name, dosage, and when to take'
                  : 'e.g. "Metformin 500mg morning and night after food"'}
              </Text>
            </View>
          </TouchableOpacity>

          <ScrollView style={styles.formScroll} showsVerticalScrollIndicator={false}>
            <Text style={styles.label}>
              {language === 'hi' ? 'दवाई का नाम' : 'Medicine Name *'}
            </Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Paracetamol, Metformin"
              placeholderTextColor="#64748B"
              value={name}
              onChangeText={setName}
            />

            <Text style={styles.label}>
              {language === 'hi' ? 'खुराक (मात्रा)' : 'Dosage'}
            </Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 500mg, 1 tablet, 5ml"
              placeholderTextColor="#64748B"
              value={dosage}
              onChangeText={setDosage}
            />

            <Text style={styles.label}>
              {language === 'hi' ? 'लेने का समय' : 'Time of Day'}
            </Text>
            <View style={styles.slotsRow}>
              {SLOTS.map((s) => {
                const active = timing.includes(s);
                const label =
                  s === 'morning'
                    ? 'Morning'
                    : s === 'afternoon'
                    ? 'Afternoon'
                    : s === 'evening'
                    ? 'Evening'
                    : 'Night';
                return (
                  <TouchableOpacity
                    key={s}
                    style={[styles.slotChip, active && styles.slotChipActive]}
                    onPress={() => toggleSlot(s)}
                  >
                    <Ionicons
                      name={active ? 'checkmark-circle' : 'ellipse-outline'}
                      size={14}
                      color={active ? '#0D9488' : '#64748B'}
                    />
                    <Text style={[styles.slotChipText, active && styles.slotChipTextActive]}>
                      {label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={styles.label}>
              {language === 'hi' ? 'निर्देश' : 'Instructions'}
            </Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. After food with water"
              placeholderTextColor="#64748B"
              value={instructions}
              onChangeText={setInstructions}
            />
          </ScrollView>

          <View style={styles.footerRow}>
            <TouchableOpacity style={styles.cancelBtn} onPress={handleClose}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.saveBtn}
              onPress={handleSave}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.saveBtnText}>
                  {language === 'hi' ? 'दवाई सुरक्षित करें' : 'Save Medication'}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#0F172A',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '85%',
    borderTopWidth: 1,
    borderColor: '#334155',
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sheetTitle: {
    color: '#F8FAFC',
    fontSize: 18,
    fontWeight: '700',
  },
  closeBtn: {
    padding: 4,
  },
  voiceBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: 'rgba(13, 148, 136, 0.4)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  voiceBannerActive: {
    borderColor: '#EF4444',
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
  },
  voiceTextWrap: {
    flex: 1,
  },
  voiceTitle: {
    color: '#F8FAFC',
    fontSize: 13,
    fontWeight: '700',
  },
  voiceSub: {
    color: '#94A3B8',
    fontSize: 11,
    marginTop: 1,
  },
  formScroll: {
    marginBottom: 12,
  },
  label: {
    color: '#CBD5E1',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
    marginTop: 8,
  },
  input: {
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 10,
    color: '#FFFFFF',
    paddingHorizontal: 12,
    height: 44,
    fontSize: 14,
  },
  slotsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  slotChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#334155',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  slotChipActive: {
    backgroundColor: 'rgba(13, 148, 136, 0.15)',
    borderColor: '#0D9488',
  },
  slotChipText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '600',
  },
  slotChipTextActive: {
    color: '#0D9488',
    fontWeight: '700',
  },
  footerRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  cancelBtn: {
    flex: 1,
    backgroundColor: '#334155',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  cancelBtnText: {
    color: '#CBD5E1',
    fontSize: 14,
    fontWeight: '600',
  },
  saveBtn: {
    flex: 2,
    backgroundColor: '#0D9488',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});

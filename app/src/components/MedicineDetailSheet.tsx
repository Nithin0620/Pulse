import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Medication } from '../types';
import { SarvamService } from '../services/sarvamService';
import { useMedication } from '../context/MedicationContext';

interface MedicineDetailSheetProps {
  medication: Medication | null;
  visible: boolean;
  onClose: () => void;
}

export const MedicineDetailSheet: React.FC<MedicineDetailSheetProps> = ({
  medication,
  visible,
  onClose,
}) => {
  const { deleteMedication } = useMedication();
  const [details, setDetails] = useState<{
    uses?: string;
    sideEffects?: string;
    precautions?: string;
  } | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!medication) {
      setDetails(null);
      return;
    }

    let isMounted = true;
    (async () => {
      setLoading(true);
      try {
        const prompt = `Provide brief clinical information for the drug "${medication.name}":
1. Uses / Purpose
2. Common side effects
3. Important precautions
Respond in 2-3 concise bullet points.`;

        const response = await SarvamService.chat([
          { role: 'system', content: 'You are an Indic clinical pharmacist assistant. Keep advice concise and accurate.' },
          { role: 'user', content: prompt },
        ]);

        if (isMounted) {
          setDetails({ uses: response });
        }
      } catch {
        if (isMounted) {
          setDetails({ uses: 'Information currently unavailable offline.' });
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [medication]);

  const handleDelete = () => {
    if (!medication) return;
    Alert.alert('Remove Medicine', `Remove ${medication.name} from schedule?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          await deleteMedication(medication.id);
          onClose();
        },
      },
    ]);
  };

  if (!medication) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>{medication.name}</Text>
              <Text style={styles.subtitle}>{medication.dosage} • {medication.frequency}</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={20} color="#94A3B8" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            <View style={styles.timingCard}>
              <Text style={styles.timingLabel}>SCHEDULED TIMING</Text>
              <Text style={styles.timingVal}>
                {medication.timing.map((t) => t.toUpperCase()).join(' • ')}
              </Text>
              <Text style={styles.instVal}>{medication.instructions}</Text>
            </View>

            <Text style={styles.sectionHeading}>Clinical AI Guide</Text>
            {loading ? (
              <ActivityIndicator color="#0D9488" style={{ marginVertical: 20 }} />
            ) : (
              <View style={styles.infoCard}>
                <Text style={styles.infoText}>{details?.uses || 'Loading details...'}</Text>
              </View>
            )}
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
              <Ionicons name="trash-outline" size={18} color="#EF4444" />
              <Text style={styles.deleteBtnText}>Remove from Schedule</Text>
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
  sheet: {
    backgroundColor: '#0F172A',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '75%',
    borderTopWidth: 1,
    borderColor: '#334155',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#F8FAFC',
  },
  subtitle: {
    fontSize: 13,
    color: '#0D9488',
    marginTop: 2,
    fontWeight: '600',
  },
  closeBtn: {
    padding: 4,
  },
  content: {
    marginBottom: 16,
  },
  timingCard: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  timingLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 0.5,
  },
  timingVal: {
    fontSize: 14,
    fontWeight: '700',
    color: '#F8FAFC',
    marginTop: 4,
  },
  instVal: {
    fontSize: 12,
    color: '#CBD5E1',
    marginTop: 4,
  },
  sectionHeading: {
    fontSize: 13,
    fontWeight: '700',
    color: '#94A3B8',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  infoCard: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#334155',
  },
  infoText: {
    color: '#E2E8F0',
    fontSize: 13,
    lineHeight: 20,
  },
  footer: {
    paddingTop: 8,
  },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    borderRadius: 12,
    paddingVertical: 12,
  },
  deleteBtnText: {
    color: '#EF4444',
    fontWeight: '700',
    fontSize: 14,
  },
});

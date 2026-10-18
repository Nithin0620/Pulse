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
import { useActivePatient } from '../context/RoleContext';
import { VitalsService, VITAL_RANGES } from '../services/vitalsService';
import { VitalRecord } from '../types';

export const VitalsScreen: React.FC = () => {
  const { patientId } = useActivePatient();

  // Scanner State
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [liveBpm, setLiveBpm] = useState(72);
  const [liveSpo2, setLiveSpo2] = useState(98);
  const [liveHrv, setLiveHrv] = useState(48);

  // Manual Log Form State
  const [logType, setLogType] = useState<VitalRecord['type']>('bp');
  const [logValue, setLogValue] = useState('');
  const [logNotes, setLogNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // History State
  const [records, setRecords] = useState<VitalRecord[]>([]);

  useEffect(() => {
    if (!patientId) return;
    const unsub = VitalsService.subscribeToVitals(patientId, (data) => {
      setRecords(data);
    });
    return unsub;
  }, [patientId]);

  // Scan Simulation
  const handleStartScan = () => {
    setIsScanning(true);
    setScanProgress(0);

    const interval = setInterval(() => {
      setScanProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsScanning(false);
          // Auto record scanned heart rate & SpO2
          if (patientId) {
            VitalsService.recordVital(patientId, 'heartRate', 74, 'Optical Pulse Scan');
            VitalsService.recordVital(patientId, 'spo2', 98, 'Optical Pulse Scan');
          }
          Alert.alert('Scan Complete', 'Heart Rate: 74 BPM (Normal) • SpO2: 98% (Healthy)');
          return 100;
        }
        setLiveBpm(70 + Math.floor(Math.random() * 8));
        setLiveSpo2(97 + Math.floor(Math.random() * 3));
        return prev + 10;
      });
    }, 400);
  };

  const handleManualSave = async () => {
    if (!logValue.trim() || !patientId) {
      Alert.alert('Required', 'Please enter a reading value.');
      return;
    }

    setSubmitting(true);
    try {
      await VitalsService.recordVital(patientId, logType, logValue.trim(), logNotes.trim());
      setLogValue('');
      setLogNotes('');
      Alert.alert('Recorded', 'Vital reading saved to health records.');
    } catch (e) {
      Alert.alert('Error', 'Failed to save vital record.');
    } finally {
      setSubmitting(false);
    }
  };

  const vitalTypes: { key: VitalRecord['type']; label: string; placeholder: string; unit: string }[] = [
    { key: 'bp', label: 'Blood Pressure', placeholder: '120/80', unit: 'mmHg' },
    { key: 'sugar', label: 'Blood Sugar', placeholder: '110', unit: 'mg/dL' },
    { key: 'spo2', label: 'SpO2 Oxygen', placeholder: '98', unit: '%' },
    { key: 'heartRate', label: 'Heart Rate', placeholder: '72', unit: 'bpm' },
    { key: 'temperature', label: 'Temperature', placeholder: '98.4', unit: '°F' },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* 1. Pulse & Oxygen Optical Scanner */}
      <View style={styles.scannerCard}>
        <View style={styles.scannerHeader}>
          <View style={styles.scannerBadge}>
            <Ionicons name="pulse" size={14} color="#EF4444" />
            <Text style={styles.scannerBadgeText}>OPTICAL PULSE SCANNER</Text>
          </View>
        </View>

        <View style={styles.scannerBody}>
          <TouchableOpacity
            style={[styles.pulseCircle, isScanning && styles.pulseCircleActive]}
            onPress={isScanning ? undefined : handleStartScan}
            activeOpacity={0.85}
          >
            <Ionicons
              name={isScanning ? 'heart' : 'finger-print'}
              size={48}
              color="#EF4444"
            />
            <Text style={styles.circleText}>
              {isScanning ? `${liveBpm} BPM` : 'Tap to Scan'}
            </Text>
            {isScanning && (
              <Text style={styles.circleSubText}>SpO2 {liveSpo2}%</Text>
            )}
          </TouchableOpacity>

          {isScanning ? (
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${scanProgress}%` }]} />
              </View>
              <Text style={styles.progressText}>Scanning pulse... {scanProgress}%</Text>
            </View>
          ) : (
            <Text style={styles.scannerHint}>
              Place your fingertip against the sensor and tap to measure heart rate & SpO2.
            </Text>
          )}
        </View>
      </View>

      {/* 2. Manual Vital Reading Form */}
      <View style={styles.manualCard}>
        <Text style={styles.sectionTitle}>Log Vital Reading</Text>
        <Text style={styles.sectionSubtitle}>
          Record BP, Blood Sugar, Temperature or Oxygen readings
        </Text>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.typeScroll}
          contentContainerStyle={styles.typeRow}
        >
          {vitalTypes.map((vt) => {
            const active = logType === vt.key;
            return (
              <TouchableOpacity
                key={vt.key}
                style={[styles.typeChip, active && styles.typeChipActive]}
                onPress={() => setLogType(vt.key)}
              >
                <Text style={[styles.typeChipText, active && styles.typeChipTextActive]}>
                  {vt.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <View style={styles.inputRow}>
          <TextInput
            style={styles.valInput}
            placeholder={vitalTypes.find((v) => v.key === logType)?.placeholder}
            placeholderTextColor="#64748B"
            value={logValue}
            onChangeText={setLogValue}
            keyboardType="numbers-and-punctuation"
          />
          <View style={styles.unitBadge}>
            <Text style={styles.unitText}>
              {vitalTypes.find((v) => v.key === logType)?.unit}
            </Text>
          </View>
        </View>

        <TextInput
          style={styles.notesInput}
          placeholder="Notes (e.g. Fasting, after morning walk...)"
          placeholderTextColor="#64748B"
          value={logNotes}
          onChangeText={setLogNotes}
        />

        <TouchableOpacity
          style={styles.saveBtn}
          onPress={handleManualSave}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <Text style={styles.saveBtnText}>Save Reading</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* 3. Recent Vitals History */}
      <Text style={styles.historyHeading}>Recent Telemetry Records</Text>
      {records.length === 0 ? (
        <View style={styles.emptyCard}>
          <Ionicons name="fitness-outline" size={32} color="#64748B" />
          <Text style={styles.emptyText}>No vitals logged yet</Text>
        </View>
      ) : (
        records.map((rec) => {
          const typeMeta = VITAL_RANGES[rec.type as keyof typeof VITAL_RANGES];
          const evaluation = typeMeta?.evaluate ? typeMeta.evaluate(rec.value) : 'Normal';
          const isHigh = evaluation === 'High' || evaluation === 'Fever';

          return (
            <View key={rec.id} style={styles.historyCard}>
              <View style={styles.historyLeft}>
                <View style={[styles.historyIcon, isHigh && styles.historyIconHigh]}>
                  <Ionicons
                    name={rec.type === 'bp' ? 'heart' : 'speedometer'}
                    size={18}
                    color={isHigh ? '#EF4444' : '#0D9488'}
                  />
                </View>
                <View>
                  <Text style={styles.historyType}>
                    {typeMeta?.label || rec.type.toUpperCase()}
                  </Text>
                  <Text style={styles.historyTime}>
                    {new Date(rec.timestamp).toLocaleDateString()} • {rec.notes || 'Routine check'}
                  </Text>
                </View>
              </View>

              <View style={styles.historyRight}>
                <Text style={styles.historyValue}>
                  {rec.value} <Text style={styles.historyUnit}>{rec.unit}</Text>
                </Text>
                <View style={[styles.statusBadge, isHigh ? styles.badgeHigh : styles.badgeNormal]}>
                  <Text style={[styles.statusText, isHigh ? styles.statusTextHigh : styles.statusTextNormal]}>
                    {evaluation}
                  </Text>
                </View>
              </View>
            </View>
          );
        })
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
    padding: 16,
    paddingBottom: 40,
  },
  scannerCard: {
    backgroundColor: '#0F172A',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1E293B',
    padding: 18,
    marginBottom: 16,
  },
  scannerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  scannerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  scannerBadgeText: {
    color: '#EF4444',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  scannerBody: {
    alignItems: 'center',
  },
  pulseCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 2,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 10,
  },
  pulseCircleActive: {
    borderColor: '#EF4444',
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
  },
  circleText: {
    color: '#F8FAFC',
    fontSize: 14,
    fontWeight: '700',
    marginTop: 4,
  },
  circleSubText: {
    color: '#10B981',
    fontSize: 12,
    fontWeight: '600',
  },
  progressContainer: {
    width: '100%',
    alignItems: 'center',
    marginTop: 10,
  },
  progressBar: {
    width: '100%',
    height: 6,
    backgroundColor: '#1E293B',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#EF4444',
    borderRadius: 3,
  },
  progressText: {
    color: '#94A3B8',
    fontSize: 12,
    marginTop: 6,
  },
  scannerHint: {
    color: '#94A3B8',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 16,
  },
  manualCard: {
    backgroundColor: '#0F172A',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1E293B',
    padding: 16,
    marginBottom: 20,
  },
  sectionTitle: {
    color: '#F8FAFC',
    fontSize: 16,
    fontWeight: '700',
  },
  sectionSubtitle: {
    color: '#64748B',
    fontSize: 12,
    marginTop: 2,
    marginBottom: 12,
  },
  typeScroll: {
    marginHorizontal: -16,
    marginBottom: 14,
  },
  typeRow: {
    paddingHorizontal: 16,
    gap: 8,
  },
  typeChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#334155',
  },
  typeChipActive: {
    backgroundColor: '#0D9488',
    borderColor: '#0D9488',
  },
  typeChipText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '600',
  },
  typeChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 8,
  },
  valInput: {
    flex: 1,
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 10,
    color: '#FFFFFF',
    paddingHorizontal: 14,
    height: 46,
    fontSize: 16,
    fontWeight: '600',
  },
  unitBadge: {
    backgroundColor: '#334155',
    paddingHorizontal: 12,
    height: 46,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unitText: {
    color: '#CBD5E1',
    fontWeight: '700',
    fontSize: 13,
  },
  notesInput: {
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 10,
    color: '#FFFFFF',
    paddingHorizontal: 14,
    height: 42,
    fontSize: 13,
    marginBottom: 12,
  },
  saveBtn: {
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
  historyHeading: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  emptyCard: {
    backgroundColor: '#0F172A',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
  },
  emptyText: {
    color: '#64748B',
    fontSize: 13,
    marginTop: 6,
  },
  historyCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1E293B',
    padding: 14,
    marginBottom: 8,
  },
  historyLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  historyIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(13, 148, 136, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  historyIconHigh: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
  },
  historyType: {
    color: '#F8FAFC',
    fontSize: 14,
    fontWeight: '700',
  },
  historyTime: {
    color: '#94A3B8',
    fontSize: 11,
    marginTop: 2,
  },
  historyRight: {
    alignItems: 'flex-end',
  },
  historyValue: {
    color: '#F8FAFC',
    fontSize: 15,
    fontWeight: '700',
  },
  historyUnit: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '400',
  },
  statusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 4,
  },
  badgeNormal: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
  },
  badgeHigh: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
  },
  statusTextNormal: {
    color: '#10B981',
  },
  statusTextHigh: {
    color: '#EF4444',
  },
});

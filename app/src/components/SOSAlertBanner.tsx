import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSOS } from '../context/SOSContext';
import { useRole } from '../context/RoleContext';
import { SarvamService } from '../services/sarvamService';

export const SOSAlertBanner: React.FC = () => {
  const { role } = useRole();
  const { pendingSosEvents, acknowledgeAlert, resolveAlert } = useSOS();
  const [isPlaying, setIsPlaying] = useState<string | null>(null);

  if (role !== 'caregiver' || pendingSosEvents.length === 0) {
    return null;
  }

  const latestAlert = pendingSosEvents[0];

  const handlePlayAudio = async () => {
    if (!latestAlert.audioBase64) return;
    setIsPlaying(latestAlert.id);
    await SarvamService.playAudioBase64(latestAlert.audioBase64);
    setIsPlaying(null);
  };

  return (
    <View style={styles.bannerContainer}>
      <View style={styles.topRow}>
        <View style={styles.badgeRow}>
          <View style={styles.pulsingDot} />
          <Text style={styles.alertTitle}>EMERGENCY SOS ALERT</Text>
          <View style={[
            styles.urgencyBadge,
            latestAlert.urgencyScore === 'HIGH' ? styles.badgeHigh : styles.badgeMed
          ]}>
            <Text style={styles.urgencyText}>{latestAlert.urgencyScore}</Text>
          </View>
        </View>

        <Text style={styles.timeText}>Just now</Text>
      </View>

      <Text style={styles.patientLine}>
        Patient: <Text style={styles.patientBold}>{latestAlert.patientName}</Text>
      </Text>

      <Text style={styles.summaryText}>
        {latestAlert.aiSummary || latestAlert.transcription || 'Patient pressed emergency SOS'}
      </Text>

      <View style={styles.actionsRow}>
        {Boolean(latestAlert.audioBase64) && (
          <TouchableOpacity
            style={styles.audioBtn}
            onPress={handlePlayAudio}
            activeOpacity={0.8}
          >
            <Ionicons
              name={isPlaying === latestAlert.id ? 'pause-circle' : 'volume-high'}
              size={16}
              color="#FFFFFF"
            />
            <Text style={styles.audioBtnText}>
              {isPlaying === latestAlert.id ? 'Playing Voice...' : 'Hear Voice'}
            </Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={styles.ackBtn}
          onPress={() => acknowledgeAlert(latestAlert.id)}
          activeOpacity={0.8}
        >
          <Ionicons name="checkmark-done" size={16} color="#FFFFFF" />
          <Text style={styles.actionBtnText}>Acknowledge</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.resolveBtn}
          onPress={() => resolveAlert(latestAlert.id)}
          activeOpacity={0.8}
        >
          <Ionicons name="shield-checkmark" size={16} color="#FFFFFF" />
          <Text style={styles.actionBtnText}>Resolve</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  bannerContainer: {
    backgroundColor: '#7F1D1D',
    borderBottomWidth: 2,
    borderBottomColor: '#EF4444',
    padding: 12,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  pulsingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
  },
  alertTitle: {
    color: '#FECACA',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  urgencyBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgeHigh: {
    backgroundColor: '#DC2626',
  },
  badgeMed: {
    backgroundColor: '#F59E0B',
  },
  urgencyText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
  timeText: {
    color: '#FCA5A5',
    fontSize: 11,
  },
  patientLine: {
    color: '#FEE2E2',
    fontSize: 13,
    marginBottom: 2,
  },
  patientBold: {
    fontWeight: '700',
    color: '#FFFFFF',
  },
  summaryText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 8,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  audioBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.4)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  audioBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  ackBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#0284C7',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  resolveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#16A34A',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  actionBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
});

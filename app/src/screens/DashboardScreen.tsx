import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useMedication } from '../context/MedicationContext';
import { useSettings } from '../context/SettingsContext';
import { useRole } from '../context/RoleContext';
import { useFirebase } from '../context/FirebaseContext';
import { SOSButton } from '../components/SOSButton';

interface DashboardScreenProps {
  navigation?: any;
}

type Slot = 'morning' | 'afternoon' | 'evening' | 'night';
const SLOTS: Slot[] = ['morning', 'afternoon', 'evening', 'night'];

export const DashboardScreen: React.FC<DashboardScreenProps> = ({ navigation }) => {
  const { medications, logs, toggleDose, streak, adherenceRate, loading } = useMedication();
  const { language, t } = useSettings();
  const { role, profile, activePatientName } = useRole();
  const { user } = useFirebase();

  const [activeSlot, setActiveSlot] = useState<Slot>('morning');
  const [countdown, setCountdown] = useState('--:--:--');
  const [nextDoseInfo, setNextDoseInfo] = useState<{ name: string; slot: string } | null>(null);

  const todayStr = new Date().toISOString().split('T')[0];
  const todayLogs = logs[todayStr] || {};

  // Compute Next Dose Countdown
  useEffect(() => {
    if (medications.length === 0) {
      setCountdown('--:--:--');
      setNextDoseInfo(null);
      return;
    }

    const slotHours: Record<Slot, number> = {
      morning: 8,
      afternoon: 13,
      evening: 18,
      night: 21,
    };

    const interval = setInterval(() => {
      const now = new Date();
      let nearestDiff = Infinity;
      let targetMedName = '';
      let targetSlot = '';

      medications.forEach((med) => {
        med.timing.forEach((slot) => {
          const target = new Date();
          target.setHours(slotHours[slot], 0, 0, 0);

          const key = `${med.id}_${slot}`;
          const isTaken = todayLogs[key]?.taken;

          let diff = target.getTime() - now.getTime();
          if (diff <= 0 || isTaken) {
            target.setDate(target.getDate() + 1);
            diff = target.getTime() - now.getTime();
          }

          if (diff < nearestDiff) {
            nearestDiff = diff;
            targetMedName = med.name;
            targetSlot = slot;
          }
        });
      });

      if (nearestDiff < Infinity) {
        const secs = Math.floor(nearestDiff / 1000);
        const h = Math.floor(secs / 3600);
        const m = Math.floor((secs % 3600) / 60);
        const s = secs % 60;
        setCountdown(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`);
        setNextDoseInfo({ name: targetMedName, slot: targetSlot });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [medications, todayLogs]);

  // Daily completion percentage
  let scheduledTotal = 0;
  let takenTotal = 0;
  medications.forEach((m) => {
    m.timing.forEach((s) => {
      scheduledTotal++;
      if (todayLogs[`${m.id}_${s}`]?.taken) takenTotal++;
    });
  });
  const todayPercent = scheduledTotal > 0 ? Math.round((takenTotal / scheduledTotal) * 100) : 0;

  const slotLabels: Record<Slot, { en: string; hi: string; icon: string }> = {
    morning: { en: 'Morning', hi: 'सुबह', icon: 'sunny-outline' },
    afternoon: { en: 'Afternoon', hi: 'दोपहर', icon: 'partly-sunny-outline' },
    evening: { en: 'Evening', hi: 'शाम', icon: 'cloudy-night-outline' },
    night: { en: 'Night', hi: 'रात', icon: 'moon-outline' },
  };

  const slotMedications = medications.filter((m) => m.timing.includes(activeSlot));

  const greetingName =
    role === 'caregiver' && activePatientName
      ? activePatientName
      : profile?.fullName || user?.displayName || 'Friend';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Top Welcome Header */}
      <View style={styles.topHeader}>
        <View style={styles.greetingWrap}>
          <Text style={styles.dateText}>
            {new Date().toLocaleDateString(language === 'hi' ? 'hi-IN' : 'en-US', {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
            })}
          </Text>
          <Text style={styles.greetingTitle}>
            {language === 'hi' ? `नमस्ते, ${greetingName}` : `Hello, ${greetingName}`}
          </Text>
          <Text style={styles.greetingSub}>
            {role === 'caregiver'
              ? 'Monitoring patient medication & wellness'
              : todayPercent === 100 && scheduledTotal > 0
              ? 'All doses completed for today! 🎉'
              : `${takenTotal} of ${scheduledTotal} doses logged today`}
          </Text>
        </View>

        {/* SOS Floating Action */}
        {role === 'patient' && (
          <View style={styles.sosWrap}>
            <SOSButton />
          </View>
        )}
      </View>

      {/* Next Dose Card */}
      <View style={styles.nextDoseCard}>
        <View style={styles.nextDoseLeft}>
          <View style={styles.timerBadge}>
            <Ionicons name="time-outline" size={14} color="#0D9488" />
            <Text style={styles.timerBadgeText}>NEXT DOSE</Text>
          </View>
          <Text style={styles.nextDoseName} numberOfLines={1}>
            {nextDoseInfo?.name || 'No upcoming dose'}
          </Text>
          <Text style={styles.nextDoseSlot}>
            {nextDoseInfo ? `Scheduled for ${nextDoseInfo.slot}` : 'All caught up!'}
          </Text>
        </View>

        <View style={styles.countdownBox}>
          <Text style={styles.countdownTime}>{countdown}</Text>
          <Text style={styles.countdownLabel}>Time Left</Text>
        </View>
      </View>

      {/* 4-Slot Daily Medication Tracker */}
      <View style={styles.scheduleSection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            {language === 'hi' ? 'आज की दवाइयाँ' : "Today's Schedule"}
          </Text>
          <View style={styles.progressPill}>
            <Text style={styles.progressPillText}>{todayPercent}% Done</Text>
          </View>
        </View>

        {/* Slot Selector Tabs */}
        <View style={styles.slotRow}>
          {SLOTS.map((s) => {
            const isSelected = activeSlot === s;
            const meta = slotLabels[s];
            const slotCount = medications.filter((m) => m.timing.includes(s)).length;

            return (
              <TouchableOpacity
                key={s}
                style={[styles.slotTab, isSelected && styles.slotTabActive]}
                onPress={() => setActiveSlot(s)}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={meta.icon as any}
                  size={16}
                  color={isSelected ? '#0D9488' : '#94A3B8'}
                />
                <Text style={[styles.slotTabText, isSelected && styles.slotTabTextActive]}>
                  {language === 'hi' ? meta.hi : meta.en}
                </Text>
                {slotCount > 0 && (
                  <View style={[styles.slotBadge, isSelected && styles.slotBadgeActive]}>
                    <Text style={styles.slotBadgeText}>{slotCount}</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Medicines for the selected slot */}
        <View style={styles.slotCardsWrap}>
          {loading ? (
            <ActivityIndicator color="#0D9488" style={{ padding: 20 }} />
          ) : slotMedications.length === 0 ? (
            <View style={styles.emptySlot}>
              <Ionicons name="checkmark-done-circle-outline" size={32} color="#64748B" />
              <Text style={styles.emptySlotText}>
                No medicines scheduled for {activeSlot}.
              </Text>
            </View>
          ) : (
            slotMedications.map((med) => {
              const logKey = `${med.id}_${activeSlot}`;
              const isTaken = !!todayLogs[logKey]?.taken;

              return (
                <View
                  key={med.id}
                  style={[styles.doseItem, isTaken && styles.doseItemTaken]}
                >
                  <View style={styles.doseLeft}>
                    <View style={[styles.pillIcon, isTaken && styles.pillIconTaken]}>
                      <Ionicons
                        name="medkit"
                        size={18}
                        color={isTaken ? '#10B981' : '#0D9488'}
                      />
                    </View>
                    <View style={styles.doseInfo}>
                      <Text style={[styles.doseName, isTaken && styles.doseNameTaken]}>
                        {med.name}
                      </Text>
                      <Text style={styles.doseDosage}>
                        {med.dosage} • {med.instructions || 'With water'}
                      </Text>
                    </View>
                  </View>

                  <TouchableOpacity
                    style={[styles.checkBtn, isTaken && styles.checkBtnTaken]}
                    onPress={() => toggleDose(todayStr, med.id, activeSlot)}
                    activeOpacity={0.8}
                  >
                    <Ionicons
                      name={isTaken ? 'checkmark-circle' : 'ellipse-outline'}
                      size={24}
                      color={isTaken ? '#10B981' : '#94A3B8'}
                    />
                    <Text style={[styles.checkBtnText, isTaken && styles.checkBtnTextTaken]}>
                      {isTaken ? 'Taken' : 'Take'}
                    </Text>
                  </TouchableOpacity>
                </View>
              );
            })
          )}
        </View>
      </View>

      {/* Adherence Streak Banner */}
      <TouchableOpacity
        style={styles.streakBanner}
        onPress={() => navigation?.navigate('AdherenceReport')}
        activeOpacity={0.8}
      >
        <View style={styles.streakLeft}>
          <Text style={styles.fireEmoji}>🔥</Text>
          <View>
            <Text style={styles.streakCount}>{streak} Days Streak!</Text>
            <Text style={styles.streakDesc}>
              {adherenceRate}% adherence over past 7 days
            </Text>
          </View>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#F59E0B" />
      </TouchableOpacity>

      {/* Quick Access Grid */}
      <Text style={styles.quickGridTitle}>Healthcare Services</Text>
      <View style={styles.quickGrid}>
        <TouchableOpacity
          style={styles.gridCard}
          onPress={() => navigation?.navigate('Vitals')}
        >
          <View style={[styles.gridIconWrap, { backgroundColor: 'rgba(239, 68, 68, 0.15)' }]}>
            <Ionicons name="heart" size={20} color="#EF4444" />
          </View>
          <Text style={styles.gridCardTitle}>Vitals & Pulse</Text>
          <Text style={styles.gridCardDesc}>BP, Sugar, SpO2 logs</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.gridCard}
          onPress={() => navigation?.navigate('Documents')}
        >
          <View style={[styles.gridIconWrap, { backgroundColor: 'rgba(59, 130, 246, 0.15)' }]}>
            <Ionicons name="document-text" size={20} color="#3B82F6" />
          </View>
          <Text style={styles.gridCardTitle}>Prescriptions</Text>
          <Text style={styles.gridCardDesc}>OCR AI extraction</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.gridCard}
          onPress={() => navigation?.navigate('NearbyCare')}
        >
          <View style={[styles.gridIconWrap, { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}>
            <Ionicons name="navigate" size={20} color="#10B981" />
          </View>
          <Text style={styles.gridCardTitle}>Nearby Care</Text>
          <Text style={styles.gridCardDesc}>Hospitals & 24/7 Meds</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.gridCard}
          onPress={() => navigation?.navigate('Appointments')}
        >
          <View style={[styles.gridIconWrap, { backgroundColor: 'rgba(245, 158, 11, 0.15)' }]}>
            <Ionicons name="calendar" size={20} color="#F59E0B" />
          </View>
          <Text style={styles.gridCardTitle}>Appointments</Text>
          <Text style={styles.gridCardDesc}>Doctor reminders</Text>
        </TouchableOpacity>
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
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  greetingWrap: {
    flex: 1,
    paddingRight: 12,
  },
  dateText: {
    color: '#0D9488',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  greetingTitle: {
    color: '#F8FAFC',
    fontSize: 22,
    fontWeight: '800',
    marginTop: 2,
  },
  greetingSub: {
    color: '#94A3B8',
    fontSize: 12,
    marginTop: 2,
  },
  sosWrap: {
    marginLeft: 8,
  },
  nextDoseCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#1E293B',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  nextDoseLeft: {
    flex: 1,
  },
  timerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  timerBadgeText: {
    color: '#0D9488',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  nextDoseName: {
    color: '#F8FAFC',
    fontSize: 16,
    fontWeight: '700',
  },
  nextDoseSlot: {
    color: '#94A3B8',
    fontSize: 12,
    marginTop: 2,
  },
  countdownBox: {
    alignItems: 'flex-end',
    backgroundColor: '#1E293B',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#334155',
  },
  countdownTime: {
    color: '#0D9488',
    fontSize: 16,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  countdownLabel: {
    color: '#94A3B8',
    fontSize: 10,
    marginTop: 2,
  },
  scheduleSection: {
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#1E293B',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    color: '#F8FAFC',
    fontSize: 16,
    fontWeight: '700',
  },
  progressPill: {
    backgroundColor: 'rgba(13, 148, 136, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  progressPillText: {
    color: '#0D9488',
    fontSize: 11,
    fontWeight: '700',
  },
  slotRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 12,
  },
  slotTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: '#1E293B',
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  slotTabActive: {
    borderColor: '#0D9488',
    backgroundColor: 'rgba(13, 148, 136, 0.15)',
  },
  slotTabText: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '600',
  },
  slotTabTextActive: {
    color: '#0D9488',
    fontWeight: '700',
  },
  slotBadge: {
    backgroundColor: '#334155',
    borderRadius: 8,
    width: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  slotBadgeActive: {
    backgroundColor: '#0D9488',
  },
  slotBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
  },
  slotCardsWrap: {
    gap: 8,
  },
  doseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 12,
    padding: 12,
  },
  doseItemTaken: {
    borderColor: 'rgba(16, 185, 129, 0.3)',
    backgroundColor: 'rgba(16, 185, 129, 0.05)',
  },
  doseLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  pillIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(13, 148, 136, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  pillIconTaken: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
  },
  doseInfo: {
    flex: 1,
  },
  doseName: {
    color: '#F8FAFC',
    fontSize: 14,
    fontWeight: '700',
  },
  doseNameTaken: {
    color: '#94A3B8',
    textDecorationLine: 'line-through',
  },
  doseDosage: {
    color: '#94A3B8',
    fontSize: 11,
    marginTop: 2,
  },
  checkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#334155',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  checkBtnTaken: {
    borderColor: '#10B981',
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
  },
  checkBtnText: {
    color: '#CBD5E1',
    fontSize: 12,
    fontWeight: '600',
  },
  checkBtnTextTaken: {
    color: '#10B981',
    fontWeight: '700',
  },
  emptySlot: {
    alignItems: 'center',
    paddingVertical: 18,
  },
  emptySlotText: {
    color: '#64748B',
    fontSize: 13,
    marginTop: 6,
  },
  streakBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1E1B18',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
    borderRadius: 16,
    padding: 14,
    marginBottom: 20,
  },
  streakLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  fireEmoji: {
    fontSize: 26,
  },
  streakCount: {
    color: '#F59E0B',
    fontSize: 15,
    fontWeight: '800',
  },
  streakDesc: {
    color: '#D97706',
    fontSize: 12,
    marginTop: 1,
  },
  quickGridTitle: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  gridCard: {
    width: '48.5%',
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#1E293B',
    borderRadius: 14,
    padding: 14,
  },
  gridIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  gridCardTitle: {
    color: '#F8FAFC',
    fontSize: 14,
    fontWeight: '700',
  },
  gridCardDesc: {
    color: '#64748B',
    fontSize: 11,
    marginTop: 2,
  },
});

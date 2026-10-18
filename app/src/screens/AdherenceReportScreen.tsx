import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useMedication } from '../context/MedicationContext';
import { useSettings } from '../context/SettingsContext';

const SCREEN_WIDTH = Dimensions.get('window').width;

export const AdherenceReportScreen: React.FC = () => {
  const { medications, logs, streak, adherenceRate } = useMedication();
  const { language, t } = useSettings();

  // Compute 7 days breakdown
  const days: { label: string; date: string; taken: number; total: number; percent: number }[] = [];
  const today = new Date();

  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const dayLog = logs[dateStr] || {};

    let total = 0;
    let taken = 0;
    medications.forEach((m) => {
      m.timing.forEach((slot) => {
        total++;
        if (dayLog[`${m.id}_${slot}`]?.taken) taken++;
      });
    });

    const percent = total > 0 ? Math.round((taken / total) * 100) : 100;
    const label = d.toLocaleDateString(language === 'hi' ? 'hi-IN' : 'en-US', {
      weekday: 'narrow',
    });

    days.push({ label, date: dateStr, taken, total, percent });
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Overview Stat Cards */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statEmoji}>🔥</Text>
          <Text style={styles.statVal}>{streak}</Text>
          <Text style={styles.statLabel}>Day Streak</Text>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statEmoji}>📈</Text>
          <Text style={[styles.statVal, { color: '#10B981' }]}>{adherenceRate}%</Text>
          <Text style={styles.statLabel}>7-Day Score</Text>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statEmoji}>💊</Text>
          <Text style={[styles.statVal, { color: '#0D9488' }]}>{medications.length}</Text>
          <Text style={styles.statLabel}>Active Meds</Text>
        </View>
      </View>

      {/* 7-Day Visual Bar Chart */}
      <View style={styles.chartCard}>
        <Text style={styles.chartTitle}>Past 7 Days Adherence</Text>
        <Text style={styles.chartSubtitle}>Daily percentage of completed doses</Text>

        <View style={styles.barsContainer}>
          {days.map((item, idx) => {
            const barHeight = Math.max((item.percent / 100) * 120, 8);
            const isFull = item.percent === 100;
            return (
              <View key={idx} style={styles.barCol}>
                <Text style={styles.barValueText}>{item.percent}%</Text>
                <View style={styles.barTrack}>
                  <View
                    style={[
                      styles.barFill,
                      { height: barHeight },
                      isFull ? styles.barFillSuccess : styles.barFillPartial,
                    ]}
                  />
                </View>
                <Text style={styles.barDayLabel}>{item.label}</Text>
              </View>
            );
          })}
        </View>
      </View>

      {/* Clinical Guidance */}
      <View style={styles.insightCard}>
        <View style={styles.insightIconWrap}>
          <Ionicons name="shield-checkmark" size={20} color="#0D9488" />
        </View>
        <View style={styles.insightInfo}>
          <Text style={styles.insightTitle}>Clinical Adherence Score</Text>
          <Text style={styles.insightText}>
            {adherenceRate >= 80
              ? 'Excellent! Consistent medication intake reduces complication risks.'
              : 'Keep going! Set active reminder notifications to stay on track.'}
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
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#1E293B',
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
  },
  statEmoji: {
    fontSize: 20,
    marginBottom: 4,
  },
  statVal: {
    color: '#F59E0B',
    fontSize: 22,
    fontWeight: '800',
  },
  statLabel: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  chartCard: {
    backgroundColor: '#0F172A',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1E293B',
    padding: 16,
    marginBottom: 16,
  },
  chartTitle: {
    color: '#F8FAFC',
    fontSize: 16,
    fontWeight: '700',
  },
  chartSubtitle: {
    color: '#64748B',
    fontSize: 12,
    marginTop: 2,
    marginBottom: 20,
  },
  barsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 160,
    paddingHorizontal: 8,
  },
  barCol: {
    alignItems: 'center',
    width: (SCREEN_WIDTH - 80) / 7,
  },
  barValueText: {
    color: '#94A3B8',
    fontSize: 9,
    fontWeight: '700',
    marginBottom: 4,
  },
  barTrack: {
    width: 14,
    height: 120,
    backgroundColor: '#1E293B',
    borderRadius: 7,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  barFill: {
    width: '100%',
    borderRadius: 7,
  },
  barFillSuccess: {
    backgroundColor: '#10B981',
  },
  barFillPartial: {
    backgroundColor: '#0D9488',
  },
  barDayLabel: {
    color: '#CBD5E1',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 8,
  },
  insightCard: {
    flexDirection: 'row',
    backgroundColor: '#0F172A',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#1E293B',
    padding: 14,
    gap: 12,
    alignItems: 'center',
  },
  insightIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: 'rgba(13, 148, 136, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  insightInfo: {
    flex: 1,
  },
  insightTitle: {
    color: '#F8FAFC',
    fontSize: 14,
    fontWeight: '700',
  },
  insightText: {
    color: '#94A3B8',
    fontSize: 12,
    marginTop: 2,
    lineHeight: 16,
  },
});

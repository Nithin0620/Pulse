import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useMedication } from '../context/MedicationContext';
import { useSettings } from '../context/SettingsContext';
import { Medication } from '../types';
import { MedicineModal } from '../components/MedicineModal';
import { MedicineDetailSheet } from '../components/MedicineDetailSheet';

type FilterSlot = 'all' | 'morning' | 'afternoon' | 'evening' | 'night';

export const MedicinesScreen: React.FC = () => {
  const { medications, logs, toggleDose, loading } = useMedication();
  const { language, t } = useSettings();

  const [search, setSearch] = useState('');
  const [slotFilter, setSlotFilter] = useState<FilterSlot>('all');
  const [isAddModalOpen, setAddModalOpen] = useState(false);
  const [selectedMed, setSelectedMed] = useState<Medication | null>(null);

  const todayStr = new Date().toISOString().split('T')[0];
  const todayLogs = logs[todayStr] || {};

  const filteredMeds = medications.filter((m) => {
    const matchesSearch = m.name.toLowerCase().includes(search.toLowerCase());
    const matchesSlot = slotFilter === 'all' || m.timing.includes(slotFilter as any);
    return matchesSearch && matchesSlot;
  });

  const slots = [
    { key: 'all', label: 'All Meds' },
    { key: 'morning', label: 'Morning' },
    { key: 'afternoon', label: 'Afternoon' },
    { key: 'evening', label: 'Evening' },
    { key: 'night', label: 'Night' },
  ];

  return (
    <View style={styles.container}>
      {/* Search & Filter Header */}
      <View style={styles.topBar}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={16} color="#94A3B8" />
          <TextInput
            style={styles.searchInput}
            placeholder={language === 'hi' ? 'दवाई खोजें...' : 'Search medications...'}
            placeholderTextColor="#64748B"
            value={search}
            onChangeText={setSearch}
          />
          {Boolean(search) && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={16} color="#94A3B8" />
            </TouchableOpacity>
          )}
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterScroll}
          contentContainerStyle={styles.filterRow}
        >
          {slots.map((s) => {
            const active = slotFilter === s.key;
            return (
              <TouchableOpacity
                key={s.key}
                style={[styles.filterChip, active && styles.filterChipActive]}
                onPress={() => setSlotFilter(s.key as FilterSlot)}
              >
                <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>
                  {s.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Medication List */}
      <ScrollView contentContainerStyle={styles.listContent}>
        {loading ? (
          <ActivityIndicator color="#0D9488" style={{ marginTop: 40 }} />
        ) : filteredMeds.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="medkit-outline" size={48} color="#475569" />
            <Text style={styles.emptyTitle}>No medications found</Text>
            <Text style={styles.emptySubtitle}>
              Tap the "+ Add Medicine" button below or scan your prescription to add daily medicines.
            </Text>
          </View>
        ) : (
          filteredMeds.map((med) => {
            return (
              <TouchableOpacity
                key={med.id}
                style={styles.medCard}
                onPress={() => setSelectedMed(med)}
                activeOpacity={0.8}
              >
                <View style={styles.medCardLeft}>
                  <View style={styles.medIconWrap}>
                    <Ionicons name="medkit" size={20} color="#0D9488" />
                  </View>
                  <View style={styles.medInfo}>
                    <Text style={styles.medName}>{med.name}</Text>
                    <Text style={styles.medDosage}>{med.dosage}</Text>
                    <Text style={styles.medInstructions}>
                      {med.instructions || 'With water'}
                    </Text>

                    <View style={styles.timingBadges}>
                      {med.timing.map((t) => (
                        <View key={t} style={styles.timeBadge}>
                          <Text style={styles.timeBadgeText}>{t}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.infoIconBtn}
                  onPress={() => setSelectedMed(med)}
                >
                  <Ionicons name="information-circle-outline" size={22} color="#0D9488" />
                </TouchableOpacity>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>

      {/* Floating Add Button */}
      <TouchableOpacity
        style={styles.fabBtn}
        onPress={() => setAddModalOpen(true)}
        activeOpacity={0.85}
      >
        <Ionicons name="add" size={24} color="#FFFFFF" />
        <Text style={styles.fabBtnText}>
          {language === 'hi' ? 'दवाई जोड़ें' : 'Add Medicine'}
        </Text>
      </TouchableOpacity>

      <MedicineModal
        visible={isAddModalOpen}
        onClose={() => setAddModalOpen(false)}
      />

      <MedicineDetailSheet
        medication={selectedMed}
        visible={Boolean(selectedMed)}
        onClose={() => setSelectedMed(null)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#030712',
  },
  topBar: {
    padding: 16,
    paddingBottom: 8,
    backgroundColor: '#0B132B',
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 42,
    marginBottom: 10,
  },
  searchInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 14,
    marginLeft: 8,
  },
  filterScroll: {
    marginHorizontal: -16,
  },
  filterRow: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#334155',
  },
  filterChipActive: {
    backgroundColor: '#0D9488',
    borderColor: '#0D9488',
  },
  filterChipText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '600',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  listContent: {
    padding: 16,
    paddingBottom: 90,
    gap: 12,
  },
  emptyState: {
    alignItems: 'center',
    marginTop: 60,
    paddingHorizontal: 30,
  },
  emptyTitle: {
    color: '#F8FAFC',
    fontSize: 16,
    fontWeight: '700',
    marginTop: 12,
  },
  emptySubtitle: {
    color: '#64748B',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 18,
  },
  medCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#1E293B',
    padding: 14,
  },
  medCardLeft: {
    flexDirection: 'row',
    flex: 1,
    marginRight: 10,
  },
  medIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(13, 148, 136, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  medInfo: {
    flex: 1,
  },
  medName: {
    color: '#F8FAFC',
    fontSize: 15,
    fontWeight: '700',
  },
  medDosage: {
    color: '#0D9488',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  medInstructions: {
    color: '#94A3B8',
    fontSize: 11,
    marginTop: 2,
  },
  timingBadges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 8,
  },
  timeBadge: {
    backgroundColor: '#1E293B',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#334155',
  },
  timeBadgeText: {
    color: '#CBD5E1',
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  infoIconBtn: {
    padding: 6,
  },
  fabBtn: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#0D9488',
    borderRadius: 30,
    paddingHorizontal: 18,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  fabBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});

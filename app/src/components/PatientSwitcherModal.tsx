import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRole } from '../context/RoleContext';

interface PatientSwitcherModalProps {
  visible: boolean;
  onClose: () => void;
}

export const PatientSwitcherModal: React.FC<PatientSwitcherModalProps> = ({
  visible,
  onClose,
}) => {
  const {
    linkedPatients,
    activePatientId,
    setActivePatientId,
  } = useRole();

  const handleSelect = (id: string | null) => {
    setActivePatientId(id);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <Ionicons name="people" size={20} color="#10B981" />
              <Text style={styles.title}>Switch Patient</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={20} color="#94A3B8" />
            </TouchableOpacity>
          </View>

          <Text style={styles.subtitle}>
            Select which linked patient's health records and medication schedule you wish to oversee.
          </Text>

          <FlatList
            data={linkedPatients}
            keyExtractor={(item) => item.userId}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="person-add-outline" size={32} color="#64748B" />
                <Text style={styles.emptyText}>No linked patients yet.</Text>
                <Text style={styles.emptySubtext}>
                  Ask the patient for their 6-digit invite code and link them via the Caregiver Link tab.
                </Text>
              </View>
            }
            renderItem={({ item }) => {
              const isSelected = activePatientId === item.userId;
              return (
                <TouchableOpacity
                  style={[styles.patientCard, isSelected && styles.patientCardActive]}
                  onPress={() => handleSelect(item.userId)}
                  activeOpacity={0.7}
                >
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>
                      {item.name.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.patientInfo}>
                    <Text style={styles.patientName}>{item.name}</Text>
                    <Text style={styles.patientStats}>
                      {item.medicineCount} Medicines • {item.adherencePercent}% Adherence
                    </Text>
                  </View>
                  {isSelected && (
                    <Ionicons name="checkmark-circle" size={22} color="#10B981" />
                  )}
                </TouchableOpacity>
              );
            }}
          />

          {Boolean(activePatientId) && (
            <TouchableOpacity
              style={styles.exitBtn}
              onPress={() => handleSelect(null)}
            >
              <Text style={styles.exitBtnText}>Exit Patient View (Show Caregiver Hub)</Text>
            </TouchableOpacity>
          )}
        </Pressable>
      </Pressable>
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
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  closeBtn: {
    padding: 4,
  },
  subtitle: {
    color: '#94A3B8',
    fontSize: 13,
    marginBottom: 16,
    lineHeight: 18,
  },
  patientCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#1E293B',
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  patientCardActive: {
    borderColor: '#10B981',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#0D9488',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
  },
  patientInfo: {
    flex: 1,
  },
  patientName: {
    color: '#F8FAFC',
    fontSize: 15,
    fontWeight: '600',
  },
  patientStats: {
    color: '#94A3B8',
    fontSize: 12,
    marginTop: 2,
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 24,
  },
  emptyText: {
    color: '#CBD5E1',
    fontSize: 15,
    fontWeight: '600',
    marginTop: 8,
  },
  emptySubtext: {
    color: '#64748B',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 16,
  },
  exitBtn: {
    marginTop: 12,
    padding: 12,
    borderRadius: 10,
    backgroundColor: '#334155',
    alignItems: 'center',
  },
  exitBtnText: {
    color: '#F1F5F9',
    fontWeight: '600',
    fontSize: 13,
  },
});

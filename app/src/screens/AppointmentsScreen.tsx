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
import { collection, addDoc, onSnapshot, query, orderBy, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';
import { useActivePatient } from '../context/RoleContext';
import { useSettings } from '../context/SettingsContext';
import { SarvamService } from '../services/sarvamService';
import { Appointment } from '../types';

export const AppointmentsScreen: React.FC = () => {
  const { patientId } = useActivePatient();
  const { language } = useSettings();

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form fields
  const [doctorName, setDoctorName] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [hospital, setHospital] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState('10:00 AM');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!patientId) {
      setAppointments([]);
      setLoading(false);
      return;
    }

    const q = query(collection(db, `users/${patientId}/appointments`));
    const unsub = onSnapshot(
      q,
      (snapshot) => {
        const list: Appointment[] = [];
        snapshot.forEach((d) => {
          list.push({ id: d.id, ...(d.data() as any) });
        });
        list.sort((a, b) => a.date.localeCompare(b.date));
        setAppointments(list);
        setLoading(false);
      },
      (err) => {
        console.warn('Appointments error', err);
        setLoading(false);
      }
    );

    return unsub;
  }, [patientId]);

  const handleSave = async () => {
    if (!doctorName.trim() || !patientId) {
      Alert.alert('Required', "Please enter doctor's name.");
      return;
    }

    setSaving(true);
    try {
      await addDoc(collection(db, `users/${patientId}/appointments`), {
        patientId,
        doctorName: doctorName.trim(),
        specialty: specialty.trim() || 'General Physician',
        hospital: hospital.trim() || 'Clinic',
        date,
        time,
        notes: notes.trim(),
        createdAt: new Date().toISOString(),
      });

      // Clear form
      setDoctorName('');
      setSpecialty('');
      setHospital('');
      setNotes('');
      setIsModalOpen(false);
    } catch (e) {
      Alert.alert('Error', 'Failed to save appointment.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (id: string) => {
    Alert.alert('Delete', 'Delete this appointment?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          if (patientId) {
            await deleteDoc(doc(db, `users/${patientId}/appointments`, id));
          }
        },
      },
    ]);
  };

  const handleSpeakReminder = async (app: Appointment) => {
    const text =
      language === 'hi'
        ? `आपका अगला अपॉइंटमेंट डॉक्टर ${app.doctorName} के साथ ${app.hospital} में ${app.date} को सुबह ${app.time} बजे है।`
        : `Your next medical appointment is with Dr. ${app.doctorName} at ${app.hospital} on ${app.date} at ${app.time}.`;

    await SarvamService.textToSpeech(text, language, true);
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Doctor Appointments</Text>
          <Text style={styles.subtitle}>
            Upcoming clinic checkups and hospital appointments
          </Text>
        </View>

        {loading ? (
          <ActivityIndicator color="#0D9488" style={{ marginTop: 40 }} />
        ) : appointments.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="calendar-outline" size={40} color="#64748B" />
            <Text style={styles.emptyTitle}>No appointments scheduled</Text>
            <Text style={styles.emptySubtitle}>
              Tap the button below to add your next doctor consultation.
            </Text>
          </View>
        ) : (
          appointments.map((app) => (
            <View key={app.id} style={styles.appCard}>
              <View style={styles.dateBadge}>
                <Text style={styles.dateMonth}>
                  {new Date(app.date).toLocaleDateString('en-US', { month: 'short' })}
                </Text>
                <Text style={styles.dateDay}>
                  {new Date(app.date).getDate()}
                </Text>
              </View>

              <View style={styles.appInfo}>
                <Text style={styles.docName}>Dr. {app.doctorName}</Text>
                <Text style={styles.docSpecialty}>{app.specialty} • {app.hospital}</Text>
                <View style={styles.timeRow}>
                  <Ionicons name="time-outline" size={14} color="#0D9488" />
                  <Text style={styles.timeText}>{app.time}</Text>
                </View>
                {Boolean(app.notes) && (
                  <Text style={styles.notesText}>Note: {app.notes}</Text>
                )}
              </View>

              <View style={styles.actions}>
                <TouchableOpacity
                  onPress={() => handleSpeakReminder(app)}
                  style={styles.speakBtn}
                >
                  <Ionicons name="volume-high" size={18} color="#0D9488" />
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => handleDelete(app.id)}
                  style={styles.deleteBtn}
                >
                  <Ionicons name="trash-outline" size={18} color="#EF4444" />
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* Book New Appointment Button */}
      <TouchableOpacity
        style={styles.addBtn}
        onPress={() => setIsModalOpen(true)}
      >
        <Ionicons name="add" size={22} color="#FFFFFF" />
        <Text style={styles.addBtnText}>Schedule Appointment</Text>
      </TouchableOpacity>

      {/* Appointment Booking Modal */}
      {isModalOpen && (
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>New Appointment</Text>
              <TouchableOpacity onPress={() => setIsModalOpen(false)}>
                <Ionicons name="close" size={20} color="#94A3B8" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.label}>Doctor Name *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Dr. A. K. Sharma"
                placeholderTextColor="#64748B"
                value={doctorName}
                onChangeText={setDoctorName}
              />

              <Text style={styles.label}>Specialty</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Cardiologist, Diabetologist"
                placeholderTextColor="#64748B"
                value={specialty}
                onChangeText={setSpecialty}
              />

              <Text style={styles.label}>Hospital / Clinic</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. City Health Clinic"
                placeholderTextColor="#64748B"
                value={hospital}
                onChangeText={setHospital}
              />

              <Text style={styles.label}>Date (YYYY-MM-DD)</Text>
              <TextInput
                style={styles.input}
                placeholder="2026-10-25"
                placeholderTextColor="#64748B"
                value={date}
                onChangeText={setDate}
              />

              <Text style={styles.label}>Time</Text>
              <TextInput
                style={styles.input}
                placeholder="10:30 AM"
                placeholderTextColor="#64748B"
                value={time}
                onChangeText={setTime}
              />

              <Text style={styles.label}>Notes</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Bring fasting blood sugar reports"
                placeholderTextColor="#64748B"
                value={notes}
                onChangeText={setNotes}
              />
            </ScrollView>

            <View style={styles.footerRow}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setIsModalOpen(false)}
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.saveBtn}
                onPress={handleSave}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.saveText}>Save</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#030712',
  },
  content: {
    padding: 16,
    paddingBottom: 80,
  },
  header: {
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#F8FAFC',
  },
  subtitle: {
    color: '#94A3B8',
    fontSize: 13,
    marginTop: 2,
  },
  emptyCard: {
    backgroundColor: '#0F172A',
    borderRadius: 14,
    padding: 30,
    alignItems: 'center',
    marginTop: 20,
  },
  emptyTitle: {
    color: '#F8FAFC',
    fontSize: 16,
    fontWeight: '700',
    marginTop: 10,
  },
  emptySubtitle: {
    color: '#64748B',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
  },
  appCard: {
    flexDirection: 'row',
    backgroundColor: '#0F172A',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#1E293B',
    padding: 14,
    marginBottom: 12,
    alignItems: 'center',
  },
  dateBadge: {
    width: 48,
    height: 52,
    borderRadius: 10,
    backgroundColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  dateMonth: {
    color: '#0D9488',
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  dateDay: {
    color: '#F8FAFC',
    fontSize: 16,
    fontWeight: '800',
  },
  appInfo: {
    flex: 1,
  },
  docName: {
    color: '#F8FAFC',
    fontSize: 15,
    fontWeight: '700',
  },
  docSpecialty: {
    color: '#94A3B8',
    fontSize: 12,
    marginTop: 1,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  timeText: {
    color: '#0D9488',
    fontSize: 12,
    fontWeight: '600',
  },
  notesText: {
    color: '#64748B',
    fontSize: 11,
    marginTop: 4,
  },
  actions: {
    flexDirection: 'column',
    gap: 10,
  },
  speakBtn: {
    padding: 6,
    backgroundColor: 'rgba(13, 148, 136, 0.15)',
    borderRadius: 8,
  },
  deleteBtn: {
    padding: 6,
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderRadius: 8,
  },
  addBtn: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#0D9488',
    borderRadius: 30,
    paddingHorizontal: 20,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  },
  addBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  modalBackdrop: {
    position: 'absolute',
    inset: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
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
    marginBottom: 16,
  },
  sheetTitle: {
    color: '#F8FAFC',
    fontSize: 18,
    fontWeight: '700',
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
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#334155',
    color: '#FFFFFF',
    paddingHorizontal: 12,
    height: 44,
    fontSize: 14,
  },
  footerRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
  },
  cancelBtn: {
    flex: 1,
    backgroundColor: '#334155',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  cancelText: {
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
  saveText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});

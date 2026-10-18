import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  collection,
  addDoc,
  doc,
  setDoc,
  onSnapshot,
  deleteDoc,
  updateDoc,
} from 'firebase/firestore';
import { db } from '../firebase';
import { useActivePatient } from './RoleContext';
import { Medication, DoseLog, MedDocument } from '../types';

interface MedicationContextType {
  medications: Medication[];
  logs: Record<string, Record<string, DoseLog>>;
  documents: MedDocument[];
  addMedication: (med: Omit<Medication, 'id'>) => Promise<void>;
  deleteMedication: (id: string) => Promise<void>;
  updateMedication: (med: Medication) => Promise<void>;
  toggleDose: (
    date: string,
    medId: string,
    slot: 'morning' | 'afternoon' | 'evening' | 'night'
  ) => Promise<void>;
  addDocument: (docData: Omit<MedDocument, 'id'>) => Promise<void>;
  deleteDocument: (id: string) => Promise<void>;
  streak: number;
  adherenceRate: number;
  loading: boolean;
}

const MedicationContext = createContext<MedicationContextType | undefined>(undefined);

export const MedicationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { patientId, isOwnData } = useActivePatient();
  const [medications, setMedications] = useState<Medication[]>([]);
  const [logs, setLogs] = useState<Record<string, Record<string, DoseLog>>>({});
  const [documents, setDocuments] = useState<MedDocument[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!patientId) {
      setMedications([]);
      setLogs({});
      setDocuments([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    // 1. Subscribe to medications
    const medsUnsub = onSnapshot(
      collection(db, `users/${patientId}/medications`),
      (snapshot) => {
        const meds: Medication[] = [];
        snapshot.forEach((d) => {
          meds.push({ id: d.id, ...(d.data() as Omit<Medication, 'id'>) });
        });
        setMedications(meds);
        setLoading(false);
      },
      (err) => {
        console.warn('Medications listener error', err);
        setLoading(false);
      }
    );

    // 2. Subscribe to logs
    const logsUnsub = onSnapshot(
      collection(db, `users/${patientId}/logs`),
      (snapshot) => {
        const allLogs: Record<string, Record<string, DoseLog>> = {};
        snapshot.forEach((d) => {
          allLogs[d.id] = d.data() as Record<string, DoseLog>;
        });
        setLogs(allLogs);
      },
      (err) => console.warn('Logs listener error', err)
    );

    // 3. Subscribe to documents
    const docsUnsub = onSnapshot(
      collection(db, `users/${patientId}/documents`),
      (snapshot) => {
        const docsList: MedDocument[] = [];
        snapshot.forEach((d) => {
          docsList.push({ id: d.id, ...(d.data() as Omit<MedDocument, 'id'>) });
        });
        setDocuments(docsList);
      },
      (err) => console.warn('Documents listener error', err)
    );

    return () => {
      medsUnsub();
      logsUnsub();
      docsUnsub();
    };
  }, [patientId]);

  const addMedication = async (med: Omit<Medication, 'id'>) => {
    if (!patientId) return;
    await addDoc(collection(db, `users/${patientId}/medications`), med);
  };

  const updateMedication = async (med: Medication) => {
    if (!patientId) return;
    const { id, ...data } = med;
    await updateDoc(doc(db, `users/${patientId}/medications`, id), data);
  };

  const deleteMedication = async (id: string) => {
    if (!patientId) return;
    await deleteDoc(doc(db, `users/${patientId}/medications`, id));
  };

  const toggleDose = async (
    date: string,
    medId: string,
    slot: 'morning' | 'afternoon' | 'evening' | 'night'
  ) => {
    if (!patientId) return;
    const med = medications.find((m) => m.id === medId);
    if (!med) return;

    const currentDayLog = logs[date] || {};
    const key = `${medId}_${slot}`;
    const currentEntry = currentDayLog[key];
    const newTaken = !currentEntry?.taken;

    const updatedSlot: DoseLog = {
      medId,
      medName: med.name,
      dosage: med.dosage,
      timeSlot: slot,
      taken: newTaken,
      takenAt: newTaken ? new Date().toISOString() : undefined,
    };

    await setDoc(
      doc(db, `users/${patientId}/logs`, date),
      {
        ...currentDayLog,
        [key]: updatedSlot,
      },
      { merge: true }
    );
  };

  const addDocument = async (docData: Omit<MedDocument, 'id'>) => {
    if (!patientId) return;
    await addDoc(collection(db, `users/${patientId}/documents`), {
      ...docData,
      uploadedAt: new Date().toISOString(),
    });
  };

  const deleteDocument = async (id: string) => {
    if (!patientId) return;
    await deleteDoc(doc(db, `users/${patientId}/documents`, id));
  };

  // Streak & Adherence computation
  let totalDoses7Days = 0;
  let takenDoses7Days = 0;
  let currentStreak = 0;
  const today = new Date();

  // Streak calculation
  for (let i = 0; i < 30; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const dayLog = logs[dateStr] || {};
    
    // Total scheduled doses for day
    let scheduledCount = 0;
    let takenCount = 0;
    medications.forEach((m) => {
      m.timing.forEach((slot) => {
        scheduledCount++;
        if (dayLog[`${m.id}_${slot}`]?.taken) {
          takenCount++;
        }
      });
    });

    if (scheduledCount > 0 && takenCount === scheduledCount) {
      currentStreak++;
    } else if (i > 0 && scheduledCount > 0) {
      break;
    }
  }

  // 7-day adherence
  for (let i = 0; i < 7; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const dayLog = logs[dateStr] || {};

    medications.forEach((m) => {
      m.timing.forEach((slot) => {
        totalDoses7Days++;
        if (dayLog[`${m.id}_${slot}`]?.taken) {
          takenDoses7Days++;
        }
      });
    });
  }

  const adherenceRate = totalDoses7Days > 0 ? Math.round((takenDoses7Days / totalDoses7Days) * 100) : 100;

  return (
    <MedicationContext.Provider
      value={{
        medications,
        logs,
        documents,
        addMedication,
        deleteMedication,
        updateMedication,
        toggleDose,
        addDocument,
        deleteDocument,
        streak: currentStreak,
        adherenceRate,
        loading,
      }}
    >
      {children}
    </MedicationContext.Provider>
  );
};

export const useMedication = () => {
  const ctx = useContext(MedicationContext);
  if (!ctx) throw new Error('useMedication must be used within MedicationProvider');
  return ctx;
};

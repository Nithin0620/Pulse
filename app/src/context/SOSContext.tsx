import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  collection,
  doc,
  onSnapshot,
  query,
  where,
  orderBy,
  updateDoc,
  addDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../firebase';
import { useFirebase } from './FirebaseContext';
import { useRole } from './RoleContext';
import { SosEvent, SosStatus } from '../types';

interface SOSContextType {
  pendingSosEvents: SosEvent[];
  allSosEvents: SosEvent[];
  unacknowledgedCount: number;
  acknowledgeAlert: (id: string) => Promise<void>;
  resolveAlert: (id: string) => Promise<void>;
  triggerSOS: (payload: Partial<SosEvent>) => Promise<string>;
}

const SOSContext = createContext<SOSContextType | undefined>(undefined);

export const SOSProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useFirebase();
  const { role, linkedPatientIds } = useRole();
  const [allSosEvents, setAllSosEvents] = useState<SosEvent[]>([]);

  useEffect(() => {
    if (!user) {
      setAllSosEvents([]);
      return;
    }

    // Subscribe to sosEvents
    // If caregiver, listen for linked patients' alerts; if patient, listen for own alerts
    const sosCol = collection(db, 'sosEvents');
    const unsub = onSnapshot(sosCol, (snapshot) => {
      const events: SosEvent[] = [];
      snapshot.forEach((d) => {
        const data = d.data();
        // Filter based on user / caregiver relations
        if (
          (role === 'caregiver' && (linkedPatientIds.includes(data.patientId) || data.caregiverId === user.uid)) ||
          (role === 'patient' && data.patientId === user.uid) ||
          !role
        ) {
          events.push({
            id: d.id,
            patientId: data.patientId,
            patientName: data.patientName || 'Patient',
            caregiverId: data.caregiverId,
            timestamp: data.timestamp?.toDate ? data.timestamp.toDate() : new Date(),
            status: data.status || 'pending',
            urgencyScore: data.urgencyScore || 'HIGH',
            transcription: data.transcription || '',
            translatedText: data.translatedText || '',
            aiSummary: data.aiSummary || '',
            language: data.language || 'hi',
            audioBase64: data.audioBase64 || '',
            audioURL: data.audioURL || '',
            acknowledgedAt: data.acknowledgedAt,
            acknowledgedBy: data.acknowledgedBy,
          });
        }
      });
      // Sort newest first
      events.sort((a, b) => (b.timestamp?.getTime?.() || 0) - (a.timestamp?.getTime?.() || 0));
      setAllSosEvents(events);
    });

    return unsub;
  }, [user, role, linkedPatientIds]);

  const pendingSosEvents = allSosEvents.filter((e) => e.status === 'pending');
  const unacknowledgedCount = pendingSosEvents.length;

  const acknowledgeAlert = async (id: string) => {
    if (!user) return;
    await updateDoc(doc(db, 'sosEvents', id), {
      status: 'acknowledged' as SosStatus,
      acknowledgedAt: new Date().toISOString(),
      acknowledgedBy: user.uid,
    });
  };

  const resolveAlert = async (id: string) => {
    if (!user) return;
    await updateDoc(doc(db, 'sosEvents', id), {
      status: 'resolved' as SosStatus,
      resolvedAt: new Date().toISOString(),
      resolvedBy: user.uid,
    });
  };

  const triggerSOS = async (payload: Partial<SosEvent>): Promise<string> => {
    if (!user) throw new Error('Not logged in');
    const ref = await addDoc(collection(db, 'sosEvents'), {
      patientId: user.uid,
      patientName: payload.patientName || user.displayName || user.email || 'Patient',
      status: 'pending',
      urgencyScore: payload.urgencyScore || 'HIGH',
      transcription: payload.transcription || 'Emergency SOS triggered',
      translatedText: payload.translatedText || 'Emergency SOS triggered',
      aiSummary: payload.aiSummary || 'Patient triggered an emergency SOS alert.',
      language: payload.language || 'en',
      audioBase64: payload.audioBase64 || '',
      audioURL: payload.audioURL || '',
      timestamp: serverTimestamp(),
    });
    return ref.id;
  };

  return (
    <SOSContext.Provider
      value={{
        pendingSosEvents,
        allSosEvents,
        unacknowledgedCount,
        acknowledgeAlert,
        resolveAlert,
        triggerSOS,
      }}
    >
      {children}
    </SOSContext.Provider>
  );
};

export const useSOS = () => {
  const ctx = useContext(SOSContext);
  if (!ctx) throw new Error('useSOS must be used within SOSProvider');
  return ctx;
};

import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { doc, onSnapshot, setDoc, getDoc, collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { useFirebase } from './FirebaseContext';
import { UserProfile, UserRole } from '../types';

export interface LinkedPatientRow {
  userId: string;
  name: string;
  email?: string;
  adherencePercent: number;
  medicineCount: number;
}

interface RoleContextType {
  role: UserRole | null;
  profile: UserProfile | null;
  profileLoading: boolean;
  linkedPatientIds: string[];
  linkedCaregiverIds: string[];
  linkedPatients: LinkedPatientRow[];
  activePatientId: string | null;
  activePatientName: string | null;
  setActivePatientId: (id: string | null) => void;
  saveRole: (role: UserRole) => Promise<void>;
  savePersonalDetails: (patch: Partial<UserProfile>) => Promise<void>;
  refreshLinkedPatients: () => Promise<void>;
}

const RoleContext = createContext<RoleContextType | undefined>(undefined);

export const RoleProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useFirebase();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [activePatientId, setActivePatientId] = useState<string | null>(null);
  const [linkedPatients, setLinkedPatients] = useState<LinkedPatientRow[]>([]);

  useEffect(() => {
    if (!user) {
      setProfile(null);
      setProfileLoading(false);
      return;
    }

    const unsub = onSnapshot(doc(db, 'users', user.uid), (snap) => {
      if (snap.exists()) {
        const data = snap.data() as UserProfile;
        setProfile({ ...data, id: snap.id });
      } else {
        setProfile(null);
      }
      setProfileLoading(false);
    });

    return unsub;
  }, [user]);

  const refreshLinkedPatients = async () => {
    if (!profile || profile.role !== 'caregiver' || !profile.linkedPatientIds?.length) {
      setLinkedPatients([]);
      return;
    }

    try {
      const rows: LinkedPatientRow[] = [];
      for (const pId of profile.linkedPatientIds) {
        const pSnap = await getDoc(doc(db, 'users', pId));
        if (pSnap.exists()) {
          const pData = pSnap.data();
          const name = pData.fullName || pData.displayName || pData.email || 'Linked Patient';
          rows.push({
            userId: pId,
            name,
            email: pData.email,
            adherencePercent: 85,
            medicineCount: 3,
          });
        }
      }
      setLinkedPatients(rows);
    } catch (e) {
      console.warn('Failed to load linked patients', e);
    }
  };

  useEffect(() => {
    if (profile?.role === 'caregiver') {
      refreshLinkedPatients();
    }
  }, [profile?.linkedPatientIds, profile?.role]);

  const activePatientName = useMemo(() => {
    if (!activePatientId) return null;
    const found = linkedPatients.find((p) => p.userId === activePatientId);
    return found ? found.name : 'Linked Patient';
  }, [activePatientId, linkedPatients]);

  const saveRole = async (r: UserRole) => {
    if (!user) return;
    await setDoc(doc(db, 'users', user.uid), { role: r }, { merge: true });
  };

  const savePersonalDetails = async (patch: Partial<UserProfile>) => {
    if (!user) return;
    await setDoc(doc(db, 'users', user.uid), patch, { merge: true });
  };

  return (
    <RoleContext.Provider
      value={{
        role: profile?.role || null,
        profile,
        profileLoading,
        linkedPatientIds: profile?.linkedPatientIds || [],
        linkedCaregiverIds: profile?.linkedCaregiverIds || [],
        linkedPatients,
        activePatientId,
        activePatientName,
        setActivePatientId,
        saveRole,
        savePersonalDetails,
        refreshLinkedPatients,
      }}
    >
      {children}
    </RoleContext.Provider>
  );
};

export const useRole = () => {
  const ctx = useContext(RoleContext);
  if (!ctx) throw new Error('useRole must be used within RoleProvider');
  return ctx;
};

export const useActivePatient = () => {
  const { user } = useFirebase();
  const { activePatientId, activePatientName, role } = useRole();

  if (role === 'caregiver' && activePatientId) {
    return {
      patientId: activePatientId,
      isOwnData: false,
      activePatientName,
    };
  }

  return {
    patientId: user?.uid || null,
    isOwnData: true,
    activePatientName: null,
  };
};

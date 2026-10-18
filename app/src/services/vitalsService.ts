import { collection, addDoc, onSnapshot, query, orderBy, limit } from 'firebase/firestore';
import { db } from '../firebase';
import { VitalRecord } from '../types';

export const VITAL_RANGES = {
  bp: {
    unit: 'mmHg',
    normalMin: 90,
    normalMax: 120,
    label: 'Blood Pressure',
    evaluate: (val: string | number) => {
      const parts = String(val).split('/');
      const sys = parseInt(parts[0], 10);
      if (isNaN(sys)) return 'Normal';
      if (sys > 140) return 'High';
      if (sys < 90) return 'Low';
      return 'Normal';
    },
  },
  sugar: {
    unit: 'mg/dL',
    normalMin: 70,
    normalMax: 140,
    label: 'Blood Glucose',
    evaluate: (val: string | number) => {
      const n = Number(val);
      if (isNaN(n)) return 'Normal';
      if (n > 140) return 'High';
      if (n < 70) return 'Low';
      return 'Normal';
    },
  },
  spo2: {
    unit: '%',
    normalMin: 95,
    normalMax: 100,
    label: 'Oxygen Saturation',
    evaluate: (val: string | number) => {
      const n = Number(val);
      if (isNaN(n)) return 'Normal';
      if (n < 94) return 'Low';
      return 'Normal';
    },
  },
  heartRate: {
    unit: 'bpm',
    normalMin: 60,
    normalMax: 100,
    label: 'Heart Rate',
    evaluate: (val: string | number) => {
      const n = Number(val);
      if (isNaN(n)) return 'Normal';
      if (n > 100) return 'High';
      if (n < 60) return 'Low';
      return 'Normal';
    },
  },
  temperature: {
    unit: '°F',
    normalMin: 97.0,
    normalMax: 99.0,
    label: 'Body Temp',
    evaluate: (val: string | number) => {
      const n = Number(val);
      if (isNaN(n)) return 'Normal';
      if (n > 99.5) return 'Fever';
      return 'Normal';
    },
  },
};

export class VitalsService {
  public static async recordVital(
    patientId: string,
    type: VitalRecord['type'],
    value: number | string,
    notes = ''
  ): Promise<void> {
    const range = VITAL_RANGES[type as keyof typeof VITAL_RANGES];
    await addDoc(collection(db, `users/${patientId}/vitals`), {
      patientId,
      type,
      value,
      unit: range?.unit || '',
      notes,
      timestamp: new Date().toISOString(),
    });
  }

  public static subscribeToVitals(
    patientId: string,
    onData: (records: VitalRecord[]) => void
  ) {
    const q = query(
      collection(db, `users/${patientId}/vitals`),
      orderBy('timestamp', 'desc'),
      limit(50)
    );

    return onSnapshot(
      q,
      (snap) => {
        const records: VitalRecord[] = [];
        snap.forEach((d) => {
          records.push({ id: d.id, ...(d.data() as any) });
        });
        onData(records);
      },
      (err) => console.warn('Vitals subscribe error', err)
    );
  }
}

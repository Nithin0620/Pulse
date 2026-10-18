export type UserRole = 'patient' | 'caregiver';

export type Gender = 'male' | 'female' | 'other' | 'prefer_not_to_say';
export type BloodGroup = 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';

export interface EmergencyContact {
  name: string;
  phone: string;
  relationship: string;
}

export interface UserProfile {
  id?: string;
  email?: string;
  role?: UserRole;
  phoneNumber?: string;
  fullName?: string;
  displayName?: string;
  dateOfBirth?: string;
  gender?: Gender;
  bloodGroup?: BloodGroup;
  primaryLanguage?: string;
  emergencyContacts?: EmergencyContact[];
  medicalConditions?: string[];
  allergies?: string[];
  linkedPatientIds?: string[];
  linkedCaregiverIds?: string[];
  activePatientId?: string | null;
  onboardingCompleted?: boolean;
  inviteCode?: string;
}

export interface Medication {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  timing: ('morning' | 'afternoon' | 'evening' | 'night')[];
  startDate?: string;
  instructions?: string;
  color?: string;
  reminder?: boolean;
}

export interface DoseLog {
  medId: string;
  medName: string;
  dosage: string;
  timeSlot: 'morning' | 'afternoon' | 'evening' | 'night';
  taken: boolean;
  takenAt?: string;
}

export interface MedDocument {
  id: string;
  name: string;
  type: 'prescription' | 'report' | 'summary';
  date: string;
  doctor: string;
  hospital: string;
  medicines: string[];
  fileUrl?: string;
  extractedText?: string;
  uploadedAt?: any;
}

export type SosStatus = 'pending' | 'acknowledged' | 'resolved';
export type UrgencyScore = 'HIGH' | 'MED' | 'LOW';

export interface SosEvent {
  id: string;
  patientId: string;
  patientName: string;
  caregiverId?: string;
  timestamp: any;
  status: SosStatus;
  urgencyScore: UrgencyScore;
  transcription: string;
  translatedText?: string;
  aiSummary: string;
  language: string;
  audioBase64?: string;
  audioURL?: string;
  acknowledgedAt?: any;
  acknowledgedBy?: string | null;
}

export interface VitalRecord {
  id?: string;
  patientId: string;
  timestamp: any;
  type: 'bp' | 'sugar' | 'spo2' | 'heartRate' | 'temperature' | 'weight';
  value: number | string;
  unit: string;
  notes?: string;
}

export interface Appointment {
  id: string;
  patientId: string;
  doctorName: string;
  hospital: string;
  date: string;
  time: string;
  notes?: string;
  specialty?: string;
  reminderSent?: boolean;
}

export interface NearbyPlace {
  id: string;
  name: string;
  type: 'hospital' | 'clinic' | 'pharmacy';
  lat: number;
  lon: number;
  address?: string;
  phone?: string;
  distanceKm?: number;
}

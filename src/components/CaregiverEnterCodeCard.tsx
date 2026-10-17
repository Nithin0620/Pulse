import React, { useState } from 'react';
import {
  arrayUnion,
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import { db } from '../firebase';
import { useFirebase } from '../context/FirebaseContext';
import { useRole } from '../context/RoleContext';
import { useSettings } from '../context/SettingsContext';
import {
  Key01Icon,
  CheckmarkCircle02Icon,
  AlertCircleIcon,
  Loading03Icon,
  ArrowRight01Icon,
  UserGroupIcon,
} from 'hugeicons-react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';

export const CaregiverEnterCodeCard: React.FC = () => {
  const { user } = useFirebase();
  const { profile, refreshLinkedPatients } = useRole();
  const { language } = useSettings();

  const [code, setCode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setError(null);
    setSuccess(null);

    const cleaned = code.trim().toUpperCase();
    if (cleaned.length !== 6) {
      setError(
        language === 'hi'
          ? 'कोड 6 अक्षर का होना चाहिए।'
          : 'Invite code must be 6 characters.'
      );
      return;
    }
    if (!user) return;

    setSubmitting(true);
    try {
      const matchId = cleaned;
      const linkRef = doc(db, `caregiverLinks/${matchId}`);
      const linkSnap = await getDoc(linkRef);

      if (!linkSnap.exists()) {
        setError(
          language === 'hi'
            ? 'अमान्य कोड। कृपया दोबारा जाँचें।'
            : 'Invalid invite code. Please check and try again.'
        );
        return;
      }

      const linkData = linkSnap.data() as any;
      const patientId = linkData.patientId;

      if (patientId === user.uid) {
        setError(
          language === 'hi'
            ? 'आप अपने ही कोड का उपयोग नहीं कर सकते।'
            : 'You cannot link your own invite code.'
        );
        return;
      }

      let patientName = 'Patient';
      try {
        const patientSnap = await getDoc(doc(db, `users/${patientId}`));
        if (patientSnap.exists()) {
          const p = patientSnap.data() as any;
          patientName =
            p.fullName || p.displayName || p.phoneNumber || 'Patient';
        }
      } catch {}

      const caregiverName =
        profile?.fullName || profile?.displayName || user.email || 'Caregiver';

      await updateDoc(doc(db, `caregiverLinks/${matchId}`), {
        caregiverId: user.uid,
        caregiverName,
        status: 'active',
        linkedAt: serverTimestamp(),
      });

      await setDoc(
        doc(db, `users/${user.uid}`),
        {
          linkedPatientIds: arrayUnion(patientId),
        } as any,
        { merge: true }
      );
      await setDoc(
        doc(db, `users/${patientId}`),
        {
          linkedCaregiverIds: arrayUnion(user.uid),
        } as any,
        { merge: true }
      );

      setSuccess(
        language === 'hi'
          ? `${patientName} से जुड़ गए! बाएँ साइडबार से उन्हें चुनें।`
          : `Linked to ${patientName}! Open the patient switcher to view their dashboard.`
      );
      setCode('');
      refreshLinkedPatients();
    } catch (err: any) {
      console.error('link by code failed', err);
      setError(err?.message || 'Could not link the patient.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card className="p-4">
      <div className="flex items-center gap-2.5 mb-3">
        <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
          <Key01Icon size={16} />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-foreground">
            {language === 'hi' ? 'मरीज़ से जुड़ें' : 'Link a Patient'}
          </h3>
          <p className="text-xs text-muted-foreground">
            {language === 'hi'
              ? 'मरीज़ से 6-अक्षर का इनवाइट कोड लें और यहाँ डालें।'
              : 'Enter the 6-character patient invite code from their PULSE app.'}
          </p>
        </div>
      </div>

      {error && (
        <div className="mb-3 flex items-start gap-2 bg-destructive/10 border border-destructive/20 rounded-lg p-2.5 text-xs text-destructive">
          <AlertCircleIcon size={14} className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {success && (
        <div className="mb-3 flex items-start gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-2.5 text-xs text-emerald-600 dark:text-emerald-400">
          <CheckmarkCircle02Icon size={14} className="mt-0.5 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2">
        <Input
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase().slice(0, 6))}
          placeholder="A8B7C2"
          autoComplete="one-time-code"
          maxLength={6}
          className="flex-1 text-center font-mono tracking-[0.3em] uppercase text-sm h-9"
        />
        <Button
          type="submit"
          disabled={submitting || code.trim().length !== 6}
          size="sm"
          className="gap-1.5"
        >
          {submitting ? (
            <>
              <Loading03Icon size={14} className="animate-spin" />
              <span>Linking…</span>
            </>
          ) : (
            <>
              <span>{language === 'hi' ? 'मरीज़ जोड़ें' : 'Link Patient'}</span>
              <ArrowRight01Icon size={14} />
            </>
          )}
        </Button>
      </form>

      <div className="flex items-center gap-1.5 mt-2.5 text-[11px] text-muted-foreground">
        <UserGroupIcon size={13} />
        <span>
          {language === 'hi'
            ? `अभी ${profile?.linkedPatientIds?.length || 0} मरीज़ जुड़े हुए।`
            : `${profile?.linkedPatientIds?.length || 0} patients currently linked.`}
        </span>
      </div>
    </Card>
  );
};

export default CaregiverEnterCodeCard;

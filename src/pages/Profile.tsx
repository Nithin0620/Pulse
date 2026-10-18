import React from 'react';
import { useRole, computeAge } from '../context/RoleContext';
import { useFirebase } from '../context/FirebaseContext';
import { useSettings } from '../context/SettingsContext';
import PersonalDetailsForm from '../components/PersonalDetailsForm';
import { ConsentDashboard } from '../components/ConsentDashboard';
import { Loading03Icon, UserCircleIcon } from 'hugeicons-react';
import { Card } from '../components/ui/card';
import { Badge } from '../components/ui/badge';

export const Profile: React.FC = () => {
  const { user } = useFirebase();
  const { role, profile, profileLoading, savePersonalDetails } = useRole();
  const { language } = useSettings();

  if (profileLoading || !role) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center text-muted-foreground">
        <div className="flex items-center gap-2.5 text-xs">
          <Loading03Icon size={18} className="animate-spin text-teal-600 dark:text-teal-400" />
          <span>
            {language === 'hi' ? 'प्रोफ़ाइल लोड हो रही है…' : 'Loading profile…'}
          </span>
        </div>
      </div>
    );
  }

  const age = computeAge(profile?.dateOfBirth);
  const displayedName =
    profile?.fullName || profile?.displayName || user?.email || 'PULSE User';
  const initial = displayedName.charAt(0).toUpperCase();

  return (
    <div className="space-y-6 max-w-3xl mx-auto pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="w-14 h-14 rounded-full bg-teal-600 text-white flex items-center justify-center text-xl font-semibold shrink-0">
          {initial}
        </div>
        <div className="min-w-0">
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground flex items-center gap-2">
            <UserCircleIcon size={26} className="text-teal-600 dark:text-teal-400 shrink-0" />
            <span className="truncate">
              {language === 'hi' ? 'मेरी प्रोफ़ाइल' : 'My Profile'}
            </span>
          </h1>
          <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground truncate">
            <span className="font-medium text-foreground">{displayedName}</span>
            {age != null && (
              <span>
                • {language === 'hi' ? `${age} साल` : `${age} yrs`}
              </span>
            )}
            <span>•</span>
            <Badge variant="outline" className="text-[10px] uppercase font-semibold text-teal-700 dark:text-teal-300 border-teal-500/30">
              {role === 'patient'
                ? language === 'hi'
                  ? 'मरीज़'
                  : 'Patient'
                : language === 'hi'
                ? 'केयरगिवर'
                : 'Caregiver'}
            </Badge>
          </div>
          <p className="text-[11px] text-muted-foreground mt-0.5 truncate">{user?.email}</p>
        </div>
      </div>

      <Card className="bg-teal-50/40 dark:bg-teal-950/20 border-teal-500/20 p-3.5">
        <p className="text-xs text-muted-foreground leading-relaxed">
          {language === 'hi'
            ? 'यह जानकारी आपकी रिपोर्ट, दवा सलाह और आपात स्थिति में काम आती है। यहाँ कभी भी बदला जा सकता है।'
            : role === 'patient'
            ? 'These details flow into your adherence reports, dose recommendations, and the SOS pipeline. Keep them up to date.'
            : 'These details appear to linked patients and on emergency notifications you send on their behalf.'}
        </p>
      </Card>

      <PersonalDetailsForm
        role={role}
        initial={profile ?? undefined}
        submitLabel={language === 'hi' ? 'बदलाव सेव करें' : 'Save changes'}
        onSubmit={async (patch) => {
          await savePersonalDetails(patch);
        }}
      />

      {/* Privacy & AI Controls */}
      <div className="space-y-3">
        <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
          <span className="text-2xl">🛡️</span>
          {language === 'hi' ? 'गोपनीयता और AI नियंत्रण' : 'Privacy & AI Controls'}
        </h2>
        <p className="text-sm text-muted-foreground">
          {language === 'hi'
            ? 'PULSE आपकी निजी जानकारी को क्लाउड भेजने से पहले सुरक्षित करता है। यहाँ AI सुविधाओं को कस्टमाइज़ करें।'
            : 'PULSE protects your personal information before sending it to cloud AI. Customize AI features here.'}
        </p>
        <ConsentDashboard onSettingsChange={(newSettings) => {
          console.log('[Profile] Privacy settings changed:', newSettings);
        }} />
      </div>
    </div>
  );
};

export default Profile;

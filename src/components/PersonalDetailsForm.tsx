import React, { useMemo, useState } from 'react';
import {
  UserIcon,
  DropletIcon,
  AlertCircleIcon,
  Call02Icon,
  Activity01Icon,
  Loading03Icon,
  CheckmarkCircle02Icon,
  Add01Icon,
  Cancel01Icon,
} from 'hugeicons-react';

import {
  CONDITION_PRESETS,
  computeAge,
  type BloodGroup,
  type Gender,
  type UserProfile,
  type UserRole,
} from '../context/RoleContext';
import { useSettings } from '../context/SettingsContext';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';

interface PersonalDetailsFormProps {
  role: UserRole;
  initial?: Partial<UserProfile>;
  submitLabel?: string;
  onSubmit: (patch: Partial<UserProfile>) => Promise<void>;
  onCancel?: () => void;
}

const GENDER_OPTIONS: { value: Gender; en: string; hi: string }[] = [
  { value: 'male', en: 'Male', hi: 'पुरुष' },
  { value: 'female', en: 'Female', hi: 'महिला' },
  { value: 'other', en: 'Other', hi: 'अन्य' },
  { value: 'prefer_not_to_say', en: 'Prefer not to say', hi: 'नहीं बताना' },
];

const BLOOD_GROUPS: BloodGroup[] = [
  'A+',
  'A-',
  'B+',
  'B-',
  'AB+',
  'AB-',
  'O+',
  'O-',
];

const todayIso = () => new Date().toISOString().split('T')[0];

export const PersonalDetailsForm: React.FC<PersonalDetailsFormProps> = ({
  role,
  initial,
  submitLabel,
  onSubmit,
  onCancel,
}) => {
  const { language } = useSettings();
  const isHi = language === 'hi';
  const isPatient = role === 'patient';

  const [fullName, setFullName] = useState(initial?.fullName ?? '');
  const [dateOfBirth, setDateOfBirth] = useState(initial?.dateOfBirth ?? '');
  const [gender, setGender] = useState<Gender | ''>(initial?.gender ?? '');

  const [bloodGroup, setBloodGroup] = useState<BloodGroup | ''>(
    initial?.bloodGroup ?? ''
  );
  const [heightCm, setHeightCm] = useState<string>(
    initial?.heightCm != null ? String(initial.heightCm) : ''
  );
  const [weightKg, setWeightKg] = useState<string>(
    initial?.weightKg != null ? String(initial.weightKg) : ''
  );

  const [allergies, setAllergies] = useState<string[]>(initial?.allergies ?? []);
  const [allergyDraft, setAllergyDraft] = useState('');

  const [conditions, setConditions] = useState<string[]>(
    initial?.conditions ?? []
  );
  const [conditionsNotes, setConditionsNotes] = useState(
    initial?.conditionsNotes ?? ''
  );

  const [emergencyName, setEmergencyName] = useState(
    initial?.emergencyContact?.name ?? ''
  );
  const [emergencyPhone, setEmergencyPhone] = useState(
    initial?.emergencyContact?.phone ?? ''
  );
  const [emergencyRelationship, setEmergencyRelationship] = useState(
    initial?.emergencyContact?.relationship ?? ''
  );

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const age = useMemo(() => computeAge(dateOfBirth), [dateOfBirth]);

  const toggleCondition = (label: string) => {
    setConditions((prev) =>
      prev.includes(label) ? prev.filter((c) => c !== label) : [...prev, label]
    );
  };

  const addAllergyFromDraft = () => {
    const cleaned = allergyDraft.trim();
    if (!cleaned) return;
    if (allergies.some((a) => a.toLowerCase() === cleaned.toLowerCase())) {
      setAllergyDraft('');
      return;
    }
    setAllergies((prev) => [...prev, cleaned]);
    setAllergyDraft('');
  };

  const removeAllergy = (a: string) => {
    setAllergies((prev) => prev.filter((x) => x !== a));
  };

  const handleAllergyKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addAllergyFromDraft();
    } else if (e.key === 'Backspace' && allergyDraft === '' && allergies.length) {
      setAllergies((prev) => prev.slice(0, -1));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!fullName.trim()) {
      setError(isHi ? 'कृपया अपना पूरा नाम डालें।' : 'Please enter your full name.');
      return;
    }
    if (!dateOfBirth) {
      setError(isHi ? 'जन्मतिथि चुनिए।' : 'Please select your date of birth.');
      return;
    }
    if (dateOfBirth > todayIso()) {
      setError(
        isHi ? 'जन्मतिथि भविष्य में नहीं हो सकती।' : 'Date of birth cannot be in the future.'
      );
      return;
    }
    if (age == null) {
      setError(isHi ? 'जन्मतिथि अमान्य है।' : 'That date of birth looks invalid.');
      return;
    }

    if (emergencyPhone && !/^\+?\d[\d\s-]{6,}$/.test(emergencyPhone.trim())) {
      setError(
        isHi
          ? 'आपातकालीन संपर्क नंबर सही नहीं लगता।'
          : 'That emergency contact phone number looks invalid.'
      );
      return;
    }

    const heightNum = heightCm.trim() ? Number(heightCm) : NaN;
    const weightNum = weightKg.trim() ? Number(weightKg) : NaN;
    if (heightCm.trim() && (Number.isNaN(heightNum) || heightNum <= 0 || heightNum > 280)) {
      setError(isHi ? 'ऊँचाई मान्य नहीं है।' : 'Height must be a positive number in centimetres.');
      return;
    }
    if (weightKg.trim() && (Number.isNaN(weightNum) || weightNum <= 0 || weightNum > 500)) {
      setError(isHi ? 'वज़न मान्य नहीं है।' : 'Weight must be a positive number in kilograms.');
      return;
    }

    if (allergyDraft.trim()) {
      addAllergyFromDraft();
    }

    const patch: Partial<UserProfile> = {
      fullName: fullName.trim(),
      dateOfBirth,
    };

    if (gender) patch.gender = gender as Gender;

    if (isPatient) {
      if (bloodGroup) patch.bloodGroup = bloodGroup as BloodGroup;
      if (!Number.isNaN(heightNum) && heightNum > 0) patch.heightCm = heightNum;
      if (!Number.isNaN(weightNum) && weightNum > 0) patch.weightKg = weightNum;
      patch.allergies = allergies;
      patch.conditions = conditions;
      patch.conditionsNotes = conditionsNotes.trim();
    }

    const ec = {
      name: emergencyName.trim(),
      phone: emergencyPhone.trim(),
      relationship: emergencyRelationship.trim(),
    };
    if (ec.name || ec.phone || ec.relationship) {
      patch.emergencyContact = ec;
    }

    setSubmitting(true);
    try {
      await onSubmit(patch);
      setSuccess(isHi ? 'विवरण सेव हो गया।' : 'Details saved.');
    } catch (err: any) {
      console.error('savePersonalDetails failed', err);
      setError(err?.message || 'Could not save your details. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Status banners */}
      {error && (
        <div
          className="flex items-center gap-2.5 bg-destructive/10 border border-destructive/20 rounded-md p-3 text-xs text-destructive animate-fade-in"
          role="alert"
        >
          <AlertCircleIcon size={16} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {success && (
        <div
          className="flex items-center gap-2.5 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-500/20 rounded-md p-3 text-xs text-emerald-800 dark:text-emerald-300 animate-fade-in"
          role="status"
        >
          <CheckmarkCircle02Icon size={16} className="shrink-0 text-emerald-600 dark:text-emerald-400" />
          <span>{success}</span>
        </div>
      )}

      {/* Core identity */}
      <Card>
        <CardHeader className="p-4 pb-2 border-b">
          <div className="flex items-center gap-2">
            <UserIcon size={16} className="text-teal-600 dark:text-teal-400" />
            <CardTitle className="text-xs uppercase tracking-wider font-semibold text-foreground">
              {isHi ? 'आपकी पहचान' : 'Personal Details'}
            </CardTitle>
          </div>
        </CardHeader>

        <CardContent className="p-4 space-y-3">
          <div className="space-y-1">
            <label htmlFor="pd-name" className="text-xs font-medium text-foreground">
              {isHi ? 'पूरा नाम' : 'Full name'} <span className="text-destructive">*</span>
            </label>
            <Input
              id="pd-name"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder={isHi ? 'जैसे: अनिल कुमार शर्मा' : 'e.g. Anil Kumar Sharma'}
              className="h-9 text-xs"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label htmlFor="pd-dob" className="text-xs font-medium text-foreground">
                {isHi ? 'जन्मतिथि' : 'Date of birth'} <span className="text-destructive">*</span>
              </label>
              <div className="relative">
                <Input
                  id="pd-dob"
                  type="date"
                  value={dateOfBirth}
                  max={todayIso()}
                  onChange={(e) => setDateOfBirth(e.target.value)}
                  className="h-9 text-xs"
                  required
                />
              </div>
              {age != null && (
                <div className="text-[11px] text-muted-foreground mt-0.5">
                  {isHi ? `उम्र: ${age} साल` : `Age: ${age} years`}
                </div>
              )}
            </div>

            <div className="space-y-1">
              <label htmlFor="pd-gender" className="text-xs font-medium text-foreground">
                {isHi ? 'लिंग' : 'Gender'}
              </label>
              <select
                id="pd-gender"
                value={gender}
                onChange={(e) => setGender(e.target.value as Gender | '')}
                className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">{isHi ? 'चुनें' : 'Select…'}</option>
                {GENDER_OPTIONS.map((g) => (
                  <option key={g.value} value={g.value}>
                    {isHi ? g.hi : g.en}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Patient-only medical basics */}
      {isPatient && (
        <Card>
          <CardHeader className="p-4 pb-2 border-b">
            <div className="flex items-center gap-2">
              <DropletIcon size={16} className="text-teal-600 dark:text-teal-400" />
              <CardTitle className="text-xs uppercase tracking-wider font-semibold text-foreground">
                {isHi ? 'मेडिकल जानकारी' : 'Clinical Telemetry'}
              </CardTitle>
            </div>
          </CardHeader>

          <CardContent className="p-4 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <label htmlFor="pd-blood" className="text-xs font-medium text-foreground">
                  {isHi ? 'ब्लड ग्रुप' : 'Blood group'}
                </label>
                <select
                  id="pd-blood"
                  value={bloodGroup}
                  onChange={(e) => setBloodGroup(e.target.value as BloodGroup | '')}
                  className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">{isHi ? 'चुनें' : 'Select…'}</option>
                  {BLOOD_GROUPS.map((bg) => (
                    <option key={bg} value={bg}>
                      {bg}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label htmlFor="pd-height" className="text-xs font-medium text-foreground">
                  {isHi ? 'ऊँचाई (सेमी)' : 'Height (cm)'}
                </label>
                <Input
                  id="pd-height"
                  type="number"
                  inputMode="decimal"
                  min={0}
                  max={280}
                  value={heightCm}
                  onChange={(e) => setHeightCm(e.target.value)}
                  placeholder="168"
                  className="h-9 text-xs"
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="pd-weight" className="text-xs font-medium text-foreground">
                  {isHi ? 'वज़न (किग्रा)' : 'Weight (kg)'}
                </label>
                <Input
                  id="pd-weight"
                  type="number"
                  inputMode="decimal"
                  min={0}
                  max={500}
                  value={weightKg}
                  onChange={(e) => setWeightKg(e.target.value)}
                  placeholder="72"
                  className="h-9 text-xs"
                />
              </div>
            </div>

            {/* Allergies */}
            <div className="space-y-1.5">
              <label htmlFor="pd-allergy" className="text-xs font-medium text-foreground">
                {isHi ? 'एलर्जी' : 'Allergies'}
              </label>
              {allergies.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-1.5">
                  {allergies.map((a) => (
                    <Badge
                      key={a}
                      variant="secondary"
                      className="gap-1 text-xs font-normal"
                    >
                      <span>{a}</span>
                      <button
                        type="button"
                        onClick={() => removeAllergy(a)}
                        className="text-muted-foreground hover:text-destructive cursor-pointer"
                      >
                        <Cancel01Icon size={12} />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
              <div className="flex gap-2">
                <Input
                  id="pd-allergy"
                  type="text"
                  value={allergyDraft}
                  onChange={(e) => setAllergyDraft(e.target.value)}
                  onKeyDown={handleAllergyKeyDown}
                  placeholder={isHi ? 'जैसे: पेनिसिलिन, मूँगफली' : 'e.g. Penicillin, Peanuts'}
                  className="h-9 text-xs"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addAllergyFromDraft}
                  disabled={!allergyDraft.trim()}
                  className="h-9 text-xs gap-1"
                >
                  <Add01Icon size={13} />
                  <span>{isHi ? 'जोड़ें' : 'Add'}</span>
                </Button>
              </div>
            </div>

            {/* Conditions */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-foreground">
                {isHi ? 'पुरानी बीमारियाँ' : 'Known conditions'}
              </label>
              <div className="flex flex-wrap gap-1.5">
                {CONDITION_PRESETS.map((c) => {
                  const active = conditions.includes(c);
                  return (
                    <button
                      key={c}
                      type="button"
                      onClick={() => toggleCondition(c)}
                      className={`rounded-full px-2.5 py-1 text-xs border transition-colors cursor-pointer ${
                        active
                          ? 'bg-teal-600 text-white border-teal-600'
                          : 'bg-background text-muted-foreground border-border hover:border-teal-500/40'
                      }`}
                    >
                      {c}
                    </button>
                  );
                })}
              </div>

              <div className="space-y-1 pt-1">
                <label htmlFor="pd-condition-notes" className="text-xs font-medium text-foreground">
                  {isHi ? 'अन्य विवरण (वैकल्पिक)' : 'Other clinical notes (optional)'}
                </label>
                <textarea
                  id="pd-condition-notes"
                  value={conditionsNotes}
                  onChange={(e) => setConditionsNotes(e.target.value)}
                  rows={2}
                  placeholder={
                    isHi
                      ? 'कोई और मेडिकल जानकारी जो डॉक्टर को बतानी हो...'
                      : 'Any additional context your caregiver or doctor should know…'
                  }
                  className="w-full rounded-md border border-input bg-background p-2.5 text-xs ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Emergency contact */}
      <Card>
        <CardHeader className="p-4 pb-2 border-b">
          <div className="flex items-center gap-2">
            <Activity01Icon size={16} className="text-rose-500" />
            <CardTitle className="text-xs uppercase tracking-wider font-semibold text-foreground">
              {isHi ? 'आपातकालीन संपर्क' : 'Emergency Contact'}
            </CardTitle>
          </div>
        </CardHeader>

        <CardContent className="p-4 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label htmlFor="pd-ec-name" className="text-xs font-medium text-foreground">
                {isHi ? 'नाम' : 'Name'}
              </label>
              <Input
                id="pd-ec-name"
                type="text"
                value={emergencyName}
                onChange={(e) => setEmergencyName(e.target.value)}
                placeholder={isHi ? 'जैसे: रीना शर्मा' : 'e.g. Reena Sharma'}
                className="h-9 text-xs"
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="pd-ec-relationship" className="text-xs font-medium text-foreground">
                {isHi ? 'रिश्ता' : 'Relationship'}
              </label>
              <Input
                id="pd-ec-relationship"
                type="text"
                value={emergencyRelationship}
                onChange={(e) => setEmergencyRelationship(e.target.value)}
                placeholder={isHi ? 'जैसे: पत्नी, बेटा' : 'e.g. Spouse, Son'}
                className="h-9 text-xs"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label htmlFor="pd-ec-phone" className="text-xs font-medium text-foreground">
              {isHi ? 'मोबाइल नंबर' : 'Phone'}
            </label>
            <div className="relative">
              <Call02Icon
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
              />
              <Input
                id="pd-ec-phone"
                type="tel"
                value={emergencyPhone}
                onChange={(e) => setEmergencyPhone(e.target.value)}
                placeholder="+91 98765 43210"
                className="pl-8 h-9 text-xs"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex items-center justify-end gap-2 pt-2">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onCancel}
            disabled={submitting}
            className="h-9 text-xs"
          >
            {isHi ? 'रद्द करें' : 'Cancel'}
          </Button>
        )}
        <Button
          type="submit"
          size="sm"
          disabled={submitting}
          className="h-9 text-xs bg-teal-600 hover:bg-teal-700 text-white gap-1.5"
        >
          {submitting ? (
            <Loading03Icon size={13} className="animate-spin" />
          ) : (
            <CheckmarkCircle02Icon size={14} />
          )}
          <span>{submitLabel || (isHi ? 'सेव करें और जारी रखें' : 'Save & Continue')}</span>
        </Button>
      </div>
    </form>
  );
};

export default PersonalDetailsForm;

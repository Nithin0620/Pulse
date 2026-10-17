import React, { useEffect, useMemo, useRef, useState } from 'react';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { db } from '../firebase';
import { useFirebase } from '../context/FirebaseContext';
import { useRole, useActivePatient } from '../context/RoleContext';
import { useMedication } from '../context/MedicationContext';
import { useSettings } from '../context/SettingsContext';
import { NotificationService } from '../services/notificationService';
import {
  appointmentsPath,
  cancelAppointment,
  createAppointment,
  deleteAppointment,
  markAppointmentComplete,
  parseAppointmentDoc,
  setLinkedDocuments,
  type Appointment,
} from '../services/appointmentService';
import {
  CalendarCheckIn01Icon,
  CalendarAdd01Icon,
  Hospital01Icon,
  Clock01Icon,
  File01Icon,
  Notification01Icon,
  NotificationOff01Icon,
  CheckmarkCircle02Icon,
  Delete02Icon,
  Link01Icon,
  Cancel01Icon,
  ArrowDown01Icon,
  ArrowUp01Icon,
  Loading03Icon,
  AlertCircleIcon,
  StethoscopeIcon,
  UserGroupIcon,
  SparklesIcon,
  FloppyDiskIcon,
} from 'hugeicons-react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';

type FormDraft = {
  doctorName: string;
  specialty: string;
  hospitalName: string;
  date: string;
  time: string;
  notes: string;
  reminderSet: boolean;
};

const emptyDraft = (): FormDraft => ({
  doctorName: '',
  specialty: '',
  hospitalName: '',
  date: '',
  time: '',
  notes: '',
  reminderSet: true,
});

export const Appointments: React.FC = () => {
  const { user } = useFirebase();
  const { activePatientName } = useRole();
  const { patientId, isOwnData, isCaregiverViewing } = useActivePatient();
  const { documents } = useMedication();
  const { language } = useSettings();

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [draft, setDraft] = useState<FormDraft>(emptyDraft);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [expandedDocsFor, setExpandedDocsFor] = useState<string | null>(null);
  const [draftLinks, setDraftLinks] = useState<Record<string, string[]>>({});
  const [busyId, setBusyId] = useState<string | null>(null);

  const scheduledIdsRef = useRef<Set<string>>(new Set());

  /* ===== Localized strings (hi / ta / en) ===== */
  const t = (() => {
    if (language === 'hi') {
      return {
        title: 'अपॉइंटमेंट',
        subtitle: 'आगामी डॉक्टर अपॉइंटमेंट और इतिहास का प्रबंधन करें',
        addBtn: 'अपॉइंटमेंट जोड़ें',
        cancelBtn: 'रद्द करें',
        save: 'सहेजें',
        saving: 'सहेजा जा रहा है…',
        addingFor: 'के लिए जोड़ रहे हैं',
        formTitle: 'नई अपॉइंटमेंट',
        doctor: 'डॉक्टर का नाम',
        specialty: 'विशेषज्ञता',
        hospital: 'अस्पताल / क्लिनिक',
        date: 'तारीख',
        time: 'समय',
        notes: 'नोट्स',
        notesPh: 'कारण, तैयारी, आदि',
        reminder: 'अनुस्मारक — 24 घंटे पहले',
        upcoming: 'आगामी',
        past: 'पिछले',
        emptyUpcoming: 'कोई आगामी अपॉइंटमेंट नहीं',
        emptyPast: 'अब तक कोई इतिहास नहीं',
        markComplete: 'पूरा हुआ चिह्नित करें',
        linkDocs: 'दस्तावेज़ जोड़ें',
        hideDocs: 'छिपाएँ',
        saveLinks: 'लिंक सहेजें',
        delete: 'हटाएँ',
        confirmDelete: 'इस अपॉइंटमेंट को हटाएँ?',
        confirmCancel: 'इस अपॉइंटमेंट को रद्द करें?',
        statusCompleted: 'पूरा',
        statusCancelled: 'रद्द',
        statusMissed: 'छूटा',
        noDocs: 'कोई दस्तावेज़ अपलोड नहीं किया गया है। पहले Documents टैब में जाकर अपलोड करें।',
        linkedCount: (n: number) => `${n} दस्तावेज़ लिंक`,
        reminderOn: 'अनुस्मारक चालू',
        reminderOff: 'कोई अनुस्मारक नहीं',
        errRequired: 'डॉक्टर का नाम, तारीख और समय आवश्यक है।',
        errPast: 'तारीख / समय भविष्य में होना चाहिए।',
      };
    }
    if (language === 'ta') {
      return {
        title: 'சந்திப்புகள்',
        subtitle: 'வரவிருக்கும் மற்றும் கடந்த சந்திப்புகளை நிர்வகிக்கவும்',
        addBtn: 'சந்திப்பு சேர்',
        cancelBtn: 'ரத்து செய்',
        save: 'சேமி',
        saving: 'சேமிக்கப்படுகிறது…',
        addingFor: 'இவருக்காக சேர்க்கிறது',
        formTitle: 'புதிய சந்திப்பு',
        doctor: 'டாக்டர் பெயர்',
        specialty: 'சிறப்புத்துறை',
        hospital: 'மருத்துவமனை / கிளினிக்',
        date: 'தேதி',
        time: 'நேரம்',
        notes: 'குறிப்புகள்',
        notesPh: 'காரணம், தயாரிப்பு, முதலியன',
        reminder: 'நினைவூட்டல் — 24 மணி நேரம் முன்',
        upcoming: 'வரவிருப்பவை',
        past: 'கடந்தவை',
        emptyUpcoming: 'வரவிருக்கும் சந்திப்புகள் எதுவும் இல்லை',
        emptyPast: 'வரலாறு இன்னும் இல்லை',
        markComplete: 'முடிந்ததாகக் குறிக்கவும்',
        linkDocs: 'ஆவணங்களை இணை',
        hideDocs: 'மறை',
        saveLinks: 'இணைப்புகளைச் சேமி',
        delete: 'நீக்கு',
        confirmDelete: 'இந்த சந்திப்பை நீக்க வேண்டுமா?',
        confirmCancel: 'இந்த சந்திப்பை ரத்து செய்ய வேண்டுமா?',
        statusCompleted: 'முடிந்தது',
        statusCancelled: 'ரத்து',
        statusMissed: 'தவறிய',
        noDocs: 'ஆவணங்கள் இல்லை. முதலில் Documents தாவலில் பதிவேற்றவும்.',
        linkedCount: (n: number) => `${n} ஆவணங்கள் இணைக்கப்பட்டுள்ளன`,
        reminderOn: 'நினைவூட்டல் இயக்கப்பட்டது',
        reminderOff: 'நினைவூட்டல் இல்லை',
        errRequired: 'டாக்டர் பெயர், தேதி மற்றும் நேரம் தேவை.',
        errPast: 'தேதி / நேரம் எதிர்காலத்தில் இருக்க வேண்டும்.',
      };
    }
    return {
      title: 'Appointments',
      subtitle: 'Track upcoming and past doctor appointments',
      addBtn: 'Add Appointment',
      cancelBtn: 'Cancel',
      save: 'Save',
      saving: 'Saving…',
      addingFor: 'Adding for',
      formTitle: 'New Appointment',
      doctor: 'Doctor name',
      specialty: 'Specialty',
      hospital: 'Hospital / Clinic',
      date: 'Date',
      time: 'Time',
      notes: 'Notes',
      notesPh: 'Reason, preparation, etc.',
      reminder: 'Remind me 24 hours before',
      upcoming: 'Upcoming',
      past: 'Past',
      emptyUpcoming: 'No upcoming appointments yet',
      emptyPast: 'No past appointments yet',
      markComplete: 'Mark Complete',
      linkDocs: 'Link Documents',
      hideDocs: 'Hide',
      saveLinks: 'Save links',
      delete: 'Delete',
      confirmDelete: 'Delete this appointment?',
      confirmCancel: 'Cancel this appointment?',
      statusCompleted: 'Completed',
      statusCancelled: 'Cancelled',
      statusMissed: 'Missed',
      noDocs: 'No documents uploaded yet. Add some in the Documents tab first.',
      linkedCount: (n: number) => `${n} document${n === 1 ? '' : 's'} linked`,
      reminderOn: 'Reminder on',
      reminderOff: 'No reminder',
      errRequired: 'Doctor name, date and time are required.',
      errPast: 'The date and time must be in the future.',
    };
  })();

  /* ===== Live subscription ===== */
  useEffect(() => {
    if (!patientId) {
      setAppointments([]);
      setLoadingList(false);
      return;
    }
    setLoadingList(true);
    const unsub = onSnapshot(
      query(collection(db, appointmentsPath(patientId))),
      (snap) => {
        const rows: Appointment[] = [];
        snap.forEach((d) => {
          const parsed = parseAppointmentDoc(d);
          if (parsed) rows.push(parsed);
        });
        setAppointments(rows);
        setLoadingList(false);
      },
      (err) => {
        console.error('[Appointments] snapshot failed', err);
        setLoadingList(false);
      }
    );
    return () => unsub();
  }, [patientId]);

  /* ===== Reminder (re)scheduling on list/language change ===== */
  useEffect(() => {
    scheduledIdsRef.current.forEach((id) => {
      NotificationService.cancelAppointmentReminder(id);
    });
    scheduledIdsRef.current.clear();

    const nowMs = Date.now();
    appointments.forEach((apt) => {
      if (
        apt.status === 'upcoming' &&
        apt.reminderSet &&
        apt.appointmentDate.getTime() > nowMs
      ) {
        NotificationService.scheduleAppointmentReminder(
          {
            id: apt.id,
            doctorName: apt.doctorName,
            hospitalName: apt.hospitalName,
            appointmentDate: apt.appointmentDate,
          },
          language
        );
        scheduledIdsRef.current.add(apt.id);
      }
    });

    return () => {
      scheduledIdsRef.current.forEach((id) => {
        NotificationService.cancelAppointmentReminder(id);
      });
      scheduledIdsRef.current.clear();
    };
  }, [appointments, language]);

  /* ===== Bucketing ===== */
  const { upcoming, past } = useMemo(() => {
    const now = Date.now();
    const u: Appointment[] = [];
    const p: Appointment[] = [];
    appointments.forEach((a) => {
      if (a.status === 'upcoming' && a.appointmentDate.getTime() >= now) u.push(a);
      else p.push(a);
    });
    u.sort((a, b) => a.appointmentDate.getTime() - b.appointmentDate.getTime());
    p.sort((a, b) => b.appointmentDate.getTime() - a.appointmentDate.getTime());
    return { upcoming: u, past: p };
  }, [appointments]);

  /* ===== Form save ===== */
  const handleSave = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!user || !patientId) return;
    setFormError(null);

    if (!draft.doctorName.trim() || !draft.date || !draft.time) {
      setFormError(t.errRequired);
      return;
    }
    const combined = new Date(`${draft.date}T${draft.time}`);
    if (isNaN(combined.getTime())) {
      setFormError(t.errRequired);
      return;
    }
    if (combined.getTime() <= Date.now()) {
      setFormError(t.errPast);
      return;
    }

    setSaving(true);
    try {
      if (draft.reminderSet) {
        try {
          await NotificationService.requestPermission();
        } catch (err) {
          console.warn('Notification permission request failed', err);
        }
      }
      await createAppointment(patientId, user.uid, {
        doctorName: draft.doctorName.trim(),
        specialty: draft.specialty.trim(),
        hospitalName: draft.hospitalName.trim(),
        appointmentDate: combined,
        notes: draft.notes.trim(),
        reminderSet: draft.reminderSet,
      });
      setDraft(emptyDraft());
      setIsFormOpen(false);
    } catch (err: any) {
      console.error('[Appointments] save failed', err);
      setFormError(err?.message || 'Could not save the appointment.');
    } finally {
      setSaving(false);
    }
  };

  /* ===== Actions ===== */
  const handleMarkComplete = async (apt: Appointment) => {
    if (!patientId) return;
    setBusyId(apt.id);
    try {
      await markAppointmentComplete(patientId, apt.id);
      NotificationService.cancelAppointmentReminder(apt.id);
    } catch (err) {
      console.error('mark complete failed', err);
    } finally {
      setBusyId(null);
    }
  };

  const handleCancel = async (apt: Appointment) => {
    if (!patientId) return;
    if (!confirm(t.confirmCancel)) return;
    setBusyId(apt.id);
    try {
      await cancelAppointment(patientId, apt.id);
      NotificationService.cancelAppointmentReminder(apt.id);
    } catch (err) {
      console.error('cancel failed', err);
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (apt: Appointment) => {
    if (!patientId) return;
    if (!confirm(t.confirmDelete)) return;
    setBusyId(apt.id);
    try {
      await deleteAppointment(patientId, apt.id);
      NotificationService.cancelAppointmentReminder(apt.id);
    } catch (err) {
      console.error('delete failed', err);
    } finally {
      setBusyId(null);
    }
  };

  const handleSaveLinks = async (apt: Appointment) => {
    if (!patientId) return;
    const next = draftLinks[apt.id] ?? apt.linkedDocumentIds;
    setBusyId(apt.id);
    try {
      await setLinkedDocuments(patientId, apt.id, next);
      setExpandedDocsFor(null);
      setDraftLinks((prev) => {
        const { [apt.id]: _drop, ...rest } = prev;
        return rest;
      });
    } catch (err) {
      console.error('save links failed', err);
    } finally {
      setBusyId(null);
    }
  };

  const toggleLink = (aptId: string, docId: string, currentLinks: string[]) => {
    setDraftLinks((prev) => {
      const base = prev[aptId] ?? currentLinks;
      const exists = base.includes(docId);
      const next = exists ? base.filter((x) => x !== docId) : [...base, docId];
      return { ...prev, [aptId]: next };
    });
  };

  const toggleDocsPanel = (apt: Appointment) => {
    if (expandedDocsFor === apt.id) {
      setExpandedDocsFor(null);
      setDraftLinks((prev) => {
        const { [apt.id]: _drop, ...rest } = prev;
        return rest;
      });
    } else {
      setExpandedDocsFor(apt.id);
      setDraftLinks((prev) => ({ ...prev, [apt.id]: apt.linkedDocumentIds }));
    }
  };

  const formatWhen = (d: Date): string => {
    const locale =
      language === 'hi' ? 'hi-IN' : language === 'ta' ? 'ta-IN' : 'en-US';
    return d.toLocaleString(locale, {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderCard = (apt: Appointment, opts: { isPast: boolean }) => {
    const isExpanded = expandedDocsFor === apt.id;
    const linksDraft = draftLinks[apt.id] ?? apt.linkedDocumentIds;
    const linkedCount = apt.linkedDocumentIds.length;
    const isMissed =
      apt.status === 'upcoming' && apt.appointmentDate.getTime() < Date.now();
    const pastStatusTone =
      apt.status === 'completed'
        ? 'completed'
        : apt.status === 'cancelled'
        ? 'cancelled'
        : 'missed';

    return (
      <Card
        key={apt.id}
        className="flex flex-col justify-between hover:border-border/80 transition-all text-left"
      >
        <CardContent className="p-4 sm:p-5 space-y-3">
          {/* Top row — doctor + specialty + status badge */}
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <h3 className="text-sm sm:text-base font-semibold text-foreground">
                Dr. {apt.doctorName || '—'}
              </h3>
              {apt.specialty && (
                <div className="inline-flex items-center gap-1 text-teal-700 dark:text-teal-400 text-xs font-medium mt-0.5">
                  <StethoscopeIcon size={12} />
                  <span>{apt.specialty}</span>
                </div>
              )}
            </div>

            {opts.isPast ? (
              <Badge
                variant={
                  pastStatusTone === 'completed'
                    ? 'default'
                    : pastStatusTone === 'cancelled'
                    ? 'secondary'
                    : 'destructive'
                }
                className="text-[10px]"
              >
                {pastStatusTone === 'completed'
                  ? t.statusCompleted
                  : pastStatusTone === 'cancelled'
                  ? t.statusCancelled
                  : t.statusMissed}
              </Badge>
            ) : isMissed ? (
              <Badge variant="destructive" className="text-[10px] gap-1">
                <AlertCircleIcon size={11} />
                <span>{t.statusMissed}</span>
              </Badge>
            ) : null}
          </div>

          {/* Meta row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5 min-w-0">
              <Hospital01Icon size={14} className="shrink-0 text-teal-600 dark:text-teal-400" />
              <span className="truncate">{apt.hospitalName || '—'}</span>
            </div>
            <div className="flex items-center gap-1.5 min-w-0">
              <Clock01Icon size={14} className="shrink-0 text-teal-600 dark:text-teal-400" />
              <span className="truncate font-mono">{formatWhen(apt.appointmentDate)}</span>
            </div>
          </div>

          {/* Badges */}
          {(linkedCount > 0 || apt.reminderSet) && (
            <div className="flex flex-wrap gap-1.5">
              {linkedCount > 0 && (
                <Badge variant="outline" className="text-[10px] gap-1">
                  <File01Icon size={11} className="text-teal-600 dark:text-teal-400" />
                  <span>{t.linkedCount(linkedCount)}</span>
                </Badge>
              )}
              {apt.reminderSet && !opts.isPast ? (
                <Badge variant="outline" className="text-[10px] gap-1 text-emerald-700 dark:text-emerald-400 border-emerald-500/20">
                  <Notification01Icon size={11} />
                  <span>{t.reminderOn}</span>
                </Badge>
              ) : !apt.reminderSet && !opts.isPast ? (
                <Badge variant="outline" className="text-[10px] gap-1 text-muted-foreground">
                  <NotificationOff01Icon size={11} />
                  <span>{t.reminderOff}</span>
                </Badge>
              ) : null}
            </div>
          )}

          {/* Notes */}
          {apt.notes && (
            <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3 whitespace-pre-wrap bg-muted/30 p-2.5 rounded-md border border-border/40">
              {apt.notes}
            </p>
          )}

          {/* Actions */}
          <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t">
            {!opts.isPast && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleMarkComplete(apt)}
                disabled={busyId === apt.id}
                className="h-8 text-xs gap-1.5 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-50 dark:hover:bg-emerald-950/20"
              >
                {busyId === apt.id ? (
                  <Loading03Icon size={12} className="animate-spin" />
                ) : (
                  <CheckmarkCircle02Icon size={12} />
                )}
                <span>{t.markComplete}</span>
              </Button>
            )}

            <Button
              size="sm"
              variant="outline"
              onClick={() => toggleDocsPanel(apt)}
              className="h-8 text-xs gap-1"
            >
              <Link01Icon size={12} />
              <span>{isExpanded ? t.hideDocs : t.linkDocs}</span>
              {isExpanded ? <ArrowUp01Icon size={12} /> : <ArrowDown01Icon size={12} />}
            </Button>

            {!opts.isPast && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleCancel(apt)}
                disabled={busyId === apt.id}
                className="h-8 text-xs gap-1 text-muted-foreground hover:text-foreground"
              >
                <Cancel01Icon size={12} />
                <span>{t.cancelBtn}</span>
              </Button>
            )}

            <Button
              size="sm"
              variant="ghost"
              onClick={() => handleDelete(apt)}
              disabled={busyId === apt.id}
              className="ml-auto h-8 text-xs text-muted-foreground hover:text-destructive gap-1 px-2"
            >
              <Delete02Icon size={13} />
              <span className="hidden sm:inline">{t.delete}</span>
            </Button>
          </div>

          {/* Link Documents inline panel */}
          {isExpanded && (
            <div className="mt-2 bg-muted/40 border rounded-lg p-3 space-y-2.5">
              {documents.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  {t.noDocs}
                </p>
              ) : (
                <>
                  <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1">
                    {documents.map((d) => {
                      const checked = linksDraft.includes(d.id);
                      return (
                        <label
                          key={d.id}
                          className={`flex items-center gap-2 p-2 rounded-md border text-xs cursor-pointer transition-colors ${
                            checked
                              ? 'bg-teal-500/10 border-teal-500/30'
                              : 'bg-card border-border hover:border-border/80'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() =>
                              toggleLink(apt.id, d.id, apt.linkedDocumentIds)
                            }
                            className="w-3.5 h-3.5 accent-teal-600 rounded"
                          />
                          <File01Icon size={13} className="text-teal-600 dark:text-teal-400 shrink-0" />
                          <div className="min-w-0 flex-1">
                            <div className="font-medium text-foreground truncate">
                              {d.name}
                            </div>
                            <div className="text-[10px] text-muted-foreground truncate">
                              {d.type} · {d.date}
                            </div>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                  <Button
                    size="sm"
                    onClick={() => handleSaveLinks(apt)}
                    disabled={busyId === apt.id}
                    className="w-full h-8 text-xs gap-1.5 bg-teal-600 hover:bg-teal-700 text-white"
                  >
                    {busyId === apt.id ? (
                      <Loading03Icon size={12} className="animate-spin" />
                    ) : (
                      <FloppyDiskIcon size={12} />
                    )}
                    <span>{t.saveLinks}</span>
                  </Button>
                </>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground flex items-center gap-2">
            <CalendarCheckIn01Icon size={26} className="text-teal-600 dark:text-teal-400" />
            <span>{t.title}</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">{t.subtitle}</p>
        </div>
        <Button
          onClick={() => {
            setIsFormOpen((v) => !v);
            setFormError(null);
          }}
          className="gap-2 bg-teal-600 hover:bg-teal-700 text-white self-start sm:self-auto h-9 text-xs sm:text-sm"
        >
          {isFormOpen ? <Cancel01Icon size={14} /> : <CalendarAdd01Icon size={14} />}
          <span>{isFormOpen ? t.cancelBtn : t.addBtn}</span>
        </Button>
      </div>

      {/* Caregiver context strip */}
      {isCaregiverViewing && !isOwnData && (
        <Card className="bg-teal-50/50 dark:bg-teal-950/20 border-teal-500/20 p-3">
          <div className="flex items-center gap-2 text-xs">
            <UserGroupIcon size={14} className="text-teal-600 dark:text-teal-400 shrink-0" />
            <span className="text-muted-foreground">
              <span className="font-semibold text-teal-700 dark:text-teal-300 mr-1.5 uppercase text-[10px]">
                {t.addingFor}
              </span>
              <span className="font-medium text-foreground">{activePatientName || 'patient'}</span>
            </span>
          </div>
        </Card>
      )}

      {/* Add Appointment form */}
      {isFormOpen && (
        <Card className="border-teal-500/30">
          <CardHeader className="p-4 sm:p-5 pb-2">
            <div className="flex items-center gap-2">
              <SparklesIcon size={15} className="text-teal-600 dark:text-teal-400" />
              <CardTitle className="text-sm sm:text-base font-semibold">{t.formTitle}</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-4 sm:p-5 pt-2">
            <form onSubmit={handleSave} className="space-y-3.5">
              {formError && (
                <div className="flex items-center gap-2 bg-destructive/10 border border-destructive/20 rounded-md p-2.5 text-xs text-destructive">
                  <AlertCircleIcon size={14} className="shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2 space-y-1">
                  <label className="text-xs font-medium text-foreground">{t.doctor}</label>
                  <Input
                    value={draft.doctorName}
                    onChange={(e) => setDraft((p) => ({ ...p, doctorName: e.target.value }))}
                    placeholder="e.g. Dr. Amit Sharma"
                    className="h-9 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-foreground">{t.specialty}</label>
                  <Input
                    value={draft.specialty}
                    onChange={(e) => setDraft((p) => ({ ...p, specialty: e.target.value }))}
                    placeholder="e.g. Cardiology"
                    className="h-9 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-foreground">{t.hospital}</label>
                  <Input
                    value={draft.hospitalName}
                    onChange={(e) => setDraft((p) => ({ ...p, hospitalName: e.target.value }))}
                    placeholder="e.g. AIIMS Delhi"
                    className="h-9 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-foreground">{t.date}</label>
                  <Input
                    type="date"
                    value={draft.date}
                    onChange={(e) => setDraft((p) => ({ ...p, date: e.target.value }))}
                    className="h-9 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-foreground">{t.time}</label>
                  <Input
                    type="time"
                    value={draft.time}
                    onChange={(e) => setDraft((p) => ({ ...p, time: e.target.value }))}
                    className="h-9 text-xs"
                  />
                </div>
                <div className="sm:col-span-2 space-y-1">
                  <label className="text-xs font-medium text-foreground">{t.notes}</label>
                  <textarea
                    value={draft.notes}
                    onChange={(e) => setDraft((p) => ({ ...p, notes: e.target.value }))}
                    rows={2}
                    placeholder={t.notesPh}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                </div>
              </div>

              {/* Reminder toggle */}
              <div
                onClick={() => setDraft((p) => ({ ...p, reminderSet: !p.reminderSet }))}
                className={`flex items-center justify-between p-2.5 rounded-md border cursor-pointer transition-colors ${
                  draft.reminderSet ? 'bg-teal-500/10 border-teal-500/30' : 'bg-muted/30 border-border'
                }`}
              >
                <span className="flex items-center gap-2 text-xs font-medium">
                  {draft.reminderSet ? (
                    <Notification01Icon size={14} className="text-teal-600 dark:text-teal-400" />
                  ) : (
                    <NotificationOff01Icon size={14} className="text-muted-foreground" />
                  )}
                  <span>{t.reminder}</span>
                </span>
                <span
                  className={`w-8 h-4 rounded-full transition-colors relative ${
                    draft.reminderSet ? 'bg-teal-600' : 'bg-muted'
                  }`}
                >
                  <span
                    className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all ${
                      draft.reminderSet ? 'left-4' : 'left-0.5'
                    }`}
                  />
                </span>
              </div>

              <div className="flex gap-2 pt-1">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setIsFormOpen(false);
                    setFormError(null);
                  }}
                  className="flex-1 h-9 text-xs"
                >
                  {t.cancelBtn}
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={saving}
                  className="flex-1 h-9 text-xs bg-teal-600 hover:bg-teal-700 text-white gap-1.5"
                >
                  {saving ? (
                    <Loading03Icon size={13} className="animate-spin" />
                  ) : (
                    <FloppyDiskIcon size={13} />
                  )}
                  <span>{saving ? t.saving : t.save}</span>
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Loading state */}
      {loadingList && (
        <div className="flex items-center justify-center gap-2 py-12 text-muted-foreground">
          <Loading03Icon size={18} className="animate-spin text-teal-600 dark:text-teal-400" />
          <span className="text-xs">Loading appointments…</span>
        </div>
      )}

      {/* Upcoming section */}
      {!loadingList && (
        <section className="space-y-3">
          <div className="flex items-center gap-2 border-b pb-2">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {t.upcoming}
            </h2>
            <Badge variant="outline" className="text-[10px] h-5 px-1.5">
              {upcoming.length}
            </Badge>
          </div>
          {upcoming.length === 0 ? (
            <Card className="text-center py-8">
              <CalendarCheckIn01Icon size={26} className="mx-auto mb-2 text-muted-foreground/40" />
              <p className="text-xs text-muted-foreground">{t.emptyUpcoming}</p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {upcoming.map((a) => renderCard(a, { isPast: false }))}
            </div>
          )}
        </section>
      )}

      {/* Past section */}
      {!loadingList && (
        <section className="space-y-3">
          <div className="flex items-center gap-2 border-b pb-2">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {t.past}
            </h2>
            <Badge variant="outline" className="text-[10px] h-5 px-1.5">
              {past.length}
            </Badge>
          </div>
          {past.length === 0 ? (
            <Card className="text-center py-8">
              <Clock01Icon size={26} className="mx-auto mb-2 text-muted-foreground/40" />
              <p className="text-xs text-muted-foreground">{t.emptyPast}</p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {past.map((a) => renderCard(a, { isPast: true }))}
            </div>
          )}
        </section>
      )}
    </div>
  );
};

export default Appointments;

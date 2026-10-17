import React, { useState, useEffect } from 'react';
import { useMedication } from '../context/MedicationContext';
import type { Medication } from '../context/MedicationContext';
import { useSettings } from '../context/SettingsContext';
import { useRole, useActivePatient } from '../context/RoleContext';
import { CaregiverEnterCodeCard } from '../components/CaregiverEnterCodeCard';
import { SOSButton } from '../components/SOSButton';
import { SOSHistoryFeed } from '../components/SOSHistoryFeed';
import { NearbyCareCard } from '../components/NearbyCareCard';
import {
  Calendar03Icon,
  FireIcon,
  Clock01Icon,
  ArrowRight01Icon,
  CheckmarkCircle02Icon,
  Medicine01Icon,
} from 'hugeicons-react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Progress } from '../components/ui/progress';

interface HomeProps {
  onOpenReport?: () => void;
  onOpenNearby?: () => void;
}

type Slot = 'morning' | 'afternoon' | 'evening' | 'night';
const SLOTS: Slot[] = ['morning', 'afternoon', 'evening', 'night'];

export const Home: React.FC<HomeProps> = ({ onOpenReport, onOpenNearby }) => {
  const { medications, logs, toggleDose, streak } = useMedication();
  const { language, t } = useSettings();
  const { role } = useRole();
  const { isCaregiverViewing } = useActivePatient();
  const [currentTime, setCurrentTime] = useState(new Date());

  const [nextDoseText, setNextDoseText] = useState('');
  const [countdown, setCountdown] = useState('');

  // Live clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Next dose countdown
  useEffect(() => {
    if (medications.length === 0) {
      setNextDoseText(language === 'hi' ? 'कोई दवाई निर्धारित नहीं' : 'No medicines scheduled');
      setCountdown('--:--:--');
      return;
    }

    const computeNextDose = () => {
      const now = new Date();
      const todayStr = now.toISOString().split('T')[0];
      const slotHours: Record<Slot, number> = { morning: 8, afternoon: 13, evening: 18, night: 21 };

      let nearestDiff = Infinity;
      let nearestMed: Medication | null = null;
      let nearestSlot: Slot | '' = '';

      medications.forEach((med) => {
        const timings = Array.isArray(med.timing) ? med.timing : [];
        timings.forEach((slot) => {
          const target = new Date();
          target.setHours(slotHours[slot], 0, 0, 0);

          const logKey = `${med.id}_${slot}`;
          const isTakenToday = !!logs[todayStr]?.[logKey]?.taken;

          let diff = target.getTime() - now.getTime();
          if (diff <= 0 || isTakenToday) {
            target.setDate(target.getDate() + 1);
            diff = target.getTime() - now.getTime();
          }

          if (diff < nearestDiff) {
            nearestDiff = diff;
            nearestMed = med;
            nearestSlot = slot;
          }
        });
      });

      if (nearestMed) {
        const medName = (nearestMed as Medication).name;
        const slotText: Record<string, string> = {
          morning:   language === 'hi' ? 'सुबह' : 'Morning',
          afternoon: language === 'hi' ? 'दोपहर' : 'Afternoon',
          evening:   language === 'hi' ? 'शाम' : 'Evening',
          night:     language === 'hi' ? 'रात' : 'Night',
        };
        setNextDoseText(`${medName} (${slotText[nearestSlot] || nearestSlot})`);

        const totalSecs = Math.floor(nearestDiff / 1000);
        const hrs = Math.floor(totalSecs / 3600);
        const mins = Math.floor((totalSecs % 3600) / 60);
        const secs = totalSecs % 60;
        setCountdown(
          `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
        );
      }
    };

    computeNextDose();
    const interval = setInterval(computeNextDose, 1000);
    return () => clearInterval(interval);
  }, [medications, logs, language]);

  // Today's progress
  const todayStr = currentTime.toISOString().split('T')[0];
  const todayLog = logs[todayStr] || {};

  let totalDosesToday = 0;
  let takenDosesToday = 0;
  medications.forEach((m) => {
    (Array.isArray(m.timing) ? m.timing : []).forEach((slot) => {
      totalDosesToday++;
      if (todayLog[`${m.id}_${slot}`]?.taken) takenDosesToday++;
    });
  });

  const progressPercent =
    totalDosesToday > 0 ? Math.round((takenDosesToday / totalDosesToday) * 100) : 100;

  // Past 7 days adherence
  const past7Days = Array.from({ length: 7 }).map((_, idx) => {
    const date = new Date(currentTime);
    date.setDate(currentTime.getDate() - (6 - idx));
    const dateStr = date.toISOString().split('T')[0];
    const dayLog = logs[dateStr] || {};

    let total = 0;
    let taken = 0;
    const activeMeds = medications.filter((m) => m.startDate <= dateStr);
    activeMeds.forEach((m) => {
      m.timing.forEach((slot) => {
        total++;
        if (dayLog[`${m.id}_${slot}`]?.taken) taken++;
      });
    });

    return {
      dateStr,
      label: date.toLocaleDateString(language === 'hi' ? 'hi-IN' : 'en-US', { weekday: 'short' }),
      percent: total > 0 ? Math.round((taken / total) * 100) : 0,
    };
  });

  const slotLabel = (slot: Slot): string => {
    const map: Record<Slot, Record<string, string>> = {
      morning:   { hi: 'सुबह',  en: 'Morning'   },
      afternoon: { hi: 'दोपहर', en: 'Afternoon' },
      evening:   { hi: 'शाम',   en: 'Evening'   },
      night:     { hi: 'रात',   en: 'Night'     },
    };
    return map[slot][language as 'hi' | 'en'] || map[slot].en;
  };

  const slotTimeBadge: Record<Slot, string> = {
    morning: '08:00',
    afternoon: '13:00',
    evening: '18:00',
    night: '21:00',
  };

  return (
    <div className="space-y-5 font-sans">
      {/* Header — title + action button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-semibold text-foreground tracking-tight">
            {language === 'hi' ? 'डैशबोर्ड' : 'Dashboard'}
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {language === 'hi'
              ? 'आज का अवलोकन और दवाइयों की प्रगति'
              : "Today's clinical overview and medication progress"}
          </p>
        </div>

        <Button
          onClick={onOpenReport}
          variant="outline"
          size="sm"
          className="self-start sm:self-auto gap-1.5 text-xs"
        >
          <span>{language === 'hi' ? 'पूरी रिपोर्ट देखें' : 'View Full Report'}</span>
          <ArrowRight01Icon size={14} />
        </Button>
      </div>

      {/* Caregiver invite code & SOS alert feed */}
      {role === 'caregiver' && !isCaregiverViewing && <CaregiverEnterCodeCard />}
      {role === 'caregiver' && !isCaregiverViewing && <SOSHistoryFeed />}

      {/* Quick stats grid: Today, Streak, Next Dose, Active Regimen */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Date */}
        <Card className="p-3.5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Calendar03Icon size={16} />
            </div>
            <div className="min-w-0">
              <div className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider">
                {language === 'hi' ? 'तारीख' : 'Today'}
              </div>
              <div className="text-xs font-semibold text-foreground truncate mt-0.5">
                {currentTime.toLocaleDateString(language === 'hi' ? 'hi-IN' : 'en-US', {
                  weekday: 'short',
                  day: 'numeric',
                  month: 'short',
                })}
              </div>
            </div>
          </div>
        </Card>

        {/* Streak */}
        <Card className="p-3.5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <FireIcon size={16} />
            </div>
            <div className="min-w-0">
              <div className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider">
                {t.streakText}
              </div>
              <div className="text-xs font-semibold text-foreground truncate mt-0.5">
                {streak} {language === 'hi' ? 'दिन' : 'Days'}
              </div>
            </div>
          </div>
        </Card>

        {/* Next Dose */}
        <Card className="p-3.5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <Clock01Icon size={16} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider">
                {t.nextDose}
              </div>
              <div className="text-xs font-semibold text-foreground truncate mt-0.5">
                {nextDoseText ? `${nextDoseText} · ${countdown}` : countdown}
              </div>
            </div>
          </div>
        </Card>

        {/* Active Meds */}
        <Card className="p-3.5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Medicine01Icon size={16} />
            </div>
            <div className="min-w-0">
              <div className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider">
                {language === 'hi' ? 'सक्रिय दवाइयाँ' : 'Active Meds'}
              </div>
              <div className="text-xs font-semibold text-foreground truncate mt-0.5">
                {medications.length} {language === 'hi' ? 'दवाइयाँ' : 'Medicines'}
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Nearby Care Preview */}
      <NearbyCareCard onOpen={onOpenNearby} />

      {/* Main Grid: Adherence Telemetry & Weekly Progress */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Adherence & Regimen Summary (2 cols on lg) */}
        <div className="lg:col-span-2 space-y-5">
          {/* Daily Adherence Progress Card */}
          <Card>
            <CardHeader className="pb-3 flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle className="text-sm font-semibold">
                  {language === 'hi' ? 'दैनिक एडहेरेंस प्रगति' : 'Daily Adherence Telemetry'}
                </CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {takenDosesToday} of {totalDosesToday} doses completed today
                </p>
              </div>
              <Badge variant="success" className="text-xs font-semibold">
                {progressPercent}% Complete
              </Badge>
            </CardHeader>
            <CardContent>
              <Progress value={progressPercent} className="h-2.5" />

              <div className="grid grid-cols-3 gap-2.5 mt-4">
                <div className="bg-secondary/40 border border-border rounded-lg p-2.5 text-center">
                  <div className="text-lg font-semibold text-emerald-600 dark:text-emerald-400">
                    {takenDosesToday}
                  </div>
                  <div className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider mt-0.5">
                    {language === 'hi' ? 'ली गई' : 'Taken'}
                  </div>
                </div>
                <div className="bg-secondary/40 border border-border rounded-lg p-2.5 text-center">
                  <div className="text-lg font-semibold text-amber-600 dark:text-amber-400">
                    {Math.max(totalDosesToday - takenDosesToday, 0)}
                  </div>
                  <div className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider mt-0.5">
                    {language === 'hi' ? 'बाकी' : 'Pending'}
                  </div>
                </div>
                <div className="bg-secondary/40 border border-border rounded-lg p-2.5 text-center">
                  <div className="text-lg font-semibold text-primary">
                    {medications.length}
                  </div>
                  <div className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider mt-0.5">
                    {language === 'hi' ? 'दवाइयाँ' : 'Medications'}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Today's Schedule — 4 slots grid */}
          <Card>
            <CardHeader className="pb-3 flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle className="text-sm font-semibold">
                  {language === 'hi' ? 'आज का शेड्यूल' : "Today's Schedule"}
                </CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {language === 'hi'
                    ? 'खुराक की पुष्टि करने के लिए टैप करें'
                    : 'Tap any dose to confirm intake'}
                </p>
              </div>
              <Badge variant="outline" className="text-xs">
                4 Slots
              </Badge>
            </CardHeader>
            <CardContent>
              {medications.length === 0 ? (
                <div className="text-center py-10">
                  <div className="w-10 h-10 rounded-lg bg-secondary border border-border mx-auto flex items-center justify-center mb-2 text-muted-foreground">
                    <Medicine01Icon size={18} />
                  </div>
                  <h4 className="text-xs font-semibold text-foreground">
                    {language === 'hi' ? 'कोई निर्धारित दवाई नहीं है' : 'No Medicines Scheduled'}
                  </h4>
                  <p className="text-[11px] text-muted-foreground mt-1 max-w-xs mx-auto leading-relaxed">
                    {language === 'hi'
                      ? 'दवाइयाँ जोड़ें या अपने पर्चे को स्कैन करके अपना शेड्यूल शुरू करें।'
                      : 'Add medications or scan a prescription to populate your daily regimen.'}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
                  {SLOTS.map((slot) => {
                    const slotMeds = medications.filter((m) =>
                      (Array.isArray(m.timing) ? m.timing : []).includes(slot)
                    );
                    return (
                      <div
                        key={slot}
                        className="bg-secondary/40 border border-border rounded-xl p-3 flex flex-col hover:border-primary/40 transition-colors"
                      >
                        <div className="flex items-center justify-between mb-2.5 pb-2 border-b border-border">
                          <span className="text-xs font-semibold text-foreground">
                            {slotLabel(slot)}
                          </span>
                          <span className="text-[10px] font-mono text-muted-foreground font-medium">
                            {slotTimeBadge[slot]}
                          </span>
                        </div>

                        <div className="space-y-1.5 flex-1">
                          {slotMeds.length === 0 ? (
                            <div className="text-[11px] text-muted-foreground italic py-4 text-center">
                              {language === 'hi' ? 'कोई दवा नहीं' : 'No medicines'}
                            </div>
                          ) : (
                            slotMeds.map((med) => {
                              const key = `${med.id}_${slot}`;
                              const isTaken = !!todayLog[key]?.taken;
                              return (
                                <button
                                  key={key}
                                  onClick={() => toggleDose(todayStr, med.id, slot)}
                                  aria-pressed={isTaken}
                                  className={`w-full flex items-center gap-2 p-2 rounded-lg border text-left transition-all tactile-btn ${
                                    isTaken
                                      ? 'bg-emerald-500/10 border-emerald-500/30'
                                      : 'bg-card border-border hover:border-primary/40'
                                  }`}
                                >
                                  <div className="min-w-0 flex-1">
                                    <div
                                      className={`text-xs font-semibold truncate ${
                                        isTaken
                                          ? 'text-muted-foreground line-through opacity-80'
                                          : 'text-foreground'
                                      }`}
                                    >
                                      {med.name}
                                    </div>
                                    <div className="text-[10px] text-muted-foreground truncate">
                                      {med.dosage}
                                    </div>
                                  </div>

                                  <span
                                    className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-colors ${
                                      isTaken
                                        ? 'bg-emerald-600 border-emerald-600 text-white'
                                        : 'border-border bg-card'
                                    }`}
                                  >
                                    {isTaken && <CheckmarkCircle02Icon size={12} />}
                                  </span>
                                </button>
                              );
                            })
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* 7-Day Adherence Bar Chart */}
        <Card className="flex flex-col">
          <CardHeader className="pb-3 flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle className="text-sm font-semibold">
                {language === 'hi' ? '7-दिन एडहेरेंस' : '7-Day Adherence'}
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                Weekly compliance overview
              </p>
            </div>
            <button
              onClick={onOpenReport}
              className="text-xs font-medium text-primary hover:underline"
            >
              {language === 'hi' ? 'विवरण' : 'Details'}
            </button>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col justify-between">
            <div className="flex items-end justify-between gap-2 h-44 pt-4 border-b border-border px-1 relative">
              <div className="absolute left-0 right-0 top-4 border-t border-dashed border-border pointer-events-none">
                <span className="absolute -top-2 -right-1 text-[10px] text-muted-foreground font-mono">
                  100%
                </span>
              </div>
              <div className="absolute left-0 right-0 top-1/2 border-t border-dashed border-border pointer-events-none">
                <span className="absolute -top-2 -right-1 text-[10px] text-muted-foreground font-mono">
                  50%
                </span>
              </div>

              {past7Days.map((day, i) => {
                const barH = Math.max((day.percent / 100) * 140, 6);
                const barColor =
                  day.percent >= 80
                    ? 'bg-emerald-500'
                    : day.percent >= 50
                    ? 'bg-teal-500'
                    : 'bg-muted';
                return (
                  <div key={i} className="flex flex-col items-center flex-1 group z-10">
                    <div className="relative w-full flex justify-center items-end h-32">
                      <div className="absolute -top-6 opacity-0 group-hover:opacity-100 transition-opacity bg-foreground text-background text-[10px] font-semibold px-1.5 py-0.5 rounded shadow-sm whitespace-nowrap pointer-events-none">
                        {day.percent}%
                      </div>
                      <div
                        style={{ height: `${barH}px` }}
                        className={`w-5 sm:w-6 rounded-t-md transition-all duration-300 ${barColor}`}
                      />
                    </div>
                    <span className="text-[10px] font-semibold text-muted-foreground uppercase mt-2">
                      {day.label}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="grid grid-cols-3 gap-2 mt-4">
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-2 text-center">
                <div className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">≥80%</div>
                <div className="text-[9px] uppercase font-semibold text-muted-foreground tracking-wider mt-0.5">
                  Optimal
                </div>
              </div>
              <div className="bg-teal-500/10 border border-teal-500/20 rounded-lg p-2 text-center">
                <div className="text-xs font-semibold text-primary">50-79%</div>
                <div className="text-[9px] uppercase font-semibold text-muted-foreground tracking-wider mt-0.5">
                  Steady
                </div>
              </div>
              <div className="bg-secondary/40 border border-border rounded-lg p-2 text-center">
                <div className="text-xs font-semibold text-muted-foreground">&lt;50%</div>
                <div className="text-[9px] uppercase font-semibold text-muted-foreground tracking-wider mt-0.5">
                  Low
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <SOSButton />
    </div>
  );
};

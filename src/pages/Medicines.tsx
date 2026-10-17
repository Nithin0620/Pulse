import React, { useState } from 'react';
import { useMedication } from '../context/MedicationContext';
import { useSettings } from '../context/SettingsContext';
import { useActivePatient } from '../context/RoleContext';
import { OcrService } from '../services/ocrService';
import { useDisplayMedications } from '../hooks/useDisplayMedications';
import {
  PlusSignIcon,
  Delete02Icon,
  Camera01Icon,
  CheckmarkCircle02Icon,
  RefreshIcon,
  Cancel01Icon,
  Search01Icon,
  InformationCircleIcon,
  TranslateIcon,
  Medicine01Icon,
} from 'hugeicons-react';
import { MedicineInfoPanel } from '../components/MedicineInfoPanel';
import { Card, CardHeader, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';

type Slot = 'morning' | 'afternoon' | 'evening' | 'night';
const SLOTS: Slot[] = ['morning', 'afternoon', 'evening', 'night'];

export const Medicines: React.FC = () => {
  const { medications, addMedication, deleteMedication, logs, toggleDose } = useMedication();
  const { t, language } = useSettings();
  const { isOwnData, isCaregiverViewing } = useActivePatient();
  const canMutate = isOwnData;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTab, setModalTab] = useState<'manual' | 'scan'>('manual');
  const [searchQuery, setSearchQuery] = useState('');

  // Manual form state
  const [name, setName] = useState('');
  const [dosage, setDosage] = useState('');
  const [instructions, setInstructions] = useState('');
  const [timing, setTiming] = useState<Slot[]>(['morning']);

  // OCR state
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<any>(null);

  // Medicine info slide-up panel
  const [infoMedName, setInfoMedName] = useState<string | null>(null);

  const todayStr = new Date().toISOString().split('T')[0];
  const todayLog = logs[todayStr] || {};

  const resetForm = () => {
    setName('');
    setDosage('');
    setInstructions('');
    setTiming(['morning']);
    setScanResult(null);
    setModalTab('manual');
  };

  const closeModal = () => {
    setIsModalOpen(false);
    resetForm();
  };

  const handleManualAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    await addMedication({
      name,
      dosage: dosage || '1 Tablet',
      frequency:
        timing.length === 1 ? 'Once Daily' : timing.length === 2 ? 'Twice Daily' : 'Multiple Daily',
      timing,
      startDate: new Date().toISOString().split('T')[0],
      instructions,
    });

    closeModal();
  };

  const toggleTiming = (slot: Slot) => {
    if (timing.includes(slot)) {
      if (timing.length > 1) setTiming(timing.filter((t) => t !== slot));
    } else {
      setTiming([...timing, slot]);
    }
  };

  const handleOcrFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsScanning(true);
    setScanResult(null);
    try {
      const result = await OcrService.scanPrescription(file);
      setScanResult(result);
    } catch (err) {
      console.error('OCR scan failed:', err);
      alert('Prescription scan failed. Please try again or add manually.');
    } finally {
      setIsScanning(false);
    }
  };

  const handleMockScan = async () => {
    setIsScanning(true);
    setScanResult(null);
    try {
      const mockResult = OcrService.generateMockPrescription();
      setScanResult(mockResult);
    } finally {
      setIsScanning(false);
    }
  };

  const handleSaveOcrMeds = async () => {
    if (!scanResult?.medicines?.length) return;
    for (const med of scanResult.medicines) {
      await addMedication({
        name: med.name || 'Medicine',
        dosage: med.dosage || '1 Tablet',
        frequency: med.frequency || 'Daily',
        timing: med.timing && med.timing.length > 0 ? med.timing : ['morning'],
        startDate: new Date().toISOString().split('T')[0],
        instructions: med.instructions || '',
      });
    }
    closeModal();
  };

  const filteredMeds = medications.filter((m) =>
    (m.name || '').toLowerCase().includes(searchQuery.toLowerCase().trim())
  );

  const { displayMedications, isTranslating } = useDisplayMedications(filteredMeds);

  const slotLabel = (slot: Slot): string => {
    const map: Record<Slot, Record<string, string>> = {
      morning:   { hi: 'सुबह',  en: 'Morning'   },
      afternoon: { hi: 'दोपहर', en: 'Afternoon' },
      evening:   { hi: 'शाम',   en: 'Evening'   },
      night:     { hi: 'रात',   en: 'Night'     },
    };
    return map[slot]?.[language as 'hi' | 'en'] || slot;
  };

  return (
    <div className="space-y-5 font-sans">
      {/* Header — title & actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-semibold text-foreground tracking-tight">
            {language === 'hi' ? 'दवाइयाँ' : t.medicinesTab}
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {language === 'hi'
              ? 'अपनी सक्रिय दवाइयाँ और आज की खुराक प्रबंधित करें'
              : 'Manage your active medications and daily intake schedule'}
          </p>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-56">
            <Search01Icon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <Input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={language === 'hi' ? 'दवाई खोजें…' : 'Search medicines…'}
              className="pl-8 h-8 text-xs"
            />
          </div>

          {canMutate && (
            <Button
              onClick={() => setIsModalOpen(true)}
              size="sm"
              className="gap-1.5 text-xs whitespace-nowrap"
            >
              <PlusSignIcon size={14} />
              <span>{language === 'hi' ? 'नई दवाई' : t.addMedTitle}</span>
            </Button>
          )}
        </div>
      </div>

      {isCaregiverViewing && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3 text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
          <Badge variant="outline" className="text-[10px] font-semibold bg-card">
            Read-only
          </Badge>
          <span>
            {language === 'hi'
              ? 'आप एक मरीज़ का डैशबोर्ड देख रहे हैं। बदलाव केवल मरीज़ ही कर सकता है।'
              : "Viewing patient data in read-only mode. Only the patient can modify medications."}
          </span>
        </div>
      )}

      {/* Grid of Medications */}
      {filteredMeds.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent className="flex flex-col items-center justify-center p-0">
            <div className="w-10 h-10 rounded-lg bg-secondary border border-border flex items-center justify-center text-muted-foreground mb-2.5">
              <Medicine01Icon size={20} />
            </div>
            <p className="text-sm font-semibold text-foreground">
              {medications.length === 0
                ? language === 'hi'
                  ? 'अभी तक कोई दवाई नहीं जोड़ी गई'
                  : 'No Medications Added Yet'
                : language === 'hi'
                ? 'कोई परिणाम नहीं'
                : 'No matching medications found'}
            </p>
            <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto leading-relaxed">
              {language === 'hi'
                ? 'दाहिनी ओर "नई दवाई" पर क्लिक करें या आवाज से बोलकर जोड़ें।'
                : 'Click "Add Medication" above or use voice input to register your prescriptions.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {isTranslating && language !== 'en' && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
              <TranslateIcon size={14} className="text-primary animate-pulse" />
              <span>{language === 'hi' ? 'अनुवाद हो रहा है…' : 'Translating medicine names…'}</span>
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5">
            {displayMedications.map((med) => {
              const medId = med.id as string;
              return (
                <Card key={medId} className="flex flex-col justify-between hover:border-primary/40 transition-colors">
                  <CardHeader className="p-4 pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0 mt-0.5">
                          <Medicine01Icon size={16} />
                        </div>
                        <div className="min-w-0">
                          <h3 className="text-sm font-semibold text-foreground truncate leading-tight">
                            {med.name_display}
                          </h3>
                          <div className="text-xs text-muted-foreground mt-0.5 truncate">
                            {med.dosage_display} · {med.frequency_display}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => setInfoMedName(med.name)}
                          className="p-1.5 text-muted-foreground hover:text-primary rounded-md hover:bg-secondary transition-colors"
                          aria-label="Medicine information"
                          title="Medicine information"
                        >
                          <InformationCircleIcon size={15} />
                        </button>
                        {canMutate && (
                          <button
                            onClick={() => {
                              if (confirm(`Remove ${med.name_display}?`)) deleteMedication(medId);
                            }}
                            className="p-1.5 text-muted-foreground hover:text-destructive rounded-md hover:bg-destructive/10 transition-colors"
                            aria-label="Delete medication"
                          >
                            <Delete02Icon size={15} />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Tags row */}
                    <div className="flex flex-wrap gap-1.5 mt-2.5">
                      {(med.timing || []).map((slot) => (
                        <Badge key={slot} variant="secondary" className="text-[10px] py-0 px-2">
                          {slotLabel(slot)}
                        </Badge>
                      ))}
                      {med.instructions_display && (
                        <Badge variant="outline" className="text-[10px] py-0 px-2 text-muted-foreground">
                          {med.instructions_display}
                        </Badge>
                      )}
                    </div>
                  </CardHeader>

                  {/* Inline M/A/E/N status buttons */}
                  <CardContent className="p-4 pt-2">
                    <div className="grid grid-cols-4 gap-1.5 pt-2.5 border-t border-border">
                      {SLOTS.map((slot) => {
                        const scheduled = (med.timing || []).includes(slot);
                        const key = `${medId}_${slot}`;
                        const isTaken = !!todayLog[key]?.taken;
                        return (
                          <button
                            key={slot}
                            disabled={!scheduled || !canMutate}
                            onClick={() => canMutate && toggleDose(todayStr, medId, slot)}
                            aria-pressed={isTaken}
                            className={`flex flex-col items-center justify-center p-1.5 rounded-lg border text-[10px] font-semibold transition-all tactile-btn ${
                              !scheduled
                                ? 'border-border/40 bg-secondary/20 text-muted-foreground/40 cursor-not-allowed'
                                : !canMutate
                                ? 'border-border bg-secondary/50 text-muted-foreground cursor-not-allowed'
                                : isTaken
                                ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                                : 'border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground'
                            }`}
                          >
                            <span className="leading-none mb-0.5">{slot.slice(0, 3).toUpperCase()}</span>
                            {scheduled && (
                              <span
                                className={`w-3.5 h-3.5 rounded border flex items-center justify-center ${
                                  isTaken
                                    ? 'bg-emerald-600 border-emerald-600 text-white'
                                    : 'border-muted-foreground/40 bg-background'
                                }`}
                              >
                                {isTaken && <CheckmarkCircle02Icon size={10} />}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </>
      )}

      {/* Add Medication Dialog */}
      {isModalOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in-0 duration-150"
          onClick={closeModal}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-card border border-border rounded-xl w-full max-w-lg shadow-lifted flex flex-col max-h-[90vh] overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-border">
              <h3 className="text-sm font-semibold text-foreground">
                {language === 'hi' ? 'नई दवाई जोड़ें' : t.addMedTitle}
              </h3>
              <button
                onClick={closeModal}
                className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary"
                aria-label="Close dialog"
              >
                <Cancel01Icon size={16} />
              </button>
            </div>

            {/* Mode Switcher */}
            <div className="grid grid-cols-2 p-3 pb-0 gap-1.5 bg-secondary/30 border-b border-border">
              <button
                onClick={() => setModalTab('manual')}
                className={`py-1.5 text-xs font-semibold rounded-md transition-all ${
                  modalTab === 'manual'
                    ? 'bg-card text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {t.addMedManual}
              </button>
              <button
                onClick={() => setModalTab('scan')}
                className={`py-1.5 text-xs font-semibold rounded-md transition-all ${
                  modalTab === 'scan'
                    ? 'bg-card text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {t.addMedScan}
              </button>
            </div>

            <div className="overflow-y-auto thin-scroll p-5 space-y-4">
              {modalTab === 'manual' && (
                <form onSubmit={handleManualAdd} className="space-y-3.5">
                  <div>
                    <label htmlFor="med-name" className="block text-xs font-medium text-foreground mb-1">
                      {t.medName}
                    </label>
                    <Input
                      id="med-name"
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Paracetamol 500mg"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label htmlFor="med-dosage" className="block text-xs font-medium text-foreground mb-1">
                        {t.dosage}
                      </label>
                      <Input
                        id="med-dosage"
                        type="text"
                        value={dosage}
                        onChange={(e) => setDosage(e.target.value)}
                        placeholder="e.g. 1 Tablet"
                      />
                    </div>
                    <div>
                      <label htmlFor="med-instructions" className="block text-xs font-medium text-foreground mb-1">
                        {language === 'hi' ? 'निर्देश' : 'Instruction'}
                      </label>
                      <Input
                        id="med-instructions"
                        type="text"
                        value={instructions}
                        onChange={(e) => setInstructions(e.target.value)}
                        placeholder="e.g. After meals"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-foreground mb-1.5">
                      {t.timing}
                    </label>
                    <div className="grid grid-cols-4 gap-2">
                      {SLOTS.map((slot) => {
                        const active = timing.includes(slot);
                        return (
                          <button
                            key={slot}
                            type="button"
                            onClick={() => toggleTiming(slot)}
                            className={`py-2 px-1 rounded-lg border text-xs font-medium transition-all ${
                              active
                                ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                                : 'bg-card border-border text-foreground hover:bg-secondary'
                            }`}
                          >
                            {slotLabel(slot)}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <Button type="submit" className="w-full mt-2" size="sm">
                    {t.saveMed}
                  </Button>
                </form>
              )}

              {modalTab === 'scan' && (
                <div className="space-y-3.5">
                  <label className="w-full flex flex-col items-center justify-center border-2 border-dashed border-border rounded-xl py-8 bg-secondary/30 cursor-pointer hover:border-primary/50 transition-colors">
                    <Camera01Icon size={28} className="text-primary mb-2" />
                    <span className="text-xs font-semibold text-foreground">
                      Upload Prescription Photo or PDF
                    </span>
                    <span className="text-[10px] text-muted-foreground mt-0.5">JPG, PNG, PDF up to 10MB</span>
                    <input
                      type="file"
                      accept="image/*,application/pdf"
                      onChange={handleOcrFile}
                      className="hidden"
                      aria-label="Upload prescription file"
                    />
                  </label>

                  <Button
                    onClick={handleMockScan}
                    variant="outline"
                    size="sm"
                    className="w-full gap-1.5 text-xs"
                  >
                    <RefreshIcon size={14} />
                    <span>Load Mock Prescription (Demo)</span>
                  </Button>

                  {isScanning && (
                    <div className="p-4 bg-secondary/30 border border-border rounded-xl text-center space-y-2">
                      <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
                      <div className="text-xs font-semibold text-foreground">
                        {language === 'hi' ? 'पर्चा पढ़ा जा रहा है…' : 'Analyzing prescription with AI…'}
                      </div>
                    </div>
                  )}

                  {scanResult && (
                    <div className="space-y-3 text-left">
                      <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                        <div className="text-xs font-semibold text-emerald-800 dark:text-emerald-300">
                          {scanResult.medicines?.length || 0} medications identified
                        </div>
                      </div>

                      {scanResult.medicines?.map((med: any, idx: number) => (
                        <div key={idx} className="p-3 bg-secondary/40 border border-border rounded-lg text-xs">
                          <div className="font-semibold text-foreground">{med.name}</div>
                          <div className="text-[11px] text-muted-foreground mt-0.5">
                            {[med.dosage, med.frequency, med.instructions].filter(Boolean).join(' · ')}
                          </div>
                        </div>
                      ))}

                      {scanResult.medicines?.length > 0 && (
                        <Button onClick={handleSaveOcrMeds} className="w-full" size="sm">
                          {language === 'hi' ? 'सभी दवाइयाँ जोड़ें' : 'Import All Medications'}
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Slide-up Medicine Info panel */}
      <MedicineInfoPanel
        medicineName={infoMedName}
        onClose={() => setInfoMedName(null)}
      />
    </div>
  );
};

export default Medicines;

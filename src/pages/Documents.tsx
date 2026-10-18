import { extractTextFromPdf } from '../services/pdfExtractor';
import {
  extractPrescription,
  type PrescriptionExtractionResult,
} from '../services/prescriptionPipeline';
import { privacyLedger } from '../services/pulseShield/privacyLedger';
import { PrivacyBadge } from '../components/PrivacyBadge';
import React, { useState, useMemo } from 'react';
import { useMedication } from '../context/MedicationContext';
import type { MedDocument } from '../context/MedicationContext';
import { useSettings } from '../context/SettingsContext';
import { useActivePatient } from '../context/RoleContext';
import { useDisplayMedications } from '../hooks/useDisplayMedications';
import {
  File01Icon,
  Calendar01Icon,
  UserIcon,
  Hospital01Icon,
  ViewIcon,
  Delete02Icon,
  Cancel01Icon,
  Search01Icon,
  SparklesIcon,
  Add01Icon,
  GlobeIcon,
  Upload01Icon,
  Loading03Icon,
} from 'hugeicons-react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';

type DocType = 'prescription' | 'report' | 'summary' | 'all';

export const Documents: React.FC = () => {
  const { documents, addDocument, deleteDocument, addMedication } = useMedication();
  const { t, language } = useSettings();
  const { isOwnData, isCaregiverViewing } = useActivePatient();
  const canMutate = isOwnData;

  const [isUploading, setIsUploading] = useState(false);
  const [docName, setDocName] = useState('');
  const [doctor, setDoctor] = useState('');
  const [hospital, setHospital] = useState('');
  const [type, setType] = useState<'prescription' | 'report' | 'summary'>('prescription');

  const [previewDoc, setPreviewDoc] = useState<MedDocument | null>(null);

  const [extractionResult, setExtractionResult] =
    useState<PrescriptionExtractionResult | null>(null);
  const [extractionFileName, setExtractionFileName] = useState<string>('');
  const [importingMeds, setImportingMeds] = useState(false);
  const [ocrPrivacyCount, setOcrPrivacyCount] = useState(0);

  // Filter / search
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<DocType>('all');

  const readFileAsDataUrl = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(reader.error || new Error('FileReader failed'));
      reader.onload = () => resolve(reader.result as string);
      reader.readAsDataURL(file);
    });

  const isImageFile = (file: File): boolean =>
    (file.type?.toLowerCase() || '').startsWith('image/') ||
    /\.(png|jpe?g|webp|bmp)$/i.test(file.name || '');

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setExtractionResult(null);
    setExtractionFileName('');

    try {
      const base64 = await readFileAsDataUrl(file);
      let extractedText = '';
      let detectedDoctor = '';
      let detectedHospital = '';
      let detectedDate = '';
      let detectedMedicines: string[] = [];
      let pipelineResult: PrescriptionExtractionResult | null = null;

      const shouldRunPipeline = type === 'prescription' || isImageFile(file);

      if (shouldRunPipeline) {
        try {
          pipelineResult = await extractPrescription(file);
          extractedText = pipelineResult.rawText || '';
          detectedDoctor = pipelineResult.doctor || '';
          detectedHospital = pipelineResult.hospital || '';
          detectedDate = pipelineResult.date || '';
          detectedMedicines = pipelineResult.medicines.map((m) => m.name);
        } catch (err) {
          console.error('PRESCRIPTION PIPELINE FAILED:', err);
        }
      } else if (file.type === 'application/pdf') {
        try {
          extractedText = await extractTextFromPdf(file);
        } catch (err) {
          console.error('PDF EXTRACTION FAILED:', err);
        }
      }

      const today = new Date().toISOString().split('T')[0];

      await addDocument({
        name: docName || file.name.split('.')[0] || 'Medical Document',
        type,
        date: detectedDate || today,
        doctor: doctor || detectedDoctor || '',
        hospital: hospital || detectedHospital || '',
        medicines: detectedMedicines,
        fileUrl: base64,
        extractedText,
      });

      setDocName('');
      setDoctor('');
      setHospital('');

      if (pipelineResult && (pipelineResult.medicines.length > 0 || pipelineResult.warnings.length > 0)) {
        setExtractionResult(pipelineResult);
        setExtractionFileName(file.name);
        
        // Check privacy ledger for OCR redaction
        const lastLog = privacyLedger.getLatest('OCR');
        if (lastLog) {
          setOcrPrivacyCount(lastLog.entitiesRedacted.length);
        }
      }
    } catch (err) {
      console.error('UPLOAD ERROR:', err);
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  const slotForFrequency = (
    frequency: string,
    timing: ('morning' | 'afternoon' | 'evening' | 'night')[]
  ): ('morning' | 'afternoon' | 'evening' | 'night')[] => {
    if (timing && timing.length > 0) return timing;
    const lc = (frequency || '').toLowerCase();
    if (lc.includes('twice')) return ['morning', 'night'];
    if (lc.includes('three') || lc.includes('thrice') || lc.includes('tid') || lc.includes('tds')) {
      return ['morning', 'afternoon', 'night'];
    }
    if (lc.includes('four') || lc.includes('qid') || lc.includes('qds')) {
      return ['morning', 'afternoon', 'evening', 'night'];
    }
    return ['morning'];
  };

  const importMedicines = async () => {
    if (!extractionResult || !canMutate) return;
    setImportingMeds(true);
    try {
      for (const med of extractionResult.medicines) {
        if (!med.name) continue;
        const timing = slotForFrequency(med.frequency, med.timing);
        const frequencyLabel =
          med.frequency ||
          (timing.length === 1
            ? 'Once Daily'
            : timing.length === 2
            ? 'Twice Daily'
            : timing.length === 3
            ? 'Three Times Daily'
            : 'Multiple Daily');

        await addMedication({
          name: med.name,
          dosage: med.dosage || '1 Tablet',
          frequency: frequencyLabel,
          timing,
          startDate: extractionResult.date || new Date().toISOString().split('T')[0],
          instructions: med.instructions || '',
        });
      }
    } catch (err) {
      console.error('IMPORT MEDICINES FAILED:', err);
    } finally {
      setImportingMeds(false);
      setExtractionResult(null);
      setExtractionFileName('');
    }
  };

  const dismissExtractionBanner = () => {
    setExtractionResult(null);
    setExtractionFileName('');
  };

  const extractedMedsForDisplay = useMemo(
    () => extractionResult?.medicines ?? [],
    [extractionResult]
  );
  const {
    displayMedications: displayExtractedMeds,
    isTranslating: isTranslatingExtracted,
  } = useDisplayMedications(extractedMedsForDisplay, language);

  const filteredDocs = useMemo(() => {
    return documents.filter((d) => {
      if (typeFilter !== 'all' && d.type !== typeFilter) return false;
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        d.name.toLowerCase().includes(q) ||
        d.doctor.toLowerCase().includes(q) ||
        d.hospital.toLowerCase().includes(q) ||
        d.medicines.some((m) => m.toLowerCase().includes(q))
      );
    });
  }, [documents, searchQuery, typeFilter]);

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground flex items-center gap-2">
          <File01Icon size={26} className="text-teal-600 dark:text-teal-400" />
          <span>{language === 'hi' ? 'पर्चे और रिपोर्ट्स' : t.docTitle}</span>
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          {language === 'hi'
            ? 'प्रिस्क्रिप्शन और लैब रिपोर्ट्स अपलोड और प्रबंधित करें'
            : 'Upload and manage prescriptions, lab reports, and clinical summaries'}
        </p>
      </div>

      {isCaregiverViewing && (
        <Card className="bg-teal-50/40 dark:bg-teal-950/20 border-teal-500/20 p-3">
          <div className="flex items-center gap-2 text-xs">
            <Badge variant="outline" className="text-[10px] text-teal-700 dark:text-teal-300 border-teal-500/30">
              Read-only
            </Badge>
            <span className="text-muted-foreground">
              {language === 'hi'
                ? 'आप मरीज़ के दस्तावेज़ देख रहे हैं। केवल मरीज़ ही अपलोड कर सकता है।'
                : "You are viewing a linked patient's documents. Only the patient can upload new files."}
            </span>
          </div>
        </Card>
      )}

      {/* Two-column layout */}
      <div className={`grid grid-cols-1 ${canMutate ? 'lg:grid-cols-5' : ''} gap-5`}>
        {/* Left: Upload Form */}
        {canMutate && (
          <div className="lg:col-span-2">
            <Card className="sticky top-20">
              <CardHeader className="p-4 sm:p-5 pb-2">
                <CardTitle className="text-sm sm:text-base font-semibold">
                  {language === 'hi' ? 'नया दस्तावेज़ अपलोड करें' : t.uploadDoc}
                </CardTitle>
                <p className="text-xs text-muted-foreground">
                  {language === 'hi'
                    ? 'दस्तावेज़ का विवरण भरें और फ़ाइल चुनें'
                    : 'Fill details and select a clinical file'}
                </p>
              </CardHeader>

              <CardContent className="p-4 sm:p-5 pt-2 space-y-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-foreground">
                    {language === 'hi' ? 'दस्तावेज़ शीर्षक' : 'Document Label'}
                  </label>
                  <Input
                    value={docName}
                    onChange={(e) => setDocName(e.target.value)}
                    placeholder="e.g. Cardiology Prescription"
                    className="h-9 text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-foreground">
                    {language === 'hi' ? 'प्रकार' : 'Type'}
                  </label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as any)}
                    className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-xs ring-offset-background outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="prescription">Prescription</option>
                    <option value="report">Lab Report</option>
                    <option value="summary">Discharge Summary</option>
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-foreground">
                      {language === 'hi' ? 'डॉक्टर का नाम' : 'Doctor Name'}
                    </label>
                    <Input
                      value={doctor}
                      onChange={(e) => setDoctor(e.target.value)}
                      placeholder="Dr. Amit Sharma"
                      className="h-9 text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-foreground">
                      {language === 'hi' ? 'अस्पताल / लैब' : 'Hospital / Lab'}
                    </label>
                    <Input
                      value={hospital}
                      onChange={(e) => setHospital(e.target.value)}
                      placeholder="City Health Clinic"
                      className="h-9 text-xs"
                    />
                  </div>
                </div>

                {/* Dropzone */}
                <label className="w-full flex flex-col items-center justify-center border-2 border-dashed border-border hover:border-teal-500 rounded-lg py-5 px-4 cursor-pointer bg-muted/20 hover:bg-muted/40 transition-all text-xs text-muted-foreground group">
                  {isUploading ? (
                    <div className="flex flex-col items-center gap-2 py-2">
                      <Loading03Icon size={24} className="animate-spin text-teal-600 dark:text-teal-400" />
                      <span className="font-medium text-foreground">
                        {language === 'hi' ? 'दस्तावेज़ का विश्लेषण हो रहा है…' : 'Analyzing Document…'}
                      </span>
                      <span className="text-[11px] text-muted-foreground">OCR + Extraction</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-1.5 py-1">
                      <div className="w-9 h-9 rounded-full bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center mb-0.5 group-hover:scale-105 transition-transform">
                        <Upload01Icon size={18} />
                      </div>
                      <span className="font-medium text-foreground text-center">
                        {language === 'hi' ? 'पर्चा या रिपोर्ट चुनें' : 'Upload Prescription or Report'}
                      </span>
                      <span className="text-[11px] text-muted-foreground text-center">
                        PDF, JPG, or PNG up to 10MB
                      </span>
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={handleUpload}
                    className="hidden"
                  />
                </label>

                {/* Extraction inline banner */}
                {extractionResult && (
                  <div className="space-y-2 pt-2 border-t">
                    <div className="bg-teal-50/50 dark:bg-teal-950/20 border border-teal-500/20 rounded-lg p-3 space-y-2.5">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                          <SparklesIcon size={14} className="text-teal-600 dark:text-teal-400" />
                          <div>
                            <h4 className="text-xs font-semibold text-foreground">
                              {language === 'hi'
                                ? `${extractionResult.medicines.length} दवाइयाँ मिलीं`
                                : `Detected ${extractionResult.medicines.length} medicine${extractionResult.medicines.length === 1 ? '' : 's'}`}
                            </h4>
                            {extractionFileName && (
                              <span className="text-[10px] text-muted-foreground block truncate">
                                {extractionFileName}
                              </span>
                            )}
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={dismissExtractionBanner}
                          className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
                        >
                          <Cancel01Icon size={12} />
                        </Button>
                      </div>

                      {/* Privacy Badge after OCR */}
                      {ocrPrivacyCount > 0 && (
                        <div>
                          <PrivacyBadge
                            feature="OCR"
                            entitiesRedacted={ocrPrivacyCount}
                          />
                        </div>
                      )}

                      {displayExtractedMeds.length > 0 && (
                        <>
                          {isTranslatingExtracted && language !== 'en' && (
                            <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                              <GlobeIcon size={11} className="text-teal-600 animate-pulse" />
                              <span>Translating…</span>
                            </div>
                          )}
                          <ul className="space-y-1 max-h-36 overflow-y-auto pr-1">
                            {displayExtractedMeds.map((m, i) => (
                              <li
                                key={i}
                                className="bg-background border rounded p-2 text-xs"
                              >
                                <div className="font-medium text-foreground truncate">{m.name_display}</div>
                                <div className="text-[11px] text-muted-foreground">
                                  {[m.dosage_display, m.frequency_display].filter(Boolean).join(' • ')}
                                </div>
                              </li>
                            ))}
                          </ul>
                        </>
                      )}

                      {extractionResult.medicines.length > 0 && (
                        <Button
                          size="sm"
                          onClick={importMedicines}
                          disabled={importingMeds}
                          className="w-full h-8 text-xs bg-teal-600 hover:bg-teal-700 text-white gap-1.5"
                        >
                          {importingMeds ? (
                            <Loading03Icon size={12} className="animate-spin" />
                          ) : (
                            <Add01Icon size={13} />
                          )}
                          <span>
                            {language === 'hi' ? 'मेरी दवाइयों में जोड़ें' : 'Import to Schedule'}
                          </span>
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Right: Search & Documents List */}
        <div className={`${canMutate ? 'lg:col-span-3' : ''} space-y-4`}>
          {/* Filter bar */}
          <div className="flex flex-col sm:flex-row gap-2.5">
            <div className="relative flex-1">
              <Search01Icon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={
                  language === 'hi'
                    ? 'नाम, डॉक्टर, अस्पताल खोजें…'
                    : 'Search by name, doctor, hospital…'
                }
                className="pl-8 h-9 text-xs"
              />
            </div>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as DocType)}
              className="h-9 rounded-md border border-input bg-background px-3 text-xs outline-none focus:ring-2 focus:ring-ring sm:w-36"
            >
              <option value="all">All Types</option>
              <option value="prescription">Prescription</option>
              <option value="report">Lab Report</option>
              <option value="summary">Summary</option>
            </select>
          </div>

          {/* Documents list */}
          {filteredDocs.length === 0 ? (
            <Card className="text-center py-12">
              <File01Icon size={36} className="mx-auto mb-2 text-muted-foreground/40" />
              <p className="text-sm font-medium text-foreground">
                {documents.length === 0 ? 'No documents stored' : 'No documents match your filter'}
              </p>
              <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                Upload your medical documents to keep them securely organized in your clinical records.
              </p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {filteredDocs.map((doc) => (
                <Card key={doc.id} className="flex flex-col justify-between hover:border-border/80 transition-all text-left">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-md bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0 mt-0.5">
                          <File01Icon size={16} />
                        </div>
                        <div className="min-w-0">
                          <Badge variant="outline" className="text-[10px] uppercase font-semibold h-4 px-1">
                            {doc.type}
                          </Badge>
                          <h3 className="text-sm font-semibold text-foreground mt-1 truncate">
                            {doc.name}
                          </h3>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setPreviewDoc(doc)}
                          className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                          title={t.viewInline}
                        >
                          <ViewIcon size={14} />
                        </Button>
                        {canMutate && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              if (confirm(`Delete ${doc.name}?`)) deleteDocument(doc.id);
                            }}
                            className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                          >
                            <Delete02Icon size={14} />
                          </Button>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-1.5 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1 min-w-0">
                        <UserIcon size={11} className="shrink-0" />
                        <span className="truncate">{doc.doctor || '—'}</span>
                      </div>
                      <div className="flex items-center gap-1 min-w-0">
                        <Calendar01Icon size={11} className="shrink-0" />
                        <span className="truncate font-mono">{doc.date}</span>
                      </div>
                      <div className="flex items-center gap-1 col-span-2 min-w-0">
                        <Hospital01Icon size={11} className="shrink-0" />
                        <span className="truncate">{doc.hospital || '—'}</span>
                      </div>
                    </div>

                    {doc.medicines && doc.medicines.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-1.5 border-t">
                        {doc.medicines.map((m, i) => (
                          <Badge
                            key={i}
                            variant="secondary"
                            className="text-[10px] font-normal"
                          >
                            {m}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Preview modal */}
      {previewDoc && (
        <div
          className="fixed inset-0 bg-background/80 backdrop-blur-xs z-50 flex items-center justify-center p-4 transition-all"
          onClick={() => setPreviewDoc(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-card border rounded-lg w-full max-w-3xl h-[85vh] flex flex-col shadow-lg overflow-hidden"
            role="dialog"
            aria-label={previewDoc.name}
          >
            <div className="p-4 border-b flex items-center justify-between gap-4">
              <div className="min-w-0">
                <h3 className="font-semibold text-foreground truncate text-sm sm:text-base">
                  {previewDoc.name}
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {previewDoc.doctor} • {previewDoc.hospital} • {previewDoc.date}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setPreviewDoc(null)}
                className="h-8 w-8 p-0"
              >
                <Cancel01Icon size={16} />
              </Button>
            </div>

            <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-muted/20">
              {previewDoc.fileUrl.startsWith('data:image/') || previewDoc.fileUrl.startsWith('http') ? (
                <img
                  src={previewDoc.fileUrl}
                  alt={previewDoc.name}
                  className="max-w-full max-h-full object-contain rounded border shadow-xs"
                />
              ) : previewDoc.fileUrl.startsWith('data:application/pdf') ? (
                <iframe
                  src={previewDoc.fileUrl}
                  title={previewDoc.name}
                  className="w-full h-full rounded border bg-white"
                />
              ) : (
                <div className="text-center p-6 text-muted-foreground">
                  <File01Icon size={36} className="mx-auto mb-2 opacity-50" />
                  <p className="font-medium text-xs">PDF / Clinical Document</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Documents;

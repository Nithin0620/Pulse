import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type LanguageCode = 'hi' | 'ta' | 'gu' | 'mr' | 'te' | 'bn' | 'kn' | 'ml' | 'en';

export interface Translations {
  appName: string;
  homeTab: string;
  medicinesTab: string;
  vitalsTab: string;
  documentsTab: string;
  assistantTab: string;
  appointmentsTab: string;
  nearbyTab: string;
  reportsTab: string;
  profileTab: string;
  settingsTab: string;
  micPrompt: string;
  micListening: string;
  nextDose: string;
  takenButton: string;
  doseTaken: string;
  streakText: string;
  todayProgress: string;
  addMedTitle: string;
  addMedVoice: string;
  addMedScan: string;
  addMedManual: string;
  medName: string;
  dosage: string;
  frequency: string;
  timing: string;
  saveMed: string;
  cancel: string;
  docTitle: string;
  uploadDoc: string;
  scanPrescription: string;
  doctorName: string;
  hospitalName: string;
  dateText: string;
  extractedMeds: string;
  reportTitle: string;
  adherenceRate: string;
  missedDoses: string;
  chatPlaceholder: string;
  botWelcome: string;
  sosAlert: string;
  emergencyTrigger: string;
  linkCaregiver: string;
}

export const translationMap: Record<LanguageCode, Translations> = {
  hi: {
    appName: "पल्स (PULSE)",
    homeTab: "मुख्य",
    medicinesTab: "दवाइयाँ",
    vitalsTab: "वाइटल्स",
    documentsTab: "दस्तावेज़",
    assistantTab: "एआई सहायक",
    appointmentsTab: "अपॉइंटमेंट",
    nearbyTab: "पास की देखभाल",
    reportsTab: "रिपोर्ट",
    profileTab: "प्रोफ़ाइल",
    settingsTab: "सेटिंग्स",
    micPrompt: "दवाई जोड़ने या बात करने के लिए बटन दबाएं",
    micListening: "सुन रहा हूँ... बोलिए...",
    nextDose: "अगली खुराक",
    takenButton: "दवाई ले ली",
    doseTaken: "दवाई ली जा चुकी है",
    streakText: "दिनों का लगातार रिकॉर्ड",
    todayProgress: "आज की दवाइयाँ",
    addMedTitle: "नई दवाई जोड़ें",
    addMedVoice: "आवाज से जोड़ें",
    addMedScan: "पर्चा स्कैन करें",
    addMedManual: "लिख कर जोड़ें",
    medName: "दवाई का नाम",
    dosage: "खुराक (मात्रा)",
    frequency: "दिन में कितनी बार",
    timing: "लेने का समय",
    saveMed: "दवाई सुरक्षित करें",
    cancel: "रद्द करें",
    docTitle: "पर्चे और रिपोर्ट्स",
    uploadDoc: "नया दस्तावेज़ अपलोड करें",
    scanPrescription: "पर्चे को स्कैन करें",
    doctorName: "डॉक्टर का नाम",
    hospitalName: "अस्पताल का नाम",
    dateText: "तारीख",
    extractedMeds: "पहचानी गई दवाइयाँ",
    reportTitle: "दवाई लेने का रिकॉर्ड",
    adherenceRate: "नियमितता दर",
    missedDoses: "छूटी हुई दवाइयाँ",
    chatPlaceholder: "सवाल पूछें या बोलें...",
    botWelcome: "नमस्ते! मैं आपका पल्स सहायक हूँ। अपनी दवाइयों या स्वास्थ्य के बारे में कुछ भी पूछें।",
    sosAlert: "आपातकालीन मदद (SOS)",
    emergencyTrigger: "मदद के लिए 3 सेकंड दबाएं",
    linkCaregiver: "केयरगिवर लिंक करें",
  },
  en: {
    appName: "PULSE",
    homeTab: "Dashboard",
    medicinesTab: "Medicines",
    vitalsTab: "Vitals & Pulse",
    documentsTab: "Prescriptions",
    assistantTab: "AI Assistant",
    appointmentsTab: "Appointments",
    nearbyTab: "Nearby Care",
    reportsTab: "Adherence",
    profileTab: "Profile",
    settingsTab: "Settings",
    micPrompt: "Tap mic to add medicine or speak",
    micListening: "Listening... speak now...",
    nextDose: "Next Scheduled Dose",
    takenButton: "Mark as Taken",
    doseTaken: "Dose Logged",
    streakText: "Day Adherence Streak",
    todayProgress: "Today's Schedule",
    addMedTitle: "Add New Medication",
    addMedVoice: "Voice Input",
    addMedScan: "Scan Prescription",
    addMedManual: "Manual Entry",
    medName: "Medication Name",
    dosage: "Dosage (e.g. 500mg)",
    frequency: "Frequency",
    timing: "Time of Day",
    saveMed: "Save Medication",
    cancel: "Cancel",
    docTitle: "Prescriptions & Reports",
    uploadDoc: "Upload Document",
    scanPrescription: "Scan Prescription",
    doctorName: "Doctor's Name",
    hospitalName: "Clinic / Hospital",
    dateText: "Date",
    extractedMeds: "Detected Medications",
    reportTitle: "Medication Adherence",
    adherenceRate: "Adherence Rate",
    missedDoses: "Missed Doses",
    chatPlaceholder: "Ask about medications, side effects...",
    botWelcome: "Hello! I am Pulse Assistant. Ask me anything about your medicines or health.",
    sosAlert: "Emergency SOS",
    emergencyTrigger: "Hold 3s for SOS alert",
    linkCaregiver: "Link Caregiver",
  },
  ta: {
    appName: "பல்ஸ் (PULSE)",
    homeTab: "முகப்பு",
    medicinesTab: "மருந்துகள்",
    vitalsTab: "உடல் நலம்",
    documentsTab: "ஆவணங்கள்",
    assistantTab: "உதவியாளர்",
    appointmentsTab: "முன்பதிவு",
    nearbyTab: "அருகிலுள்ளவை",
    reportsTab: "அறிக்கை",
    profileTab: "விவரக்குறிப்பு",
    settingsTab: "அமைப்புகள்",
    micPrompt: "பேச பொத்தானை அழுத்தவும்",
    micListening: "கேட்கிறது...",
    nextDose: "அடுத்த வேளை மருந்து",
    takenButton: "சாப்பிட்டேன்",
    doseTaken: "எடுக்கப்பட்டது",
    streakText: "நாட்கள் தொடர்ச்சி",
    todayProgress: "இன்றைய மருந்துகள்",
    addMedTitle: "புதிய மருந்து சேர்",
    addMedVoice: "குரல் மூலம்",
    addMedScan: "சீட்டு ஸ்கேன்",
    addMedManual: "எழுதி சேர்க்க",
    medName: "மருந்தின் பெயர்",
    dosage: "அளவு",
    frequency: "எத்தனை முறை",
    timing: "நேரம்",
    saveMed: "சேமி",
    cancel: "ரத்து",
    docTitle: "மருத்துவ ஆவணங்கள்",
    uploadDoc: "ஆவணம் பதிவேற்று",
    scanPrescription: "சீட்டு ஸ்கேன்",
    doctorName: "மருத்துவர் பெயர்",
    hospitalName: "மருத்துவமனை",
    dateText: "தேதி",
    extractedMeds: "கண்டறியப்பட்ட மருந்துகள்",
    reportTitle: "மருந்து அறிக்கை",
    adherenceRate: "பின்பற்றுதல் விகிதம்",
    missedDoses: "தவறிய மருந்துகள்",
    chatPlaceholder: "கேளுங்கள்...",
    botWelcome: "வணக்கம்! உங்கள் பல்ஸ் உதவியாளர் நான்.",
    sosAlert: "அவசர உதவி (SOS)",
    emergencyTrigger: "அவசரத்திற்கு அழுத்தவும்",
    linkCaregiver: "பராமரிப்பாளர் இணைப்பு",
  },
  te: {
    appName: "పల్స్ (PULSE)",
    homeTab: "హోమ్",
    medicinesTab: "మందులు",
    vitalsTab: "వైటల్స్",
    documentsTab: "పత్రాలు",
    assistantTab: "సహాయకుడు",
    appointmentsTab: "అపాయింట్‌మెంట్లు",
    nearbyTab: "సమీప సంరక్షణ",
    reportsTab: "నివేదికలు",
    profileTab: "ప్రొఫైల్",
    settingsTab: "సెట్టింగ్‌లు",
    micPrompt: "మాట్లాడటానికి మైక్ నొక్కండి",
    micListening: "వింటున్నాను...",
    nextDose: "తదుపరి మోతాదు",
    takenButton: "తీసుకున్నాను",
    doseTaken: "తీసుకున్నట్లు గుర్తించబడింది",
    streakText: "రోజుల రికార్డు",
    todayProgress: "నేటి షెడ్యూల్",
    addMedTitle: "కొత్త మందును జోడించండి",
    addMedVoice: "వాయిస్ ద్వారా",
    addMedScan: "స్కాన్ చేయండి",
    addMedManual: "వ్రాయండి",
    medName: "మందు పేరు",
    dosage: "మోతాదు",
    frequency: "ఫ్రీక్వెన్సీ",
    timing: "సమయం",
    saveMed: "సేవ్ చేయండి",
    cancel: "రద్దు",
    docTitle: "ప్రిస్క్రిప్షన్లు",
    uploadDoc: "అప్‌లోడ్ చేయండి",
    scanPrescription: "స్కాన్ ప్రిస్క్రిప్షన్",
    doctorName: "డాక్టర్ పేరు",
    hospitalName: "ఆసుపత్రి",
    dateText: "తేదీ",
    extractedMeds: "గుర్తించిన మందులు",
    reportTitle: "నివేదిక",
    adherenceRate: "సమ్మతి రేటు",
    missedDoses: "మిస్ అయినవి",
    chatPlaceholder: "అడగండి...",
    botWelcome: "నమస్కారం! నేను మీ పల్స్ సహాయకుడిని.",
    sosAlert: "అత్యవసర SOS",
    emergencyTrigger: "సహాయం కోసం నొక్కండి",
    linkCaregiver: "కేర్‌గివర్‌ని లింక్ చేయండి",
  },
  gu: {
    appName: "પલ્સ (PULSE)",
    homeTab: "મુખ્ય",
    medicinesTab: "દવાઓ",
    vitalsTab: "વાઇટલ્સ",
    documentsTab: "દસ્તાવેજો",
    assistantTab: "સહાયક",
    appointmentsTab: "મુલાકાતો",
    nearbyTab: "નજીકની હોસ્પિટલ",
    reportsTab: "અહેવાલ",
    profileTab: "પ્રોફાઇલ",
    settingsTab: "સેટિંગ્સ",
    micPrompt: "બોલવા માટે માઇક દબાવો",
    micListening: "સાંભળી રહ્યું છે...",
    nextDose: "આગામી ડોઝ",
    takenButton: "દવા લઈ લીધી",
    doseTaken: "નોંધાઈ ગઈ",
    streakText: "દિવસોનો રેકોર્ડ",
    todayProgress: "આજનું સમયપત્રક",
    addMedTitle: "નવી દવા ઉમેરો",
    addMedVoice: "અવાજ દ્વારા",
    addMedScan: "સ્કેન કરો",
    addMedManual: "લખીને ઉમેરો",
    medName: "દવાનું નામ",
    dosage: "માત્રા",
    frequency: "વારંવારતા",
    timing: "સમય",
    saveMed: "સાચવો",
    cancel: "રદ કરો",
    docTitle: "દસ્તાવેજો",
    uploadDoc: "અપલોડ કરો",
    scanPrescription: "સ્કેન પ્રિસ્ક્રિપ્શન",
    doctorName: "ડોક્ટરનું નામ",
    hospitalName: "હોસ્પિટલ",
    dateText: "તારીખ",
    extractedMeds: "શોધાયેલ દવાઓ",
    reportTitle: "અહેવાલ",
    adherenceRate: "નિયમિતતા દર",
    missedDoses: "ચૂકી ગયેલ ડોઝ",
    chatPlaceholder: "પૂછો...",
    botWelcome: "નમસ્તે! હું તમારો પલ્સ સહાયક છું.",
    sosAlert: "ઇમરજન્સી SOS",
    emergencyTrigger: "મદદ માટે દબાવો",
    linkCaregiver: "સંભાળ રાખનાર લિંક કરો",
  },
  mr: {
    appName: "पल्स (PULSE)",
    homeTab: "मुख्य",
    medicinesTab: "औषधे",
    vitalsTab: "व्हायटल्स",
    documentsTab: "कागदपत्रे",
    assistantTab: "एआय सहाय्यक",
    appointmentsTab: "भेटी",
    nearbyTab: "जवळपासची काळजी",
    reportsTab: "अहवाल",
    profileTab: "प्रोफाइल",
    settingsTab: "सेटिंग्ज",
    micPrompt: "बोलण्यासाठी माइक दाबा",
    micListening: "ऐकत आहे...",
    nextDose: "पुढील डोस",
    takenButton: "औषध घेतले",
    doseTaken: "नोंद झाली",
    streakText: "दिवसांचा विक्रम",
    todayProgress: "आजचे वेळापत्रक",
    addMedTitle: "नवीन औषध जोडा",
    addMedVoice: "आवाजाने जोडा",
    addMedScan: "प्रिस्क्रिप्शन स्कॅन करा",
    addMedManual: "लिहून जोडा",
    medName: "औषधाचे नाव",
    dosage: "डोस",
    frequency: "वारंवारता",
    timing: "वेळ",
    saveMed: "जतन करा",
    cancel: "रद्द करा",
    docTitle: "कागदपत्रे",
    uploadDoc: "अपलोड करा",
    scanPrescription: "स्कॅन करा",
    doctorName: "डॉक्टरांचे नाव",
    hospitalName: "रुग्णालय",
    dateText: "तारीख",
    extractedMeds: "शोधलेली औषधे",
    reportTitle: "अहवाल",
    adherenceRate: "नियमितता दर",
    missedDoses: "सुटलेले डोस",
    chatPlaceholder: "विचारा...",
    botWelcome: "नमस्कार! मी आपला पल्स सहाय्यक आहे.",
    sosAlert: "तातडीची मदत (SOS)",
    emergencyTrigger: "मदतीसाठी दाबा",
    linkCaregiver: "काळजीवाहू जोडा",
  },
  bn: {
    appName: "পালস (PULSE)",
    homeTab: "হোম",
    medicinesTab: "ওষুধ",
    vitalsTab: "ভাইটালস",
    documentsTab: "প্রেসক্রিপশন",
    assistantTab: "সহায়ক",
    appointmentsTab: "অ্যাপয়েন্টমেন্ট",
    nearbyTab: "নিকটবর্তী সেবা",
    reportsTab: "রিপোর্ট",
    profileTab: "প্রোফাইল",
    settingsTab: "সেটিংস",
    micPrompt: "কথা বলতে মাইক চাপুন",
    micListening: "শুনছি...",
    nextDose: "পরবর্তী ডোজ",
    takenButton: "ওষুধ খেয়েছি",
    doseTaken: "গৃহীত",
    streakText: "দিনের রেকর্ড",
    todayProgress: "আজকের সময়সূচী",
    addMedTitle: "নতুন ওষুধ যোগ করুন",
    addMedVoice: "ভয়েস দ্বারা",
    addMedScan: "স্ক্যান করুন",
    addMedManual: "লিখে যোগ করুন",
    medName: "ওষুধের নাম",
    dosage: "ডোজ",
    frequency: "কতবার",
    timing: "সময়",
    saveMed: "সংরক্ষণ",
    cancel: "বাতিল",
    docTitle: "নথিপত্র",
    uploadDoc: "আপলোড করুন",
    scanPrescription: "স্ক্যান প্রেসক্রিপশন",
    doctorName: "ডাক্তারের নাম",
    hospitalName: "হাসপাতাল",
    dateText: "তারিখ",
    extractedMeds: "শনাক্ত ওষুধ",
    reportTitle: "রিপোর্ট",
    adherenceRate: "নিয়মিততার হার",
    missedDoses: "ছুটে যাওয়া ডোজ",
    chatPlaceholder: "জিজ্ঞাসা করুন...",
    botWelcome: "নমস্কার! আমি আপনার পালস সহকারী।",
    sosAlert: "জরুরী SOS",
    emergencyTrigger: "জরুরীর জন্য চাপুন",
    linkCaregiver: "কেয়ারগিভার লিঙ্ক করুন",
  },
  kn: {
    appName: "ಪಲ್ಸ್ (PULSE)",
    homeTab: "ಮುಖಪುಟ",
    medicinesTab: "ಔಷಧಿಗಳು",
    vitalsTab: "ವೈಟಲ್ಸ್",
    documentsTab: "ದಾಖಲೆಗಳು",
    assistantTab: "ಸಹಾಯಕ",
    appointmentsTab: "ಅಪಾಯಿಂಟ್‌ಮೆಂಟ್‌ಗಳು",
    nearbyTab: "ಹತ್ತಿರದ ಆರೈಕೆ",
    reportsTab: "ವರದಿ",
    profileTab: "ಪ್ರೊಫೈಲ್",
    settingsTab: "ಸೆಟ್ಟಿಂಗ್ಸ್",
    micPrompt: "ಮಾತನಾಡಲು ಮೈಕ್ ಒತ್ತಿ",
    micListening: "ಕೇಳಿಸಿಕೊಳ್ಳುತ್ತಿದ್ದೇನೆ...",
    nextDose: "ಮುಂದಿನ ಡೋಸ್",
    takenButton: "ತೆಗೆದುಕೊಂಡೆ",
    doseTaken: "ದಾಖಲಾಗಿದೆ",
    streakText: "ದಿನಗಳ ದಾಖಲೆ",
    todayProgress: "ಇಂದಿನ ವೇಳಾಪಟ್ಟಿ",
    addMedTitle: "ಹೊಸ ಔಷಧಿ ಸೇರಿಸಿ",
    addMedVoice: "ಧ್ವನಿಯ ಮೂಲಕ",
    addMedScan: "ಸ್ಕ್ಯಾನ್ ಮಾಡಿ",
    addMedManual: "ಬರೆದು ಸೇರಿಸಿ",
    medName: "ಔಷಧಿಯ ಹೆಸರು",
    dosage: "ಡೋಸೇಜ್",
    frequency: "ಆವರ್ತನ",
    timing: "ಸಮಯ",
    saveMed: "ಉಳಿಸಿ",
    cancel: "ರದ್ದುಮಾಡಿ",
    docTitle: "ದಾಖಲೆಗಳು",
    uploadDoc: "ಅಪ್‌ಲೋಡ್ ಮಾಡಿ",
    scanPrescription: "ಪ್ರಿಸ್ಕ್ರಿಪ್ಷನ್ ಸ್ಕ್ಯಾನ್",
    doctorName: "ವೈದ್ಯರ ಹೆಸರು",
    hospitalName: "ಆಸ್ಪತ್ರೆ",
    dateText: "ದಿನಾಂಕ",
    extractedMeds: "ಪತ್ತೆಯಾದ ಔಷಧಿಗಳು",
    reportTitle: "ವರದಿ",
    adherenceRate: "ಅನುಸರಣೆ ದರ",
    missedDoses: "ತಪ್ಪಿದ ಡೋಸ್‌ಗಳು",
    chatPlaceholder: "ಕೇಳಿ...",
    botWelcome: "ನಮಸ್ಕಾರ! ನಾನು ನಿಮ್ಮ ಪಲ್ಸ್ ಸಹಾಯಕ.",
    sosAlert: "ತುರ್ತು SOS",
    emergencyTrigger: "ತುರ್ತು ಸಹಾಯಕ್ಕಾಗಿ ಒತ್ತಿ",
    linkCaregiver: "ಆರೈಕೆದಾರರನ್ನು ಲಿಂಕ್ ಮಾಡಿ",
  },
  ml: {
    appName: "പൾസ് (PULSE)",
    homeTab: "ഹോം",
    medicinesTab: "മരുന്നുകൾ",
    vitalsTab: "വൈറ്റൽസ്",
    documentsTab: "രേഖകൾ",
    assistantTab: "സഹായി",
    appointmentsTab: "അപ്പോയിന്റ്മെന്റുകൾ",
    nearbyTab: "സമീപമുള്ളവ",
    reportsTab: "റിപ്പോർട്ട്",
    profileTab: "പ്രൊഫൈൽ",
    settingsTab: "ക്രമീകരണങ്ങൾ",
    micPrompt: "സംസാരിക്കാൻ മൈക്ക് അമർത്തുക",
    micListening: "കേൾക്കുന്നു...",
    nextDose: "അടുത്ത ഡോസ്",
    takenButton: "കഴിച്ചു",
    doseTaken: "രേഖപ്പെടുത്തി",
    streakText: "തുടർച്ചയായ ദിവസങ്ങൾ",
    todayProgress: "ഇന്നത്തെ ഷെഡ്യൂൾ",
    addMedTitle: "പുതിയ മരുന്ന് ചേർക്കുക",
    addMedVoice: "ശബ്ദത്തിലൂടെ",
    addMedScan: "സ്കാൻ ചെയ്യുക",
    addMedManual: "എഴുതി ചേർക്കുക",
    medName: "മരുന്നിന്റെ പേര്",
    dosage: "അളവ്",
    frequency: "എത്ര തവണ",
    timing: "സമയം",
    saveMed: "സൂക്ഷിക്കുക",
    cancel: "റദ്ദാക്കുക",
    docTitle: "രേഖകൾ",
    uploadDoc: "അപ്‌ലോഡ് ചെയ്യുക",
    scanPrescription: "സ്കാൻ ചെയ്യുക",
    doctorName: "ഡോക്ടറുടെ പേര്",
    hospitalName: "ആശുപത്രി",
    dateText: "തീയതി",
    extractedMeds: "കണ്ടെത്തിയ മരുന്നുകൾ",
    reportTitle: "റിപ്പോർട്ട്",
    adherenceRate: "കൃത്യതാ നിരക്ക്",
    missedDoses: "വിട്ടുപോയ ഡോസുകൾ",
    chatPlaceholder: "ചോദിക്കൂ...",
    botWelcome: "നമസ്കാരം! ഞാൻ നിങ്ങളുടെ പൾസ് സഹായിയാണ്.",
    sosAlert: "അടിയന്തര SOS",
    emergencyTrigger: "സഹായത്തിനായി അമർത്തുക",
    linkCaregiver: "കെയർഗിവറെ ബന്ധിപ്പിക്കുക",
  },
};

export const LANGUAGES: { code: LanguageCode; name: string; nativeName: string }[] = [
  { code: 'hi', name: 'Hindi', nativeName: 'हिंदी' },
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்' },
  { code: 'te', name: 'Telugu', nativeName: 'తెలుగు' },
  { code: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી' },
  { code: 'mr', name: 'Marathi', nativeName: 'मराठी' },
  { code: 'bn', name: 'Bengali', nativeName: 'বাংলা' },
  { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ' },
  { code: 'ml', name: 'Malayalam', nativeName: 'മലയാളം' },
];

export type FontSize = 'normal' | 'large' | 'extra-large';

interface SettingsContextType {
  language: LanguageCode;
  setLanguage: (lang: LanguageCode) => void;
  fontSize: FontSize;
  setFontSize: (size: FontSize) => void;
  highContrast: boolean;
  setHighContrast: (val: boolean) => void;
  voiceFeedback: boolean;
  setVoiceFeedback: (val: boolean) => void;
  t: Translations;
  fontScale: number;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<LanguageCode>('hi');
  const [fontSize, setFontSizeState] = useState<FontSize>('large');
  const [highContrast, setHighContrastState] = useState<boolean>(false);
  const [voiceFeedback, setVoiceFeedbackState] = useState<boolean>(true);

  useEffect(() => {
    (async () => {
      try {
        const savedLang = await AsyncStorage.getItem('pulse_lang');
        if (savedLang && (savedLang in translationMap)) {
          setLanguageState(savedLang as LanguageCode);
        }
        const savedFont = await AsyncStorage.getItem('pulse_font_size');
        if (savedFont) setFontSizeState(savedFont as FontSize);
        const savedContrast = await AsyncStorage.getItem('pulse_high_contrast');
        if (savedContrast) setHighContrastState(savedContrast === 'true');
        const savedVoice = await AsyncStorage.getItem('pulse_voice_feedback');
        if (savedVoice) setVoiceFeedbackState(savedVoice === 'true');
      } catch (e) {
        console.warn('Failed to load settings', e);
      }
    })();
  }, []);

  const setLanguage = (lang: LanguageCode) => {
    setLanguageState(lang);
    AsyncStorage.setItem('pulse_lang', lang).catch(console.warn);
  };

  const setFontSize = (size: FontSize) => {
    setFontSizeState(size);
    AsyncStorage.setItem('pulse_font_size', size).catch(console.warn);
  };

  const setHighContrast = (val: boolean) => {
    setHighContrastState(val);
    AsyncStorage.setItem('pulse_high_contrast', String(val)).catch(console.warn);
  };

  const setVoiceFeedback = (val: boolean) => {
    setVoiceFeedbackState(val);
    AsyncStorage.setItem('pulse_voice_feedback', String(val)).catch(console.warn);
  };

  const fontScale = fontSize === 'extra-large' ? 1.3 : fontSize === 'large' ? 1.15 : 1.0;
  const t = translationMap[language] || translationMap.en;

  return (
    <SettingsContext.Provider
      value={{
        language,
        setLanguage,
        fontSize,
        setFontSize,
        highContrast,
        setHighContrast,
        voiceFeedback,
        setVoiceFeedback,
        t,
        fontScale,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used within SettingsProvider');
  return ctx;
};

import React, { createContext, useContext, useState, useEffect } from 'react';
import { SarvamService } from '../services/sarvamService';

export type LanguageCode = 'hi' | 'ta' | 'gu' | 'mr' | 'te' | 'bn' | 'kn' | 'ml' | 'en';

export interface Translations {
  appName: string;
  homeTab: string;
  medicinesTab: string;
  documentsTab: string;
  reportsTab: string;
  caregiverTab: string;
  micPrompt: string;
  micListening: string;
  nextDose: string;
  takenButton: string;
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
  docTitle: string;
  uploadDoc: string;
  scanPrescription: string;
  doctorName: string;
  hospitalName: string;
  dateText: string;
  extractedMeds: string;
  driveBackup: string;
  backupSuccess: string;
  exportPdf: string;
  reportTitle: string;
  adherenceRate: string;
  missedDoses: string;
  chatWithCaregiver: string;
  chatPlaceholder: string;
  botWelcome: string;
  apiKeySettings: string;
  saveKeys: string;
  keysSaved: string;
  demoMode: string;
  jsonBackup: string;
  importJson: string;
  exportJson: string;
  viewInline: string;
}

export const translationMap: Record<LanguageCode, Translations> = {
  hi: {
    appName: "पल्स (PULSE)",
    homeTab: "मुख्य",
    medicinesTab: "दवाइयाँ",
    documentsTab: "दस्तावेज़",
    reportsTab: "रिपोर्ट",
    caregiverTab: "मददगार",
    micPrompt: "दवाई जोड़ने या बात करने के लिए बटन दबाएं",
    micListening: "सुन रहा हूँ... बोलिए...",
    nextDose: "अगली खुराक",
    takenButton: "दवाई ले ली",
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
    docTitle: "पर्चे और रिपोर्ट्स",
    uploadDoc: "नया दस्तावेज़ अपलोड करें",
    scanPrescription: "पर्चे को स्कैन करें",
    doctorName: "डॉक्टर का नाम",
    hospitalName: "अस्पताल का नाम",
    dateText: "तारीख",
    extractedMeds: "पहचानी गई दवाइयाँ",
    driveBackup: "गूगल ड्राइव बैकअप",
    backupSuccess: "ड्राइव पर सुरक्षित हो गया!",
    exportPdf: "डॉक्टर के लिए PDF डाउनलोड करें",
    reportTitle: "दवाई लेने का रिकॉर्ड",
    adherenceRate: "नियमितता दर",
    missedDoses: "छूटी हुई दवाइयाँ",
    chatWithCaregiver: "केयरगिवर से बात करें",
    chatPlaceholder: "सवाल पूछें या बोलें...",
    botWelcome: "नमस्ते! मैं आपका पल्स केयरगिवर हूँ। अपनी दवाइयों या स्वास्थ्य के बारे में कुछ भी पूछें।",
    apiKeySettings: "डेवलपर सेटिंग्स (API Keys)",
    saveKeys: "कुंजियाँ सुरक्षित करें",
    keysSaved: "सेटिंग्स सुरक्षित हो गईं!",
    demoMode: "डेमो मोड (सक्रिय)",
    jsonBackup: "फ़ाइल बैकअप (JSON)",
    importJson: "बैकअप लोड करें",
    exportJson: "बैकअप डाउनलोड करें",
    viewInline: "पर्चा देखें"
  },
  ta: {
    appName: "பல்ஸ் (PULSE)",
    homeTab: "முகப்பு",
    medicinesTab: "மருந்துகள்",
    documentsTab: "ஆவணங்கள்",
    reportsTab: "அறிக்கை",
    caregiverTab: "உதவியாளர்",
    micPrompt: "மருந்து சேர்க்க அல்லது பேச பொத்தானை அழுத்தவும்",
    micListening: "கேட்கிறது... பேசுங்கள்...",
    nextDose: "அடுத்த வேளை மருந்து",
    takenButton: "மருந்து சாப்பிட்டேன்",
    streakText: "நாட்கள் தொடர்ச்சி",
    todayProgress: "இன்றைய மருந்துகள்",
    addMedTitle: "புதிய மருந்து சேர்",
    addMedVoice: "குரல் மூலம் சேர்க்க",
    addMedScan: "சீட்டை ஸ்கேன் செய்ய",
    addMedManual: "எழுதி சேர்க்க",
    medName: "மருந்தின் பெயர்",
    dosage: "அளவு (டோஸ்)",
    frequency: "ஒரு நாளைக்கு எத்தனை முறை",
    timing: "சாப்பிடும் நேரம்",
    saveMed: "மருந்தைச் சேமிக்கவும்",
    docTitle: "மருந்து சீட்டுகள் & அறிக்கைகள்",
    uploadDoc: "புதிய ஆவணத்தை பதிவேற்றவும்",
    scanPrescription: "சீட்டை ஸ்கேன் செய்",
    doctorName: "மருத்துவர் பெயர்",
    hospitalName: "மருத்துவமனை பெயர்",
    dateText: "தேதி",
    extractedMeds: "கண்டறியப்பட்ட மருந்துகள்",
    driveBackup: "கூகுள் டிரைவ் பேக்கப்",
    backupSuccess: "டிரைவில் சேமிக்கப்பட்டது!",
    exportPdf: "மருத்துவருக்கான PDF பதிவிறக்கம்",
    reportTitle: "மருந்து உட்கொள்ளல் அறிக்கை",
    adherenceRate: "தவறாத விகிதம்",
    missedDoses: "தவறிய மருந்துகள்",
    chatWithCaregiver: "உதவியாளருடன் உரையாடு",
    chatPlaceholder: "கேள்வி கேளுங்கள் அல்லது பேசுங்கள்...",
    botWelcome: "வணக்கம்! நான் உங்கள் பல்ஸ் உதவியாளர். உங்கள் மருந்துகள் அல்லது ஆரோக்கியம் பற்றி எதுவும் கேளுங்கள்.",
    apiKeySettings: "டெவலப்பர் அமைப்புகள் (API Keys)",
    saveKeys: "சேமிக்கவும்",
    keysSaved: "அமைப்புகள் சேமிக்கப்பட்டன!",
    demoMode: "டெமோ பயன்முறை (செயலில் உள்ளது)",
    jsonBackup: "கோப்பு காப்புப்பிரதி (JSON)",
    importJson: "காப்புப்பிரதியை ஏற்று",
    exportJson: "காப்புப்பிரதியை இறக்கு",
    viewInline: "சீட்டைப் பார்"
  },
  gu: {
    appName: "પલ્સ (PULSE)",
    homeTab: "મુખ્ય પેજ",
    medicinesTab: "દવાઓ",
    documentsTab: "દસ્તાવેજો",
    reportsTab: "રિપોર્ટ",
    caregiverTab: "સહાયક",
    micPrompt: "દવા ઉમેરવા અથવા વાત કરવા માટે બટન દબાવો",
    micListening: "સાંભળી રહ્યો છું... બોલો...",
    nextDose: "આગલી દવા",
    takenButton: "દવા લઈ લીધી",
    streakText: "દિવસોની નિયમિતતા",
    todayProgress: "આજની દવાઓ",
    addMedTitle: "નવી દવા ઉમેરો",
    addMedVoice: "આવાજથી ઉમેરો",
    addMedScan: "પ્રિસ્ક્રિપ્શન સ્કેન કરો",
    addMedManual: "લખીને ઉમેરો",
    medName: "દવાનું નામ",
    dosage: "ડોઝ (માત્રા)",
    frequency: "દિવસમાં કેટલી વાર",
    timing: "લેવાનો સમય",
    saveMed: "દવા સુરક્ષિત કરો",
    docTitle: "પ્રિસ્ક્રિપ્શન્સ અને રિપોર્ટ",
    uploadDoc: "નવો દસ્તાવેજ અપલોડ કરો",
    scanPrescription: "પ્રિસ્ક્રિપ્શન સ્કેન કરો",
    doctorName: "ડોક્ટરનું નામ",
    hospitalName: "હોસ્પિટલનું નામ",
    dateText: "તારીખ",
    extractedMeds: "શોધાયેલ દવાઓ",
    driveBackup: "ગુગલ ડ્રાઇવ બેકઅપ",
    backupSuccess: "ડ્રાઇવ પર સુરક્ષિત થઈ ગયું!",
    exportPdf: "ડોક્ટર માટે PDF ડાઉનલોડ કરો",
    reportTitle: "દવા લેવાનો રિપોર્ટ",
    adherenceRate: "નિયમિતતા દર",
    missedDoses: "ચૂકી ગયેલી દવાઓ",
    chatWithCaregiver: "સહાયક સાથે વાત કરો",
    chatPlaceholder: "પ્રશ્ન પૂછો અથવા બોલો...",
    botWelcome: "નમસ્તે! હું તમારો પલ્સ સહાયક છું. તમારી દવાઓ અથવા સ્વાસ્થ્ય વિશે કંઈપણ પૂછો.",
    apiKeySettings: "ડેવલપર સેટિંગ્સ (API Keys)",
    saveKeys: "કી સુરક્ષિત કરો",
    keysSaved: "સેટિંગ્સ સુરક્ષિત થઈ ગઈ!",
    demoMode: "ડેમો મોડ (સક્રિય)",
    jsonBackup: "ફાઇલ બેકઅપ (JSON)",
    importJson: "બેકઅપ લોડ કરો",
    exportJson: "બેકઅપ ડાઉનલોડ કરો",
    viewInline: "પ્રિસ્ક્રિપ્શન જુઓ"
  },
  mr: {
    appName: "पल्स (PULSE)",
    homeTab: "मुख्य",
    medicinesTab: "औषधे",
    documentsTab: "कागदपत्रे",
    reportsTab: "अहवाल",
    caregiverTab: "मदतनीस",
    micPrompt: "औषध जोडण्यासाठी किंवा बोलण्यासाठी बटण दाबा",
    micListening: "ऐकत आहे... बोला...",
    nextDose: "पुढचा डोस",
    takenButton: "औषध घेतले",
    streakText: "दिवसांचा सलग विक्रम",
    todayProgress: "आजची औषधे",
    addMedTitle: "नवीन औषध जोडा",
    addMedVoice: "आवाजाने जोडा",
    addMedScan: "प्रिस्क्रिप्शन स्कॅन करा",
    addMedManual: "लिहून जोडा",
    medName: "औषधाचे नाव",
    dosage: "मात्रा (डोस)",
    frequency: "दिवसातून किती वेळा",
    timing: "घेण्याची वेळ",
    saveMed: "औषध जतन करा",
    docTitle: "प्रिस्क्रिप्शन्स आणि रिपोर्ट्स",
    uploadDoc: "नवीन कागदपत्र अपलोड करा",
    scanPrescription: "प्रिस्क्रिप्शन स्कॅन करा",
    doctorName: "डॉक्टरांचे नाव",
    hospitalName: "रुग्णालयाचे नाव",
    dateText: "तारीख",
    extractedMeds: "शोधलेली औषधे",
    driveBackup: "गूगल ड्राइव्ह बॅकअप",
    backupSuccess: "ड्राइव्हवर सुरक्षित झाले!",
    exportPdf: "डॉक्टरांसाठी PDF डाउनलोड करा",
    reportTitle: "औषध घेण्याचा अहवाल",
    adherenceRate: "नियमितता दर",
    missedDoses: "सुटलेली औषधे",
    chatWithCaregiver: "केअरगिव्हरशी बोला",
    chatPlaceholder: "प्रश्न विचारा किंवा बोला...",
    botWelcome: "नमस्कार! मी आपला पल्स केअरगिव्हर आहे. आपल्या औषधांबद्दल किंवा आरोग्याबद्दल काहीही विचारा.",
    apiKeySettings: "डेव्हलपर सेटिंग्स (API Keys)",
    saveKeys: "की जतन करा",
    keysSaved: "सेटिंग्ज जतन झाल्या!",
    demoMode: "डेमो मोड (सक्रिय)",
    jsonBackup: "फाइल बॅकअप (JSON)",
    importJson: "बॅकअप लोड करा",
    exportJson: "बॅकअप डाउनलोड करा",
    viewInline: "प्रिस्क्रिप्शन पहा"
  },
  te: {
    appName: "పల్స్ (PULSE)",
    homeTab: "హోమ్",
    medicinesTab: "మందులు",
    documentsTab: "పత్రాలు",
    reportsTab: "రిపోర్టు",
    caregiverTab: "సహాయకుడు",
    micPrompt: "మందును జోడించడానికి లేదా మాట్లాడటానికి బటన్ నొక్కండి",
    micListening: "వింటున్నాను... మాట్లాడండి...",
    nextDose: "తదుపరి మోతాదు",
    takenButton: "మందు వేసుకున్నాను",
    streakText: "రోజుల నిరంతర రికార్డు",
    todayProgress: "ఈరోజు మందులు",
    addMedTitle: "కొత్త మందును జోడించండి",
    addMedVoice: "వాయిస్ ద్వారా జోడించండి",
    addMedScan: "ప్రిస్క్రిప్షన్ స్కాన్ చేయండి",
    addMedManual: "రాసి జోడించండి",
    medName: "మందు పేరు",
    dosage: "మోతాదు (డోస్)",
    frequency: "రోజుకు ఎన్ని సార్లు",
    timing: "వేసుకునే సమయం",
    saveMed: "మందును సేవ్ చేయండి",
    docTitle: "ప్రిస్క్రిప్షన్స్ & రిపోర్టులు",
    uploadDoc: "కొత్త పత్రాన్ని అప్‌లోడ్ చేయండి",
    scanPrescription: "ప్రిస్క్రిప్షన్ స్కాన్ చేయి",
    doctorName: "డాక్టర్ పేరు",
    hospitalName: "హాస్పిటల్ పేరు",
    dateText: "తేదీ",
    extractedMeds: "గుర్తించిన మందులు",
    driveBackup: "గూగుల్ డ్రైవ్ బ్యాకప్",
    backupSuccess: "డ్రైవ్‌లో సేవ్ చేయబడింది!",
    exportPdf: "డాక్టర్ కోసం PDF డౌన్‌లోడ్",
    reportTitle: "మందులు వేసుకున్న రిపోర్టు",
    adherenceRate: "క్రమశిక్షణ రేటు",
    missedDoses: "మరచిపోయిన మందులు",
    chatWithCaregiver: "సహాయకుడితో మాట్లాడండి",
    chatPlaceholder: "ప్రశ్న అడగండి లేదా మాట్లాడండి...",
    botWelcome: "నమస్కారం! నేను మీ పల్స్ సహాయకుడిని. మీ మందులు లేదా ఆరోగ్యం గురించి ఏదైనా అడగండి.",
    apiKeySettings: "డెవలపర్ సెట్టింగ్స్ (API Keys)",
    saveKeys: "కీలను సేవ్ చేయి",
    keysSaved: "సెట్టింగ్స్ సేవ్ చేయబడ్డాయి!",
    demoMode: "డెమో మోడ్ (క్రియాశీలకంగా ఉంది)",
    jsonBackup: "ఫైల్ బ్యాకప్ (JSON)",
    importJson: "బ్యాకప్‌ను లోడ్ చేయి",
    exportJson: "బ్యాకప్‌ను డౌన్‌లోడ్ చేయి",
    viewInline: "ప్రిస్క్రిప్షన్ చూడు"
  },
  bn: {
    appName: "পালস (PULSE)",
    homeTab: "হোম",
    medicinesTab: "ওষুধসমূহ",
    documentsTab: "নথিপত্র",
    reportsTab: "রিপোর্ট",
    caregiverTab: "সাহায্যকারী",
    micPrompt: "ওষুধ যোগ করতে বা কথা বলতে বোতাম টিপুন",
    micListening: "শুনছি... বলুন...",
    nextDose: "পরবর্তী ডোজ",
    takenButton: "ওষুধ নিয়েছি",
    streakText: "দিনের ধারাবাহিক রেকর্ড",
    todayProgress: "আজকের ওষুধ",
    addMedTitle: "নতুন ওষুধ যোগ করুন",
    addMedVoice: "কণ্ঠস্বরে যোগ করুন",
    addMedScan: "প্রেসক্রিপশন স্ক্যান করুন",
    addMedManual: "লিখে যোগ করুন",
    medName: "ওষুধের নাম",
    dosage: "মাত্রা (ডোজ)",
    frequency: "দিনে কতবার",
    timing: "নেওয়ার সময়",
    saveMed: "ওষুধ সংরক্ষণ করুন",
    docTitle: "প্রেসক্রিপশন ও রিপোর্ট",
    uploadDoc: "নতুন নথি আপলোড করুন",
    scanPrescription: "প্রেসক্রিপশন স্ক্যান করুন",
    doctorName: "ডাক্তারের নাম",
    hospitalName: "হাসপাতালের নাম",
    dateText: "তারিখ",
    extractedMeds: "শনাক্তকৃত ওষুধসমূহ",
    driveBackup: "গুগল ড্রাইভ ব্যাকআপ",
    backupSuccess: "ড্রাইভে সুরক্ষিত করা হয়েছে!",
    exportPdf: "ডাক্তারের জন্য PDF ডাউনলোড",
    reportTitle: "ওষুধ খাওয়ার রিপোর্ট",
    adherenceRate: "নিয়মিততার হার",
    missedDoses: "ছুটে যাওয়া ওষুধ",
    chatWithCaregiver: "সাহায্যকারীর সাথে কথা বলুন",
    chatPlaceholder: "প্রশ্ন জিজ্ঞাসা করুন বা বলুন...",
    botWelcome: "নমস্কার! আমি আপনার পালস সাহায্যকারী। আপনার ওষুধ বা স্বাস্থ্য সম্পর্কে যেকোনো কিছু জিজ্ঞাসা করুন।",
    apiKeySettings: "ডেভেলপার সেটিংস (API Keys)",
    saveKeys: "চাবি সংরক্ষণ করুন",
    keysSaved: "সেটিংস সংরক্ষিত হয়েছে!",
    demoMode: "ডেমো মোড (সক্রিয়)",
    jsonBackup: "ফাইল ব্যাকআপ (JSON)",
    importJson: "ব্যাকআপ লোড করুন",
    exportJson: "ব্যাকআপ ডাউনলোড করুন",
    viewInline: "প্রেসক্রিপশন দেখুন"
  },
  kn: {
    appName: "ಪಲ್ಸ್ (PULSE)",
    homeTab: "ಮುಖಪುಟ",
    medicinesTab: "ದಿನಸಿಗಳು",
    documentsTab: "ದಾಖಲೆಗಳು",
    reportsTab: "ವರದಿ",
    caregiverTab: "ಸಹಾಯಕ",
    micPrompt: "ಔಷಧಿ ಸೇರಿಸಲು ಅಥವಾ ಮಾತನಾಡಲು ಬಟನ್ ಒತ್ತಿ",
    micListening: "ಕೇಳುತ್ತಿದೆ... ಮಾತನಾಡಿ...",
    nextDose: "ಮುಂದಿನ ಡೋಸ್",
    takenButton: "ಔಷಧಿ ತೆಗೆದುಕೊಂಡಿದ್ದೇನೆ",
    streakText: "ದಿನಗಳ ನಿರಂತರ ದಾಖಲೆ",
    todayProgress: "ಇಂದಿನ ಔಷಧಿಗಳು",
    addMedTitle: "ಹೊಸ ಔಷಧಿ ಸೇರಿಸಿ",
    addMedVoice: "ಧ್ವನಿ ಮೂಲಕ ಸೇರಿಸಿ",
    addMedScan: "ಪ್ರಿಸ್ಕ್ರಿಪ್ಷನ್ ಸ್ಕ್ಯಾನ್ ಮಾಡಿ",
    addMedManual: "ಬರೆದು ಸೇರಿಸಿ",
    medName: "ಔಷಧಿಯ ಹೆಸರು",
    dosage: "ಮಾತ್ರೆ ಪ್ರಮಾಣ",
    frequency: "ದಿನಕ್ಕೆ ಎಷ್ಟು ಬಾರಿ",
    timing: "ತೆಗೆದುಕೊಳ್ಳುವ ಸಮಯ",
    saveMed: "ಔಷಧಿ ಉಳಿಸಿ",
    docTitle: "ಪ್ರಿಸ್ಕ್ರಿಪ್ಷನ್‌ಗಳು ಮತ್ತು ವರದಿಗಳು",
    uploadDoc: "ಹೊಸ ದಾಖಲೆ ಅಪ್‌ಲೋಡ್ ಮಾಡಿ",
    scanPrescription: "ಪ್ರಿಸ್ಕ್ರಿಪ್ಷನ್ ಸ್ಕ್ಯಾನ್ ಮಾಡಿ",
    doctorName: "ವೈದ್ಯರ ಹೆಸರು",
    hospitalName: "ಆಸ್ಪತ್ರೆಯ ಹೆಸರು",
    dateText: "ದಿನಾಂಕ",
    extractedMeds: "ಗುರುತಿಸಲಾದ ಔಷಧಿಗಳು",
    driveBackup: "ಗೂಗಲ್ ಡ್ರೈವ್ ಬ್ಯಾಕಪ್",
    backupSuccess: "ಡ್ರೈವ್‌ನಲ್ಲಿ ಉಳಿಸಲಾಗಿದೆ!",
    exportPdf: "ವೈದ್ಯರಿಗಾಗಿ PDF ಡೌನ್‌ಲೋಡ್",
    reportTitle: "ಔಷಧಿ ಸೇವನೆಯ ವರದಿ",
    adherenceRate: "ನಿಯಮಿತತೆಯ ದರ",
    missedDoses: "ತಪ್ಪಿಹೋದ ಔಷಧಿಗಳು",
    chatWithCaregiver: "ಸಹಾಯಕರೊಂದಿಗೆ ಮಾತನಾಡಿ",
    chatPlaceholder: "ಪ್ರಶ್ನೆ ಕೇಳಿ ಅಥವಾ ಮಾತನಾಡಿ...",
    botWelcome: "ನಮಸ್ಕಾರ! ನಾನು ನಿಮ್ಮ ಪಲ್ಸ್ ಸಹಾಯಕ. ನಿಮ್ಮ ಔಷಧಿ ಅಥವಾ ಆರೋಗ್ಯದ ಬಗ್ಗೆ ಏನು ಬೇಕಾದರೂ ಕೇಳಿ.",
    apiKeySettings: "ಡೆವಲಪರ್ ಸೆಟ್ಟಿಂಗ್ಸ್ (API Keys)",
    saveKeys: "ಕೀಗಳನ್ನು ಉಳಿಸಿ",
    keysSaved: "ಸೆಟ್ಟಿಂಗ್ಸ್ ಉಳಿಸಲಾಗಿದೆ!",
    demoMode: "ಡೆಮೋ ಮೋಡ್ (ಸಕ್ರಿಯ)",
    jsonBackup: "ಫೈಲ್ ಬ್ಯಾಕಪ್ (JSON)",
    importJson: "ಬ್ಯಾಕಪ್ ಲೋಡ್ ಮಾಡಿ",
    exportJson: "ಬ್ಯಾಕಪ್ ಡೌನ್‌ಲೋಡ್ ಮಾಡಿ",
    viewInline: "ಪ್ರಿಸ್ಕ್ರಿಪ್ಷನ್ ವೀಕ್ಷಿಸಿ"
  },
  ml: {
    appName: "പൾസ് (PULSE)",
    homeTab: "ഹോം",
    medicinesTab: "മരുന്നുകൾ",
    documentsTab: "രേഖകൾ",
    reportsTab: "റിപ്പോർട്ട്",
    caregiverTab: "സഹായി",
    micPrompt: "മരുന്ന് ചേർക്കാനോ സംസാരിക്കാനോ ബട്ടൺ അമർത്തുക",
    micListening: "കേൾക്കുന്നുണ്ട്... സംസാരിക്കൂ...",
    nextDose: "അടുത്ത ഡോസ്",
    takenButton: "മരുന്ന് കഴിച്ചു",
    streakText: "ദിവസത്തെ തുടർച്ച",
    todayProgress: "ഇന്നത്തെ മരുന്നുകൾ",
    addMedTitle: "പുതിയ മരുന്ന് ചേർക്കുക",
    addMedVoice: "ശബ്ദത്തിലൂടെ ചേർക്കുക",
    addMedScan: "കുറിപ്പടി സ്കാൻ ചെയ്യുക",
    addMedManual: "എഴുതി ചേർക്കുക",
    medName: "മരുന്നിന്റെ പേര്",
    dosage: "അളവ് (ഡോസ്)",
    frequency: "ഒരു ദിവസം എത്ര തവണ",
    timing: "കഴിക്കേണ്ട സമയം",
    saveMed: "മരുന്ന് സേവ് ചെയ്യുക",
    docTitle: "കുറിപ്പടികളും റിപ്പോർട്ടുകളും",
    uploadDoc: "പുതിയ രേഖ അപ്‌ലോഡ് ചെയ്യുക",
    scanPrescription: "കുറിപ്പടി സ്കാൻ ചെയ്യുക",
    doctorName: "ഡോക്ടറുടെ പേര്",
    hospitalName: "ആശുപത്രിയുടെ പേര്",
    dateText: "തീയതി",
    extractedMeds: "കണ്ടെത്തിയ മരുന്നുകൾ",
    driveBackup: "ഗൂഗിൾ ഡ്രൈവ് ബാക്കപ്പ്",
    backupSuccess: "ഡ്രൈവിൽ സൂക്ഷിച്ചു!",
    exportPdf: "ഡോക്ടർക്കായി PDF ഡൗൺലോഡ് ചെയ്യുക",
    reportTitle: "മരുന്ന് കഴിച്ചതിന്റെ റിപ്പോർട്ട്",
    adherenceRate: "കൃത്യതാ നിരക്ക്",
    missedDoses: "കഴിക്കാൻ വിട്ടുപോയ മരുന്നുകൾ",
    chatWithCaregiver: "സഹായിയുമായി സംസാരിക്കുക",
    chatPlaceholder: "ചോദ്യം ചോദിക്കൂ അല്ലെങ്കിൽ സംസാരിക്കൂ...",
    botWelcome: "നമസ്കാരം! ഞാൻ നിങ്ങളുടെ പൾസ് സഹായിയാണ്. നിങ്ങളുടെ മരുന്നുകളെക്കുറിച്ചോ ആരോഗ്യത്തെക്കുറിച്ചോ എന്തും ചോദിക്കാം.",
    apiKeySettings: "ഡെവലപ്പർ ക്രമീകരണങ്ങൾ (API Keys)",
    saveKeys: "കീകൾ സേവ് ചെയ്യുക",
    keysSaved: "ക്രമീകരണങ്ങൾ സേവായി!",
    demoMode: "ഡെമോ മോഡ് (പ്രവർത്തനക്ഷമമാണ്)",
    jsonBackup: "ഫയൽ ബാക്കപ്പ് (JSON)",
    importJson: "ബാക്കപ്പ് ലോഡ് ചെയ്യുക",
    exportJson: "ബാക്കപ്പ് ഡൗൺലോഡ് ചെയ്യുക",
    viewInline: "കുറിപ്പടി കാണുക"
  },
  en: {
    appName: "PULSE",
    homeTab: "Home",
    medicinesTab: "Medicines",
    documentsTab: "Documents",
    reportsTab: "Reports",
    caregiverTab: "Caregiver",
    micPrompt: "Tap the microphone to add meds or chat",
    micListening: "Listening... Speak now...",
    nextDose: "Next Dose",
    takenButton: "Mark Taken",
    streakText: "Day Adherence Streak",
    todayProgress: "Today's Progress",
    addMedTitle: "Add Medication",
    addMedVoice: "Add by Voice",
    addMedScan: "Scan Prescription",
    addMedManual: "Add Manually",
    medName: "Medicine Name",
    dosage: "Dosage (e.g. 1 pill, 5ml)",
    frequency: "Frequency",
    timing: "Dose Timing",
    saveMed: "Save Medication",
    docTitle: "Prescriptions & Reports",
    uploadDoc: "Upload New Document",
    scanPrescription: "Scan Prescription Document",
    doctorName: "Doctor's Name",
    hospitalName: "Hospital/Clinic Name",
    dateText: "Document Date",
    extractedMeds: "Extracted Medications",
    driveBackup: "Google Drive Backup",
    backupSuccess: "Backed up to Google Drive!",
    exportPdf: "Download PDF Report",
    reportTitle: "Adherence Report",
    adherenceRate: "Adherence Rate",
    missedDoses: "Missed Doses",
    chatWithCaregiver: "Caregiver Chatbot",
    chatPlaceholder: "Ask anything or tap mic to speak...",
    botWelcome: "Namaste! I am your PULSE Caregiver. Feel free to ask anything about your medicines, dosage schedules, or health queries.",
    apiKeySettings: "Developer API Settings",
    saveKeys: "Save API Settings",
    keysSaved: "API settings updated!",
    demoMode: "Demo/Simulation Mode Active",
    jsonBackup: "JSON Profile Backup",
    importJson: "Import JSON Backup",
    exportJson: "Export JSON Backup",
    viewInline: "View Prescription"
  }
};

interface SettingsContextType {
  language: LanguageCode;
  setLanguage: (lang: LanguageCode) => void;
  sarvamKey: string;
  setSarvamKey: (key: string) => void;
  firebaseConfig: string;
  setFirebaseConfig: (config: string) => void;
  t: Translations;
  isDemo: boolean;
  setIsDemo: (demo: boolean) => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<LanguageCode>('hi');
  const [sarvamKey, setSarvamKeyState] = useState<string>('');
  const [firebaseConfig, setFirebaseConfigState] = useState<string>('');
  const [isDemo, setIsDemoState] = useState<boolean>(true);

  // Load from local storage on mount
  useEffect(() => {
    const localLang = localStorage.getItem('pulse_language') as LanguageCode;
    if (localLang) setLanguageState(localLang);

    const localSarvam = localStorage.getItem('pulse_sarvam_key');
    if (localSarvam) {
      setSarvamKeyState(localSarvam);
      SarvamService.setApiKey(localSarvam);
    }

    const localFirebase = localStorage.getItem('pulse_firebase_config');
    if (localFirebase) setFirebaseConfigState(localFirebase);

    const localDemo = localStorage.getItem('pulse_is_demo');
    if (localDemo !== null) {
      setIsDemoState(localDemo === 'true');
    }
  }, []);

  const setLanguage = (lang: LanguageCode) => {
    setLanguageState(lang);
    localStorage.setItem('pulse_language', lang);
  };

  const setSarvamKey = (key: string) => {
    setSarvamKeyState(key);
    localStorage.setItem('pulse_sarvam_key', key);
    SarvamService.setApiKey(key);
    if (key.trim()) {
      setIsDemo(false);
    }
  };

  const setFirebaseConfig = (config: string) => {
    setFirebaseConfigState(config);
    localStorage.setItem('pulse_firebase_config', config);
  };

  const setIsDemo = (demo: boolean) => {
    setIsDemoState(demo);
    localStorage.setItem('pulse_is_demo', String(demo));
  };

  const t = translationMap[language];

  return (
    <SettingsContext.Provider value={{
      language,
      setLanguage,
      sarvamKey,
      setSarvamKey,
      firebaseConfig,
      setFirebaseConfig,
      t,
      isDemo,
      setIsDemo
    }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) throw new Error('useSettings must be used within SettingsProvider');
  return context;
};

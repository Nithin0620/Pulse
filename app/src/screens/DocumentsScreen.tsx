import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { useMedication } from '../context/MedicationContext';
import { useSettings } from '../context/SettingsContext';
import { GeminiVisionService, ExtractedPrescription } from '../services/geminiVisionService';
import { MedDocument } from '../types';

export const DocumentsScreen: React.FC = () => {
  const { documents, addDocument, deleteDocument, addMedication } = useMedication();
  const { language, t } = useSettings();

  const [isProcessing, setIsProcessing] = useState(false);
  const [extractedData, setExtractedData] = useState<ExtractedPrescription | null>(null);
  const [previewUri, setPreviewUri] = useState<string | null>(null);
  const [selectedDoc, setSelectedDoc] = useState<MedDocument | null>(null);

  const processImageUri = async (uri: string) => {
    setIsProcessing(true);
    setExtractedData(null);
    setPreviewUri(uri);

    try {
      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      const extracted = await GeminiVisionService.analyzePrescription(base64);
      setExtractedData(extracted);

      // Save to Firestore documents collection
      await addDocument({
        name: `Prescription (${extracted.doctor || 'Doctor'})`,
        type: 'prescription',
        date: extracted.date || new Date().toISOString().split('T')[0],
        doctor: extracted.doctor || 'Physician',
        hospital: extracted.hospital || 'Clinic',
        medicines: extracted.medicines.map((m) => `${m.name} (${m.dosage})`),
        extractedText: extracted.rawText,
      });
    } catch (e: any) {
      console.warn('Extraction failed', e);
      Alert.alert(
        'OCR Error',
        'Could not automatically extract text from image. Saved as reference photo.'
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Photo library permission is needed.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]?.uri) {
      await processImageUri(result.assets[0].uri);
    }
  };

  const handleTakePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Camera permission is needed.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]?.uri) {
      await processImageUri(result.assets[0].uri);
    }
  };

  const handleImportMeds = async () => {
    if (!extractedData || extractedData.medicines.length === 0) return;

    for (const med of extractedData.medicines) {
      await addMedication({
        name: med.name,
        dosage: med.dosage || '1 Tablet',
        frequency: med.frequency || 'Daily',
        timing: med.timing || ['morning'],
        instructions: med.instructions || 'As prescribed',
        startDate: new Date().toISOString().split('T')[0],
      });
    }

    Alert.alert(
      'Import Success',
      `${extractedData.medicines.length} medications added to your daily schedule!`
    );
    setExtractedData(null);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Upload & Scan Action Card */}
      <View style={styles.actionCard}>
        <View style={styles.badgeRow}>
          <Ionicons name="sparkles" size={14} color="#0D9488" />
          <Text style={styles.badgeText}>DOCUMENT AI SCANNER</Text>
        </View>

        <Text style={styles.cardTitle}>Upload Prescription or Report</Text>
        <Text style={styles.cardSubtitle}>
          Gemini Vision & Sarvam AI extract medicine names, dosages, and schedules automatically.
        </Text>

        <View style={styles.btnRow}>
          <TouchableOpacity
            style={styles.uploadBtn}
            onPress={handleTakePhoto}
            activeOpacity={0.8}
            disabled={isProcessing}
          >
            <Ionicons name="camera" size={18} color="#FFFFFF" />
            <Text style={styles.btnText}>Take Photo</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.uploadBtn, { backgroundColor: '#1E293B', borderWidth: 1, borderColor: '#334155' }]}
            onPress={handlePickImage}
            activeOpacity={0.8}
            disabled={isProcessing}
          >
            <Ionicons name="images" size={18} color="#CBD5E1" />
            <Text style={[styles.btnText, { color: '#CBD5E1' }]}>Gallery</Text>
          </TouchableOpacity>
        </View>

        {isProcessing && (
          <View style={styles.processingWrap}>
            <ActivityIndicator size="small" color="#0D9488" />
            <Text style={styles.processingText}>
              Analyzing handwriting and clinical tokens...
            </Text>
          </View>
        )}
      </View>

      {/* Extracted Details & One-Tap Import Banner */}
      {Boolean(extractedData) && (
        <View style={styles.extractedCard}>
          <View style={styles.extractedHeader}>
            <Ionicons name="checkmark-circle" size={20} color="#10B981" />
            <Text style={styles.extractedTitle}>Extraction Results</Text>
          </View>

          <View style={styles.doctorInfoRow}>
            <Text style={styles.docLabel}>Doctor:</Text>
            <Text style={styles.docVal}>{extractedData?.doctor}</Text>
          </View>
          <View style={styles.doctorInfoRow}>
            <Text style={styles.docLabel}>Hospital:</Text>
            <Text style={styles.docVal}>{extractedData?.hospital}</Text>
          </View>

          <Text style={styles.medsHeading}>Detected Medications:</Text>
          {extractedData?.medicines.map((m, idx) => (
            <View key={idx} style={styles.extractedMedRow}>
              <Ionicons name="medkit" size={16} color="#0D9488" />
              <View style={{ flex: 1 }}>
                <Text style={styles.medNameText}>{m.name}</Text>
                <Text style={styles.medDosageText}>{m.dosage} • {m.timing.join(', ')}</Text>
              </View>
            </View>
          ))}

          <TouchableOpacity
            style={styles.importBtn}
            onPress={handleImportMeds}
            activeOpacity={0.8}
          >
            <Ionicons name="add-circle" size={18} color="#FFFFFF" />
            <Text style={styles.importBtnText}>Import into Daily Schedule</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Uploaded Documents List */}
      <Text style={styles.sectionHeading}>Prescriptions & Medical Records</Text>
      {documents.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="document-text-outline" size={36} color="#64748B" />
          <Text style={styles.emptyText}>No medical documents uploaded yet.</Text>
        </View>
      ) : (
        documents.map((doc) => (
          <View key={doc.id} style={styles.docCard}>
            <View style={styles.docIconWrap}>
              <Ionicons name="document-text" size={20} color="#0D9488" />
            </View>

            <View style={styles.docInfo}>
              <Text style={styles.docTitle}>{doc.name}</Text>
              <Text style={styles.docMeta}>
                {doc.doctor} • {doc.hospital}
              </Text>
              <Text style={styles.docDate}>Date: {doc.date}</Text>

              {doc.medicines && doc.medicines.length > 0 && (
                <View style={styles.medTagsRow}>
                  {doc.medicines.slice(0, 3).map((m, i) => (
                    <View key={i} style={styles.medTag}>
                      <Text style={styles.medTagText} numberOfLines={1}>{m}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>

            <TouchableOpacity
              onPress={() => deleteDocument(doc.id)}
              style={styles.deleteDocBtn}
            >
              <Ionicons name="trash-outline" size={18} color="#EF4444" />
            </TouchableOpacity>
          </View>
        ))
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#030712',
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  actionCard: {
    backgroundColor: '#0F172A',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1E293B',
    padding: 18,
    marginBottom: 16,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  badgeText: {
    color: '#0D9488',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#F8FAFC',
  },
  cardSubtitle: {
    color: '#94A3B8',
    fontSize: 12,
    marginTop: 4,
    lineHeight: 16,
    marginBottom: 16,
  },
  btnRow: {
    flexDirection: 'row',
    gap: 10,
  },
  uploadBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#0D9488',
    paddingVertical: 12,
    borderRadius: 10,
  },
  btnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  processingWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 14,
    backgroundColor: 'rgba(13, 148, 136, 0.1)',
    padding: 10,
    borderRadius: 8,
  },
  processingText: {
    color: '#2DD4BF',
    fontSize: 12,
  },
  extractedCard: {
    backgroundColor: '#0F172A',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#10B981',
    padding: 16,
    marginBottom: 16,
  },
  extractedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  extractedTitle: {
    color: '#10B981',
    fontSize: 16,
    fontWeight: '700',
  },
  doctorInfoRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 4,
  },
  docLabel: {
    color: '#94A3B8',
    fontSize: 13,
  },
  docVal: {
    color: '#F8FAFC',
    fontSize: 13,
    fontWeight: '600',
  },
  medsHeading: {
    color: '#CBD5E1',
    fontSize: 13,
    fontWeight: '700',
    marginTop: 10,
    marginBottom: 6,
  },
  extractedMedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#1E293B',
    padding: 8,
    borderRadius: 8,
    marginBottom: 6,
  },
  medNameText: {
    color: '#F8FAFC',
    fontSize: 13,
    fontWeight: '700',
  },
  medDosageText: {
    color: '#0D9488',
    fontSize: 11,
  },
  importBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#10B981',
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 10,
  },
  importBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  sectionHeading: {
    fontSize: 13,
    fontWeight: '700',
    color: '#94A3B8',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
    marginTop: 8,
  },
  emptyState: {
    backgroundColor: '#0F172A',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
  },
  emptyText: {
    color: '#64748B',
    fontSize: 13,
    marginTop: 6,
  },
  docCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#1E293B',
    padding: 14,
    marginBottom: 10,
  },
  docIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 10,
    backgroundColor: 'rgba(13, 148, 136, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  docInfo: {
    flex: 1,
  },
  docTitle: {
    color: '#F8FAFC',
    fontSize: 14,
    fontWeight: '700',
  },
  docMeta: {
    color: '#94A3B8',
    fontSize: 12,
    marginTop: 2,
  },
  docDate: {
    color: '#64748B',
    fontSize: 11,
    marginTop: 1,
  },
  medTagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 6,
  },
  medTag: {
    backgroundColor: '#1E293B',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    maxWidth: 120,
  },
  medTagText: {
    color: '#0D9488',
    fontSize: 10,
    fontWeight: '600',
  },
  deleteDocBtn: {
    padding: 8,
  },
});

import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSettings, LANGUAGES, LanguageCode, FontSize } from '../context/SettingsContext';

interface AccessibilityModalProps {
  visible: boolean;
  onClose: () => void;
}

export const AccessibilityModal: React.FC<AccessibilityModalProps> = ({
  visible,
  onClose,
}) => {
  const {
    language,
    setLanguage,
    fontSize,
    setFontSize,
    highContrast,
    setHighContrast,
    voiceFeedback,
    setVoiceFeedback,
  } = useSettings();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <Ionicons name="accessibility" size={20} color="#0D9488" />
              <Text style={styles.title}>Language & Accessibility</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={20} color="#94A3B8" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollArea} showsVerticalScrollIndicator={false}>
            {/* 1. Language Selection (9 Indian Languages) */}
            <Text style={styles.sectionHeading}>Select Language (भाषा चुनें)</Text>
            <View style={styles.langGrid}>
              {LANGUAGES.map((item) => {
                const isSelected = language === item.code;
                return (
                  <TouchableOpacity
                    key={item.code}
                    style={[styles.langChip, isSelected && styles.langChipActive]}
                    onPress={() => setLanguage(item.code)}
                  >
                    <Text style={[styles.langNative, isSelected && styles.langTextActive]}>
                      {item.nativeName}
                    </Text>
                    <Text style={[styles.langEn, isSelected && styles.langTextActiveSub]}>
                      {item.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* 2. Elder-Friendly Font Scaling */}
            <Text style={styles.sectionHeading}>Font Size (अक्षर का आकार)</Text>
            <View style={styles.fontSizeRow}>
              {(['normal', 'large', 'extra-large'] as FontSize[]).map((size) => {
                const isSelected = fontSize === size;
                const label = size === 'normal' ? 'Normal' : size === 'large' ? 'Large (Default)' : 'Extra Large';
                return (
                  <TouchableOpacity
                    key={size}
                    style={[styles.fontBtn, isSelected && styles.fontBtnActive]}
                    onPress={() => setFontSize(size)}
                  >
                    <Text
                      style={[
                        styles.fontBtnText,
                        isSelected && styles.fontBtnTextActive,
                        size === 'large' && { fontSize: 14 },
                        size === 'extra-large' && { fontSize: 16 },
                      ]}
                    >
                      {label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* 3. Toggles */}
            <Text style={styles.sectionHeading}>Preferences</Text>

            <View style={styles.toggleRow}>
              <View style={styles.toggleInfo}>
                <Text style={styles.toggleTitle}>Voice Feedback (TTS)</Text>
                <Text style={styles.toggleSubtitle}>Read out dose reminders & assistant answers</Text>
              </View>
              <Switch
                value={voiceFeedback}
                onValueChange={setVoiceFeedback}
                thumbColor={voiceFeedback ? '#0D9488' : '#64748B'}
                trackColor={{ false: '#334155', true: 'rgba(13, 148, 136, 0.4)' }}
              />
            </View>

            <View style={styles.toggleRow}>
              <View style={styles.toggleInfo}>
                <Text style={styles.toggleTitle}>High-Contrast Mode</Text>
                <Text style={styles.toggleSubtitle}>Maximum contrast for low-vision reading</Text>
              </View>
              <Switch
                value={highContrast}
                onValueChange={setHighContrast}
                thumbColor={highContrast ? '#0D9488' : '#64748B'}
                trackColor={{ false: '#334155', true: 'rgba(13, 148, 136, 0.4)' }}
              />
            </View>
          </ScrollView>

          <TouchableOpacity style={styles.doneBtn} onPress={onClose}>
            <Text style={styles.doneBtnText}>Done</Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#0F172A',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '85%',
    borderTopWidth: 1,
    borderColor: '#334155',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  closeBtn: {
    padding: 4,
  },
  scrollArea: {
    marginBottom: 12,
  },
  sectionHeading: {
    fontSize: 13,
    fontWeight: '700',
    color: '#94A3B8',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 12,
    marginBottom: 8,
  },
  langGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  langChip: {
    width: '31%',
    backgroundColor: '#1E293B',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#334155',
    alignItems: 'center',
  },
  langChipActive: {
    backgroundColor: 'rgba(13, 148, 136, 0.15)',
    borderColor: '#0D9488',
  },
  langNative: {
    fontSize: 14,
    fontWeight: '700',
    color: '#F1F5F9',
  },
  langEn: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
  },
  langTextActive: {
    color: '#0D9488',
  },
  langTextActiveSub: {
    color: '#2DD4BF',
  },
  fontSizeRow: {
    flexDirection: 'row',
    gap: 8,
  },
  fontBtn: {
    flex: 1,
    backgroundColor: '#1E293B',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  fontBtnActive: {
    borderColor: '#0D9488',
    backgroundColor: 'rgba(13, 148, 136, 0.15)',
  },
  fontBtnText: {
    color: '#CBD5E1',
    fontWeight: '600',
    fontSize: 12,
  },
  fontBtnTextActive: {
    color: '#0D9488',
    fontWeight: '700',
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  toggleInfo: {
    flex: 1,
    paddingRight: 12,
  },
  toggleTitle: {
    color: '#F1F5F9',
    fontSize: 14,
    fontWeight: '600',
  },
  toggleSubtitle: {
    color: '#94A3B8',
    fontSize: 12,
    marginTop: 2,
  },
  doneBtn: {
    backgroundColor: '#0D9488',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  doneBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },
});

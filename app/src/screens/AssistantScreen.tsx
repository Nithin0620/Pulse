import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import { useMedication } from '../context/MedicationContext';
import { useSettings } from '../context/SettingsContext';
import { SarvamService } from '../services/sarvamService';

interface ChatMessage {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  timestamp: string;
}

export const AssistantScreen: React.FC = () => {
  const { documents, medications } = useMedication();
  const { language, t, voiceFeedback } = useSettings();

  const [mode, setMode] = useState<'general' | 'document'>('general');
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [playingId, setPlayingId] = useState<string | null>(null);

  const recordingRef = useRef<Audio.Recording | null>(null);
  const scrollRef = useRef<any>(null);

  useEffect(() => {
    setMessages([
      {
        id: 'welcome',
        sender: 'bot',
        text: t.botWelcome,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  }, [language]);

  const suggestions = [
    language === 'hi' ? 'दवाइयों के दुष्प्रभाव क्या हैं?' : 'Common side effects of my medicines?',
    language === 'hi' ? 'क्या मुझे खाली पेट दवाई लेनी चाहिए?' : 'Should I take medicine before or after meals?',
    language === 'hi' ? 'दवाई छूट जाने पर क्या करें?' : 'What to do if I missed a morning dose?',
  ];

  const handleSend = async (textToSend: string) => {
    const text = textToSend.trim();
    if (!text) return;

    const userMsg: ChatMessage = {
      id: String(Date.now()),
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    try {
      const selectedDoc = documents.find((d) => d.id === selectedDocId);
      const contextPrompt =
        mode === 'document' && selectedDoc
          ? `Document Context:\n${selectedDoc.extractedText || 'No text extracted'}\n\nQuestion: ${text}`
          : `Active patient medications: ${medications.map((m) => m.name).join(', ')}. Question: ${text}`;

      const reply = await SarvamService.chat([
        {
          role: 'system',
          content:
            'You are Pulse AI, a clinical pharmacist assistant for elderly patients in India. Keep answers reassuring, simple, practical, and clear. Always advise consulting their doctor for severe symptoms.',
        },
        { role: 'user', content: contextPrompt },
      ]);

      const botMsg: ChatMessage = {
        id: String(Date.now() + 1),
        sender: 'bot',
        text: reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, botMsg]);

      // If voice feedback enabled, speak reply
      if (voiceFeedback) {
        await SarvamService.textToSpeech(reply, language, true);
      }
    } catch (e) {
      console.warn('Chat error', e);
    } finally {
      setIsTyping(false);
    }
  };

  const handleVoiceToggle = async () => {
    if (isRecording) {
      setIsRecording(false);
      try {
        if (!recordingRef.current) return;
        await recordingRef.current.stopAndUnloadAsync();
        const uri = recordingRef.current.getURI();
        recordingRef.current = null;

        if (uri) {
          const transcript = await SarvamService.speechToText(uri, language);
          if (transcript) {
            handleSend(transcript);
          }
        }
      } catch (e) {
        Alert.alert('Voice Recognition', 'Could not convert audio. Please try typing.');
      }
    } else {
      try {
        const perm = await Audio.requestPermissionsAsync();
        if (!perm.granted) {
          Alert.alert('Microphone needed', 'Please enable mic access.');
          return;
        }

        await Audio.setAudioModeAsync({
          allowsRecordingIOS: true,
          playsInSilentModeIOS: true,
        });

        const { recording } = await Audio.Recording.createAsync(
          Audio.RecordingOptionsPresets.HIGH_QUALITY
        );
        recordingRef.current = recording;
        setIsRecording(true);
      } catch (e) {
        console.warn('Could not start recording', e);
      }
    }
  };

  const handlePlayTTS = async (msg: ChatMessage) => {
    setPlayingId(msg.id);
    await SarvamService.textToSpeech(msg.text, language, true);
    setPlayingId(null);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      {/* Mode Selector Header */}
      <View style={styles.modeRow}>
        <TouchableOpacity
          style={[styles.modeBtn, mode === 'general' && styles.modeBtnActive]}
          onPress={() => setMode('general')}
        >
          <Ionicons
            name="chatbubble-ellipses"
            size={16}
            color={mode === 'general' ? '#0D9488' : '#94A3B8'}
          />
          <Text style={[styles.modeBtnText, mode === 'general' && styles.modeBtnTextActive]}>
            General Health Q&A
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.modeBtn, mode === 'document' && styles.modeBtnActive]}
          onPress={() => setMode('document')}
        >
          <Ionicons
            name="document-text"
            size={16}
            color={mode === 'document' ? '#0D9488' : '#94A3B8'}
          />
          <Text style={[styles.modeBtnText, mode === 'document' && styles.modeBtnTextActive]}>
            Prescription Q&A
          </Text>
        </TouchableOpacity>
      </View>

      {/* Messages Scroll View */}
      <ScrollView
        ref={scrollRef}
        style={styles.messagesList}
        contentContainerStyle={styles.messagesContent}
        onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
      >
        {messages.map((m) => {
          const isUser = m.sender === 'user';
          return (
            <View
              key={m.id}
              style={[styles.bubbleWrap, isUser ? styles.bubbleWrapUser : styles.bubbleWrapBot]}
            >
              {!isUser && (
                <View style={styles.botAvatar}>
                  <Ionicons name="sparkles" size={14} color="#0D9488" />
                </View>
              )}

              <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleBot]}>
                <Text style={[styles.msgText, isUser ? styles.msgTextUser : styles.msgTextBot]}>
                  {m.text}
                </Text>

                <View style={styles.msgFooter}>
                  <Text style={styles.msgTime}>{m.timestamp}</Text>
                  {!isUser && (
                    <TouchableOpacity
                      onPress={() => handlePlayTTS(m)}
                      style={styles.speakerBtn}
                    >
                      <Ionicons
                        name={playingId === m.id ? 'volume-high' : 'volume-medium-outline'}
                        size={16}
                        color="#0D9488"
                      />
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </View>
          );
        })}

        {isTyping && (
          <View style={[styles.bubbleWrap, styles.bubbleWrapBot]}>
            <View style={styles.botAvatar}>
              <Ionicons name="sparkles" size={14} color="#0D9488" />
            </View>
            <View style={[styles.bubble, styles.bubbleBot, { paddingVertical: 10 }]}>
              <ActivityIndicator size="small" color="#0D9488" />
            </View>
          </View>
        )}
      </ScrollView>

      {/* Suggested Prompts */}
      <View style={styles.suggestionsWrap}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.suggestionsRow}>
          {suggestions.map((s, idx) => (
            <TouchableOpacity
              key={idx}
              style={styles.suggestionChip}
              onPress={() => handleSend(s)}
            >
              <Text style={styles.suggestionText} numberOfLines={1}>
                {s}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Input Bar */}
      <View style={styles.inputBar}>
        <TouchableOpacity
          style={[styles.micBtn, isRecording && styles.micBtnActive]}
          onPress={handleVoiceToggle}
        >
          <Ionicons
            name={isRecording ? 'stop-circle' : 'mic'}
            size={20}
            color={isRecording ? '#FFFFFF' : '#0D9488'}
          />
        </TouchableOpacity>

        <TextInput
          style={styles.chatInput}
          placeholder={t.chatPlaceholder}
          placeholderTextColor="#64748B"
          value={input}
          onChangeText={setInput}
          onSubmitEditing={() => handleSend(input)}
          returnKeyType="send"
        />

        <TouchableOpacity
          style={[styles.sendBtn, !input.trim() && styles.sendBtnDisabled]}
          onPress={() => handleSend(input)}
          disabled={!input.trim()}
        >
          <Ionicons name="send" size={18} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#030712',
  },
  modeRow: {
    flexDirection: 'row',
    padding: 12,
    gap: 8,
    backgroundColor: '#0B132B',
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  modeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#334155',
  },
  modeBtnActive: {
    backgroundColor: 'rgba(13, 148, 136, 0.15)',
    borderColor: '#0D9488',
  },
  modeBtnText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '600',
  },
  modeBtnTextActive: {
    color: '#0D9488',
    fontWeight: '700',
  },
  messagesList: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
    paddingBottom: 10,
    gap: 12,
  },
  bubbleWrap: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  bubbleWrapUser: {
    justifyContent: 'flex-end',
  },
  bubbleWrapBot: {
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
  },
  botAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(13, 148, 136, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    marginTop: 4,
  },
  bubble: {
    maxWidth: '82%',
    padding: 12,
    borderRadius: 16,
  },
  bubbleUser: {
    backgroundColor: '#0D9488',
    borderBottomRightRadius: 4,
  },
  bubbleBot: {
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#1E293B',
    borderBottomLeftRadius: 4,
  },
  msgText: {
    fontSize: 14,
    lineHeight: 20,
  },
  msgTextUser: {
    color: '#FFFFFF',
    fontWeight: '500',
  },
  msgTextBot: {
    color: '#F8FAFC',
  },
  msgFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
  },
  msgTime: {
    color: '#94A3B8',
    fontSize: 10,
  },
  speakerBtn: {
    padding: 2,
  },
  suggestionsWrap: {
    paddingVertical: 6,
    borderTopWidth: 1,
    borderTopColor: '#1E293B',
    backgroundColor: '#0B132B',
  },
  suggestionsRow: {
    paddingHorizontal: 12,
    gap: 8,
  },
  suggestionChip: {
    backgroundColor: '#1E293B',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#334155',
  },
  suggestionText: {
    color: '#CBD5E1',
    fontSize: 11,
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#0B132B',
    borderTopWidth: 1,
    borderTopColor: '#1E293B',
    gap: 8,
  },
  micBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  micBtnActive: {
    backgroundColor: '#EF4444',
  },
  chatInput: {
    flex: 1,
    backgroundColor: '#1E293B',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#334155',
    color: '#FFFFFF',
    paddingHorizontal: 16,
    height: 40,
    fontSize: 14,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#0D9488',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: {
    opacity: 0.5,
  },
});

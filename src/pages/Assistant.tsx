import React, { useState, useEffect, useRef } from 'react';
import { useMedication } from '../context/MedicationContext';
import { useSettings } from '../context/SettingsContext';
import { SarvamService } from '../services/sarvamService';
import {
  SentIcon,
  UserIcon,
  AiChat02Icon,
  VolumeHighIcon,
  Mic01Icon,
  StopIcon,
  File01Icon,
  SparklesIcon,
  FavouriteIcon,
  FireIcon,
  Loading03Icon,
} from 'hugeicons-react';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';

interface ChatMessage {
  sender: 'user' | 'bot';
  text: string;
  timestamp: Date;
}

type Mode = 'general' | 'document';

const formatTime = (d: Date) => {
  const h = d.getHours();
  const m = d.getMinutes();
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hh = ((h + 11) % 12) + 1;
  return `${hh}:${String(m).padStart(2, '0')} ${ampm}`;
};

export const Assistant: React.FC = () => {
  const { medications, documents, streak, adherenceRate } = useMedication();
  const { language, t } = useSettings();

  const [mode, setMode] = useState<Mode>('general');
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);

  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);

  const [recording, setRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMessages([
      { sender: 'bot', text: t.botWelcome, timestamp: new Date() },
    ]);
  }, [language]);

  useEffect(() => {
    if (!selectedDocId && documents.length > 0) {
      setSelectedDocId(documents[0].id);
    }
  }, [documents, selectedDocId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  useEffect(() => {
    const handler = async (e: Event) => {
      const text = (e as CustomEvent).detail;
      if (text) handleSendMessage(text);
    };
    window.addEventListener('pulse_voice_chat', handler);
    return () => window.removeEventListener('pulse_voice_chat', handler);
  }, [language, mode, selectedDocId, documents]);

  const selectedDoc = documents.find(d => d.id === selectedDocId) || null;

  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim()) return;

    setMessages(prev => [...prev, { sender: 'user', text: textToSend, timestamp: new Date() }]);
    setInput('');
    setIsTyping(true);

    try {
      let reply = '';
      if (mode === 'document' && selectedDoc) {
        const docText = selectedDoc.extractedText || '';
        if (!docText.trim()) {
          reply =
            language === 'hi'
              ? 'इस दस्तावेज़ का टेक्स्ट अभी प्रोसेस नहीं हुआ है।'
              : 'This document has not been processed yet — try a PDF prescription.';
        } else {
          reply = await SarvamService.chatWithDocument(docText, textToSend, language);
        }
      } else {
        reply = await SarvamService.chatSaaras(textToSend, language);
      }
      setMessages(prev => [...prev, { sender: 'bot', text: reply, timestamp: new Date() }]);
    } catch (err) {
      console.error(err);
      setMessages(prev => [
        ...prev,
        {
          sender: 'bot',
          text:
            language === 'hi'
              ? 'क्षमा करें, प्रतिक्रिया देने में त्रुटि हुई।'
              : 'Sorry, I encountered an error. Please try again.',
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleVoiceInput = async () => {
    if (recording) {
      mediaRecorderRef.current?.stop();
      setRecording(false);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      const chunks: BlobPart[] = [];

      mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
      mediaRecorder.onstop = async () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        try {
          const text = await SarvamService.speechToText(blob, language);
          if (text) handleSendMessage(text);
        } catch (err) {
          console.error(err);
        }
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setRecording(true);
    } catch (err) {
      console.error('Microphone access denied', err);
    }
  };

  const handleSpeakAloud = async (text: string) => {
    try {
      await SarvamService.textToSpeech(text, language);
    } catch (err) {
      console.error(err);
    }
  };

  const chips =
    language === 'hi'
      ? ['मेरी आज की दवाइयाँ क्या हैं?', 'दवा का समय कैसे याद रखें?', 'क्या मुझे खाली पेट दवा लेनी चाहिए?']
      : ['What medicines do I take today?', 'Are there any food interactions?', 'How to remember missed doses?'];

  return (
    <div className="space-y-5 max-w-5xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground flex items-center gap-2">
            <AiChat02Icon size={26} className="text-teal-600 dark:text-teal-400" />
            <span>{language === 'hi' ? 'स्वास्थ्य सहायक' : 'Health Assistant'}</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Voice and text consultation powered by clinical conversational models
          </p>
        </div>

        {/* Mode switcher */}
        <div className="flex items-center gap-1.5 p-1 bg-muted/40 border rounded-lg self-start sm:self-auto">
          <Button
            variant={mode === 'general' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setMode('general')}
            className={`h-7 text-xs gap-1.5 ${
              mode === 'general' ? 'bg-teal-600 hover:bg-teal-700 text-white' : ''
            }`}
          >
            <SparklesIcon size={12} />
            <span>General</span>
          </Button>
          <Button
            variant={mode === 'document' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setMode('document')}
            className={`h-7 text-xs gap-1.5 ${
              mode === 'document' ? 'bg-teal-600 hover:bg-teal-700 text-white' : ''
            }`}
          >
            <File01Icon size={12} />
            <span>Document</span>
          </Button>
        </div>
      </div>

      {/* Main layout */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-5">
        {/* Chat card */}
        <div className="xl:col-span-3">
          <Card className="flex flex-col h-[70vh] xl:h-[75vh] overflow-hidden p-0">
            {/* Top Bar inside card */}
            <div className="p-3.5 sm:p-4 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-muted/20">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0">
                  <AiChat02Icon size={18} />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-foreground text-sm">Pulse Health Assistant</span>
                    <Badge variant="outline" className="text-[10px] text-teal-700 dark:text-teal-300 border-teal-500/30 gap-1 h-4 px-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse" />
                      <span>Clinical AI</span>
                    </Badge>
                  </div>
                  <span className="text-[11px] text-muted-foreground block">
                    {mode === 'document' ? 'Document Consultation Mode' : 'General Health Assistant'}
                  </span>
                </div>
              </div>

              {mode === 'document' && (
                <select
                  value={selectedDocId || ''}
                  onChange={(e) => setSelectedDocId(e.target.value)}
                  className="h-8 rounded-md border border-input bg-background px-2.5 text-xs outline-none focus:ring-2 focus:ring-ring"
                >
                  {documents.length === 0 ? (
                    <option value="">No documents uploaded</option>
                  ) : (
                    documents.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))
                  )}
                </select>
              )}
            </div>

            {/* Messages feed */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
              {messages.map((msg, idx) => {
                const isBot = msg.sender === 'bot';
                return (
                  <div
                    key={idx}
                    className={`flex items-end gap-2 ${isBot ? '' : 'flex-row-reverse'}`}
                  >
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs ${
                        isBot
                          ? 'bg-teal-500/10 text-teal-600 dark:text-teal-400'
                          : 'bg-muted text-foreground'
                      }`}
                    >
                      {isBot ? <AiChat02Icon size={14} /> : <UserIcon size={14} />}
                    </div>

                    <div className={`max-w-[85%] sm:max-w-[75%] flex flex-col gap-1 ${isBot ? '' : 'items-end'}`}>
                      <div
                        className={`rounded-lg px-3.5 py-2.5 text-xs sm:text-sm leading-relaxed whitespace-pre-wrap ${
                          isBot
                            ? 'bg-muted/50 border text-foreground rounded-bl-xs'
                            : 'bg-teal-600 text-white rounded-br-xs'
                        }`}
                      >
                        {msg.text}
                      </div>

                      <div className={`flex items-center gap-2 text-[10px] text-muted-foreground ${isBot ? '' : 'flex-row-reverse'}`}>
                        <span>{formatTime(msg.timestamp)}</span>
                        {isBot && idx > 0 && (
                          <button
                            onClick={() => handleSpeakAloud(msg.text)}
                            className="inline-flex items-center gap-1 hover:text-teal-600 cursor-pointer"
                          >
                            <VolumeHighIcon size={11} />
                            <span>Speak</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              {isTyping && (
                <div className="flex items-end gap-2">
                  <div className="w-7 h-7 rounded-full bg-teal-500/10 text-teal-600 flex items-center justify-center shrink-0">
                    <Loading03Icon size={13} className="animate-spin" />
                  </div>
                  <div className="bg-muted/50 border rounded-lg px-3 py-2 text-xs text-muted-foreground">
                    Thinking…
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Suggestions */}
            {messages.length <= 1 && (
              <div className="px-4 py-2 border-t bg-muted/10">
                <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                  Suggested Questions
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {chips.map((chip, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSendMessage(chip)}
                      className="rounded-full border bg-background hover:bg-muted px-2.5 py-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {chip}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Input bar */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage(input);
              }}
              className="p-3 border-t flex items-center gap-2"
            >
              <Button
                type="button"
                variant={recording ? 'destructive' : 'outline'}
                size="sm"
                onClick={handleVoiceInput}
                className="h-9 w-9 p-0 shrink-0"
              >
                {recording ? <StopIcon size={16} /> : <Mic01Icon size={16} />}
              </Button>

              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={
                  mode === 'document'
                    ? 'Ask about this document…'
                    : t.chatPlaceholder
                }
                className="flex-1 h-9 rounded-md border border-input bg-background px-3 text-xs outline-none focus:ring-2 focus:ring-ring"
              />

              <Button
                type="submit"
                disabled={!input.trim() || isTyping}
                size="sm"
                className="h-9 w-9 p-0 bg-teal-600 hover:bg-teal-700 text-white shrink-0"
              >
                <SentIcon size={15} />
              </Button>
            </form>
          </Card>
        </div>

        {/* Side health summary (xl only) */}
        <aside className="hidden xl:flex flex-col gap-4">
          <Card className="p-4 space-y-3">
            <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground border-b pb-2">
              <FavouriteIcon size={14} className="text-rose-500" />
              <span>Health Telemetry</span>
            </div>

            <div className="space-y-2">
              <div className="bg-muted/30 border rounded-md p-2.5">
                <div className="text-xl font-bold font-mono text-teal-600 dark:text-teal-400">{adherenceRate}%</div>
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground mt-0.5">
                  {t.adherenceRate}
                </div>
              </div>

              <div className="bg-muted/30 border rounded-md p-2.5">
                <div className="text-xl font-bold font-mono text-amber-500 flex items-center gap-1">
                  <FireIcon size={18} />
                  <span>{streak}</span>
                </div>
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground mt-0.5">
                  {t.streakText}
                </div>
              </div>

              <div className="bg-muted/30 border rounded-md p-2.5">
                <div className="text-xl font-bold font-mono text-foreground">{medications.length}</div>
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground mt-0.5">
                  Active Medications
                </div>
              </div>
            </div>
          </Card>

          {documents.length > 0 && (
            <Card className="p-4 space-y-2">
              <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground border-b pb-2">
                Recent Documents
              </div>
              <div className="space-y-1.5">
                {documents.slice(0, 3).map((d) => (
                  <button
                    key={d.id}
                    onClick={() => {
                      setMode('document');
                      setSelectedDocId(d.id);
                    }}
                    className={`w-full flex items-center gap-2 p-2 rounded-md border text-left text-xs transition-all ${
                      selectedDocId === d.id && mode === 'document'
                        ? 'border-teal-500 bg-teal-50/40 dark:bg-teal-950/20'
                        : 'border-border bg-card hover:border-border/80'
                    }`}
                  >
                    <File01Icon size={14} className="text-teal-600 dark:text-teal-400 shrink-0" />
                    <div className="min-w-0">
                      <div className="font-medium text-foreground truncate">{d.name}</div>
                      <div className="text-[10px] text-muted-foreground truncate">{d.doctor}</div>
                    </div>
                  </button>
                ))}
              </div>
            </Card>
          )}
        </aside>
      </div>
    </div>
  );
};

export default Assistant;

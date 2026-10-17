# Voice Input Fix — Migrated to Sarvam AI STT

## What Changed

Replaced the unreliable browser `SpeechRecognition` API with **MediaRecorder + Sarvam AI STT** for robust, multilingual voice input.

### Before (Browser API Issues)
- ❌ Network errors (`SpeechRecognitionErrorEvent`)
- ❌ Google server dependency
- ❌ Limited Indian language support
- ❌ HTTPS requirement in production

### After (Sarvam AI STT)
- ✅ Reliable Sarvam AI speech-to-text
- ✅ Better Indian language recognition
- ✅ Works on localhost and production
- ✅ Consistent with other app features

## How It Works

1. **User clicks mic button** → Opens voice modal
2. **Browser requests microphone permission** → User must allow
3. **MediaRecorder captures audio** for up to 10 seconds
4. **Audio sent to Sarvam AI STT** → Returns transcript in selected language
5. **Transcript processed** → Medicine extracted via Sarvam LLM
6. **Medicine added** → User redirected to Medicines tab

## Testing

```bash
npm run dev
```

1. Click the **Voice Add** button (floating FAB on mobile, sidebar button on desktop)
2. **Allow microphone access** when prompted
3. Speak a medicine name: _"Morning one tablet Aspirin after breakfast"_
4. Wait for transcription (shows "Processing..." / "पहचान हो रही है...")
5. Medicine should be added automatically

## Troubleshooting

### "Microphone access denied"
- Grant microphone permissions in browser settings
- Chrome: `chrome://settings/content/microphone`
- Edge: `edge://settings/content/microphone`

### "Sarvam STT Error"
- Check `.env` has valid `VITE_SARVAM_API_KEY`
- Verify API key at https://dashboard.sarvam.ai/
- Check browser console for detailed error logs

### Audio format issues
- MediaRecorder uses `audio/webm` by default
- Sarvam AI accepts: MP3, WAV, FLAC, M4A, WEBM
- Should work out of the box

## Technical Details

**File Modified**: `src/components/Layout.tsx`

**Key Changes**:
- Removed: `SpeechRecognition` setup in `useEffect`
- Added: `MediaRecorder` state
- Modified: `startSpeechListening()` to use `navigator.mediaDevices.getUserMedia()`
- Modified: Audio processing to call `SarvamService.speechToText()`
- Added: 10-second auto-stop timeout
- Added: Proper cleanup of media stream tracks

**Dependencies**: 
- Uses existing `SarvamService.speechToText()` from `src/services/sarvamService.ts`
- No new packages required

## API Quota

Each voice input = 1 Sarvam STT API call + 1 Sarvam Chat API call (for extraction)

Monitor usage at: https://dashboard.sarvam.ai/usage

---

**Status**: ✅ Fixed — Tested and building successfully

import React from 'react'
import ReactDOM from 'react-dom/client'
import '@fontsource/geist-sans/400.css'
import '@fontsource/geist-sans/500.css'
import '@fontsource/geist-sans/600.css'
import '@fontsource/geist-sans/700.css'
import App from './App.tsx'
import './index.css'

// Apply persisted accessibility preferences before React mounts so the
// app paints in the right theme/size from the very first frame.
try {
  const raw = localStorage.getItem('pulse_a11y_settings_v1');
  const root = document.documentElement;
  const defaults = { theme: 'light', fontSize: 'normal', highContrast: false, reduceMotion: false };
  const s = raw ? { ...defaults, ...JSON.parse(raw) } : defaults;
  root.dataset.theme = s.theme;
  root.dataset.fontSize = s.fontSize || 'normal';
  root.dataset.highContrast = String(!!s.highContrast);
  root.dataset.reduceMotion = String(!!s.reduceMotion);
} catch { /* localStorage unavailable — fall through to defaults */ }

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

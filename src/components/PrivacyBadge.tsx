/**
 * PULSE Shield - Phase 3.3: PrivacyBadge Component
 * 
 * Small inline badge shown after AI responses to indicate:
 * 1. How many PII entities were redacted
 * 2. Clickable to open Privacy X-Ray
 * 3. Color-coded (green = protected)
 * 
 * Purpose: Give instant visual feedback that privacy was protected
 * Placement: After every AI operation (chat response, SOS summary, etc.)
 */

import React, { useState } from 'react';
import { Shield, Info } from 'lucide-react';
import { PrivacyXRay } from './PrivacyXRay';

interface PrivacyBadgeProps {
  /** Number of PII entities that were redacted */
  entitiesRedacted: number;

  /** Which AI feature this was for (for filtering X-Ray) */
  feature?: 'STT' | 'TTS' | 'OCR' | 'CHAT' | 'SOS' | 'TRANSLATE';

  /** Optional callback when badge is clicked */
  onClick?: () => void;

  /** Size variant */
  size?: 'sm' | 'md' | 'lg';

  /** Tooltip text */
  tooltip?: string;

  /** Show only if user enabled Privacy X-Ray */
  respectUserPreference?: boolean;
}

export const PrivacyBadge: React.FC<PrivacyBadgeProps> = ({
  entitiesRedacted,
  feature,
  onClick,
  size = 'md',
  tooltip,
  respectUserPreference = true,
}) => {
  const [showXRay, setShowXRay] = useState(false);

  // Check if user wants to see badges
  if (respectUserPreference) {
    try {
      const settings = JSON.parse(localStorage.getItem('pulse_shield_consent') || '{}');
      if (settings.showPrivacyXRay === false) {
        return null;
      }
    } catch {
      // If we can't read settings, show badge anyway
    }
  }

  // Don't show badge if no PII was redacted
  if (entitiesRedacted === 0) {
    return null;
  }

  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm',
    lg: 'px-4 py-2 text-base',
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      setShowXRay(true);
    }
  };

  const defaultTooltip =
    tooltip ||
    `${entitiesRedacted} ${entitiesRedacted === 1 ? 'item' : 'items'} protected - Click to see what was redacted`;

  return (
    <>
      <button
        onClick={handleClick}
        className={`inline-flex items-center gap-1.5 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 border border-green-300 dark:border-green-700 rounded-full font-medium hover:bg-green-200 dark:hover:bg-green-900/50 transition ${sizeClasses[size]}`}
        title={defaultTooltip}
        aria-label={defaultTooltip}
      >
        <Shield className={iconSizes[size]} />
        <span>
          {entitiesRedacted} {entitiesRedacted === 1 ? 'item' : 'items'} protected
        </span>
        <Info className={`${iconSizes[size]} opacity-70`} />
      </button>

      {/* Privacy X-Ray Modal */}
      {showXRay && (
        <PrivacyXRay onClose={() => setShowXRay(false)} initialFeatureFilter={feature} />
      )}
    </>
  );
};

/**
 * Alternative: Minimal badge (just icon)
 * Useful for dense layouts where space is limited
 */
export const PrivacyBadgeMinimal: React.FC<PrivacyBadgeProps> = ({
  entitiesRedacted,
  feature,
  onClick,
  tooltip,
  respectUserPreference = true,
}) => {
  const [showXRay, setShowXRay] = useState(false);

  if (respectUserPreference) {
    try {
      const settings = JSON.parse(localStorage.getItem('pulse_shield_consent') || '{}');
      if (settings.showPrivacyXRay === false) {
        return null;
      }
    } catch {}
  }

  if (entitiesRedacted === 0) {
    return null;
  }

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      setShowXRay(true);
    }
  };

  const defaultTooltip =
    tooltip ||
    `${entitiesRedacted} ${entitiesRedacted === 1 ? 'item' : 'items'} protected from cloud AI`;

  return (
    <>
      <button
        onClick={handleClick}
        className="inline-flex items-center justify-center w-6 h-6 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 border border-green-300 dark:border-green-700 rounded-full hover:bg-green-200 dark:hover:bg-green-900/50 transition group relative"
        title={defaultTooltip}
        aria-label={defaultTooltip}
      >
        <Shield className="w-3.5 h-3.5" />

        {/* Hover Tooltip */}
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition pointer-events-none z-50">
          {entitiesRedacted} protected
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900 dark:border-t-gray-700" />
        </div>
      </button>

      {showXRay && (
        <PrivacyXRay onClose={() => setShowXRay(false)} initialFeatureFilter={feature} />
      )}
    </>
  );
};

/**
 * Inline Protection Indicator
 * Shows as a small shield with count, ideal for within response text
 */
export const ProtectionIndicator: React.FC<PrivacyBadgeProps> = ({
  entitiesRedacted,
  feature,
  onClick,
  tooltip,
}) => {
  const [showXRay, setShowXRay] = useState(false);

  if (entitiesRedacted === 0) {
    return null;
  }

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      setShowXRay(true);
    }
  };

  const defaultTooltip =
    tooltip ||
    `${entitiesRedacted} ${entitiesRedacted === 1 ? 'item' : 'items'} of your personal data was protected`;

  return (
    <>
      <button
        onClick={handleClick}
        className="inline-flex items-center gap-1 text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 transition cursor-pointer font-medium text-sm"
        title={defaultTooltip}
      >
        <Shield className="w-4 h-4" />
        <span>{entitiesRedacted} protected</span>
      </button>

      {showXRay && (
        <PrivacyXRay onClose={() => setShowXRay(false)} initialFeatureFilter={feature} />
      )}
    </>
  );
};

/**
 * Hook to track last redaction and show badge
 * 
 * Usage:
 * const badge = usePrivacyBadge();
 * 
 * // After redacting:
 * badge.show(3, 'CHAT');
 * 
 * // In render:
 * {badge.component}
 */
export function usePrivacyBadge() {
  const [entitiesRedacted, setEntitiesRedacted] = useState(0);
  const [feature, setFeature] = useState<'STT' | 'TTS' | 'OCR' | 'CHAT' | 'SOS' | 'TRANSLATE' | undefined>();

  const show = (count: number, feat?: typeof feature) => {
    setEntitiesRedacted(count);
    setFeature(feat);

    // Auto-hide after 30 seconds
    const timer = setTimeout(() => setEntitiesRedacted(0), 30000);
    return () => clearTimeout(timer);
  };

  const hide = () => {
    setEntitiesRedacted(0);
  };

  return {
    show,
    hide,
    component:
      entitiesRedacted > 0 ? (
        <PrivacyBadge entitiesRedacted={entitiesRedacted} feature={feature} onClick={hide} />
      ) : null,
  };
}

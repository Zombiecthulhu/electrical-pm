/**
 * useKeyboard Hook
 * 
 * Custom hooks for keyboard shortcuts and interactions.
 * Improves accessibility and power user experience.
 */

import { useEffect, useCallback, useRef } from 'react';

interface KeyboardShortcut {
  key: string;
  ctrl?: boolean;
  alt?: boolean;
  shift?: boolean;
  meta?: boolean; // Command key on Mac
  callback: (event: KeyboardEvent) => void;
  preventDefault?: boolean;
}

/**
 * Use Keyboard Shortcut
 * 
 * Register a keyboard shortcut handler.
 */
export const useKeyboardShortcut = (
  shortcut: KeyboardShortcut | KeyboardShortcut[],
  enabled: boolean = true
) => {
  const shortcuts = Array.isArray(shortcut) ? shortcut : [shortcut];

  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      shortcuts.forEach((s) => {
        const keyMatches = event.key.toLowerCase() === s.key.toLowerCase();
        const ctrlMatches = s.ctrl ? event.ctrlKey : !event.ctrlKey;
        const altMatches = s.alt ? event.altKey : !event.altKey;
        const shiftMatches = s.shift ? event.shiftKey : !event.shiftKey;
        const metaMatches = s.meta ? event.metaKey : !event.metaKey;

        if (keyMatches && ctrlMatches && altMatches && shiftMatches && metaMatches) {
          if (s.preventDefault !== false) {
            event.preventDefault();
          }
          s.callback(event);
        }
      });
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts, enabled]);
};

/**
 * Use Escape Key
 * 
 * Handle ESC key press (commonly used to close modals/dialogs).
 */
export const useEscapeKey = (callback: () => void, enabled: boolean = true) => {
  useKeyboardShortcut(
    {
      key: 'Escape',
      callback,
      preventDefault: true,
    },
    enabled
  );
};

/**
 * Use Enter Key
 * 
 * Handle Enter key press (commonly used to submit forms).
 */
export const useEnterKey = (callback: () => void, enabled: boolean = true) => {
  useKeyboardShortcut(
    {
      key: 'Enter',
      callback,
      preventDefault: false,
    },
    enabled
  );
};

/**
 * Use Modal Keyboard
 * 
 * Combined hook for common modal keyboard interactions.
 * - ESC to close
 * - Enter to confirm (optional)
 */
export const useModalKeyboard = (
  onClose: () => void,
  onConfirm?: () => void,
  enabled: boolean = true
) => {
  useEscapeKey(onClose, enabled);

  // Always call the hook, but only enable if onConfirm is provided
  useKeyboardShortcut(
    {
      key: 'Enter',
      ctrl: true,
      callback: onConfirm || (() => {}),
      preventDefault: true,
    },
    enabled && !!onConfirm
  );
};

/**
 * Use Click Outside
 * 
 * Detect clicks outside a ref element.
 * Useful for dropdowns, popovers, etc.
 */
export const useClickOutside = <T extends HTMLElement = HTMLElement>(
  callback: () => void,
  enabled: boolean = true
) => {
  const ref = useRef<T>(null);

  useEffect(() => {
    if (!enabled) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        callback();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [callback, enabled]);

  return ref;
};

/**
 * Use Focus Trap
 * 
 * Trap focus within a container (useful for modals/dialogs).
 */
export const useFocusTrap = <T extends HTMLElement = HTMLElement>(
  enabled: boolean = true
) => {
  const ref = useRef<T>(null);

  useEffect(() => {
    if (!enabled || !ref.current) return;

    const container = ref.current;
    const focusableElements = container.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    // Focus first element on mount
    if (firstElement) {
      firstElement.focus();
    }

    const handleTabKey = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return;

      if (event.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstElement) {
          event.preventDefault();
          lastElement?.focus();
        }
      } else {
        // Tab
        if (document.activeElement === lastElement) {
          event.preventDefault();
          firstElement?.focus();
        }
      }
    };

    container.addEventListener('keydown', handleTabKey);
    return () => container.removeEventListener('keydown', handleTabKey);
  }, [enabled]);

  return ref;
};

export default useKeyboardShortcut;


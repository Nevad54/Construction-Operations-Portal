// Accessibility utilities for the UI component library

/**
 * Generate unique IDs for form elements
 */
export function generateId(prefix = 'id') {
  return `${prefix}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Announce screen reader messages
 */
export function announceToScreenReader(message) {
  const announcement = document.createElement('div');
  announcement.setAttribute('aria-live', 'polite');
  announcement.setAttribute('aria-atomic', 'true');
  announcement.className = 'sr-only';
  announcement.textContent = message;
  
  document.body.appendChild(announcement);
  
  // Remove after announcement
  setTimeout(() => {
    document.body.removeChild(announcement);
  }, 1000);
}

/**
 * Trap focus within a container
 */
export function trapFocus(container) {
  const focusableElements = container.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );
  const firstElement = focusableElements[0];
  const lastElement = focusableElements[focusableElements.length - 1];

  const handleTabKey = (e) => {
    if (e.key === 'Tab') {
      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          lastElement.focus();
          e.preventDefault();
        }
      } else {
        if (document.activeElement === lastElement) {
          firstElement.focus();
          e.preventDefault();
        }
      }
    }
  };

  container.addEventListener('keydown', handleTabKey);
  
  return () => {
    container.removeEventListener('keydown', handleTabKey);
  };
}

/**
 * Check if element is visible
 */
export function isVisible(element) {
  return !!(element.offsetWidth || element.offsetHeight || element.getClientRects().length);
}

/**
 * Get focusable elements within a container
 */
export function getFocusableElements(container) {
  return container.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );
}

/**
 * Set focus to first focusable element
 */
export function setFocusToFirst(container) {
  const focusableElements = getFocusableElements(container);
  if (focusableElements.length > 0) {
    focusableElements[0].focus();
  }
}

/**
 * Remove focus from all elements
 */
export function removeFocus() {
  if (document.activeElement) {
    document.activeElement.blur();
  }
}

/**
 * Check if user prefers reduced motion
 */
export function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Get keyboard navigation key codes
 */
export const KEY_CODES = {
  ENTER: 'Enter',
  SPACE: ' ',
  ESCAPE: 'Escape',
  TAB: 'Tab',
  ARROW_UP: 'ArrowUp',
  ARROW_DOWN: 'ArrowDown',
  ARROW_LEFT: 'ArrowLeft',
  ARROW_RIGHT: 'ArrowRight',
  HOME: 'Home',
  END: 'End',
  PAGE_UP: 'PageUp',
  PAGE_DOWN: 'PageDown',
};

/**
 * ARIA roles for common patterns
 */
export const ARIA_ROLES = {
  BUTTON: 'button',
  DIALOG: 'dialog',
  ALERT: 'alert',
  STATUS: 'status',
  NAVIGATION: 'navigation',
  MAIN: 'main',
  COMPLEMENTARY: 'complementary',
  BANNER: 'banner',
  CONTENTINFO: 'contentinfo',
  SEARCH: 'search',
  TABLIST: 'tablist',
  TAB: 'tab',
  TABPANEL: 'tabpanel',
  MENU: 'menu',
  MENUITEM: 'menuitem',
  LISTBOX: 'listbox',
  OPTION: 'option',
  COMBOBOX: 'combobox',
  GRID: 'grid',
  GRIDCELL: 'gridcell',
  ROW: 'row',
  ROWGROUP: 'rowgroup',
  COLUMNHEADER: 'columnheader',
  ROWHEADER: 'rowheader',
};

/**
 * Common ARIA properties
 */
export const ARIA_PROPERTIES = {
  LABEL: 'aria-label',
  LABELLEDBY: 'aria-labelledby',
  DESCRIBEDBY: 'aria-describedby',
  EXPANDED: 'aria-expanded',
  SELECTED: 'aria-selected',
  HIDDEN: 'aria-hidden',
  DISABLED: 'aria-disabled',
  REQUIRED: 'aria-required',
  INVALID: 'aria-invalid',
  PRESSED: 'aria-pressed',
  CHECKED: 'aria-checked',
  BUSY: 'aria-busy',
  LIVE: 'aria-live',
  ATOMIC: 'aria-atomic',
  RELEVANT: 'aria-relevant',
  CURRENT: 'aria-current',
  POSINSET: 'aria-posinset',
  SETSIZE: 'aria-setsize',
  LEVEL: 'aria-level',
  SORT: 'aria-sort',
  ORIENTATION: 'aria-orientation',
  MULTILINE: 'aria-multiline',
  MULTSELECTABLE: 'aria-multiselectable',
  READONLY: 'aria-readonly',
  CONTROLS: 'aria-controls',
  HASPOPUP: 'aria-haspopup',
  FLOWTO: 'aria-flowto',
  OWNS: 'aria-owns',
  ACTIVEDESCENDANT: 'aria-activedescendant',
};

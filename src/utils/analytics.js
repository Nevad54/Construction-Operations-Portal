const STORAGE_KEY = 'construction_ops_analytics_events';
const MAX_EVENTS = 100;

const isBrowser = typeof window !== 'undefined';

const readEvents = () => {
  if (!isBrowser) return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch (_error) {
    return [];
  }
};

const writeEvents = (events) => {
  if (!isBrowser) return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(events.slice(-MAX_EVENTS)));
  } catch (_error) {
    // Ignore storage failures to avoid breaking user flows.
  }
};

export const trackEvent = (name, payload = {}) => {
  const event = {
    name,
    payload,
    route: isBrowser ? window.location.pathname : '',
    timestamp: new Date().toISOString(),
  };

  const events = readEvents();
  events.push(event);
  writeEvents(events);

  if (isBrowser && Array.isArray(window.dataLayer)) {
    window.dataLayer.push({ event: name, ...payload, route: event.route, timestamp: event.timestamp });
  }

  if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
    window.dispatchEvent(new CustomEvent('construction-ops-analytics', { detail: event }));
  }

  if (process.env.NODE_ENV !== 'production') {
    // eslint-disable-next-line no-console
    console.log('[analytics]', event);
  }

  return event;
};

export const getTrackedEvents = () => readEvents();

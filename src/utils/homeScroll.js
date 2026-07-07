const HOME_SCROLL_SNAPSHOT_KEY = 'alanHomeScrollSnapshot';
const HOME_SCROLL_SNAPSHOT_TTL = 10 * 60 * 1000;

const isBrowser = () => typeof window !== 'undefined';

const getScrollY = () => (
  window.scrollY
  || document.documentElement?.scrollTop
  || document.body?.scrollTop
  || 0
);

export const saveHomeScrollSnapshot = (data = {}) => {
  if (!isBrowser() || window.location.pathname !== '/') return;

  try {
    window.sessionStorage.setItem(HOME_SCROLL_SNAPSHOT_KEY, JSON.stringify({
      ...data,
      scrollY: getScrollY(),
      savedAt: Date.now(),
    }));
  } catch (error) {
    console.warn('save home scroll snapshot failed', error);
  }
};

export const getHomeScrollSnapshot = () => {
  if (!isBrowser()) return null;

  try {
    const rawSnapshot = window.sessionStorage.getItem(HOME_SCROLL_SNAPSHOT_KEY);
    if (!rawSnapshot) return null;

    const snapshot = JSON.parse(rawSnapshot);
    if (!snapshot?.savedAt || Date.now() - snapshot.savedAt > HOME_SCROLL_SNAPSHOT_TTL) {
      window.sessionStorage.removeItem(HOME_SCROLL_SNAPSHOT_KEY);
      return null;
    }

    return snapshot;
  } catch (error) {
    window.sessionStorage.removeItem(HOME_SCROLL_SNAPSHOT_KEY);
    return null;
  }
};

export const clearHomeScrollSnapshot = () => {
  if (!isBrowser()) return;
  window.sessionStorage.removeItem(HOME_SCROLL_SNAPSHOT_KEY);
};

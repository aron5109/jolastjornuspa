/** sessionStorage is only used to remember that the intro already played in this tab session. */
const KEY = 'jolastjornuspa:intro-seen';

export function hasSeenIntro(): boolean {
  try {
    return window.sessionStorage.getItem(KEY) === '1';
  } catch {
    return false;
  }
}

export function markIntroSeen(): void {
  try {
    window.sessionStorage.setItem(KEY, '1');
  } catch {
    // Storage blocked: the intro simply plays again next time.
  }
}

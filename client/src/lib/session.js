// Keep in step with backend/utils/session.js.
export const IDLE_MS = 60 * 60 * 1000; // logged out after an hour without activity
export const WARN_MS = 2 * 60 * 1000; // a warning this long before
export const RENEW_MS = 5 * 60 * 1000; // the sign-in is renewed at most this often, and only while in use

// Shared between tabs, so using the app in one keeps the others signed in.
const KEY = "lastActivity";

export const sharedActivity = () => {
  try {
    return Number(localStorage.getItem(KEY)) || 0;
  } catch {
    return 0;
  }
};

export const shareActivity = (time) => {
  try {
    localStorage.setItem(KEY, String(time));
  } catch {
    // Storage can be refused in private browsing; this tab still counts its own activity.
  }
};

// Where to send someone whose session has ended, with the reason for the login page.
export const endSession = (reason) => {
  try {
    localStorage.removeItem("user");
  } catch {
    // Nothing stored to clear.
  }
  window.location.href = `/?ended=${reason}`;
};

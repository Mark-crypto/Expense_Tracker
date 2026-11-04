// How long a sign-in lasts. Change these to make sessions longer or shorter.
export const ACCESS_MS = 15 * 60 * 1000; // a short pass, renewed quietly while in use
export const IDLE_MS = 60 * 60 * 1000; // logged out after this long without activity
export const SESSION_MAX_MS = 12 * 60 * 60 * 1000; // signed out this long after logging in, however active

// The app renews at most this often while someone is active, so the server allows this much
// on top of IDLE_MS and never ends a session before the app has warned about it.
export const RENEW_MS = 5 * 60 * 1000;

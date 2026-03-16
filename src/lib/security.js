// Filename validation
const INVALID_CHARS = /[/\\:*?"<>|\x00]/g;

export function validateFilename(name) {
  if (!name || typeof name !== 'string') return { valid: false, error: 'That filename contains invalid characters. Please rename and try again.' };
  const stripped = name.replace(INVALID_CHARS, '').trim().replace(/^\.+|\.+$/g, '');
  if (!stripped) return { valid: false, error: 'That filename contains invalid characters. Please rename and try again.' };
  if (stripped.length > 255) return { valid: false, error: 'That filename contains invalid characters. Please rename and try again.' };
  if (INVALID_CHARS.test(name)) return { valid: false, error: 'That filename contains invalid characters. Please rename and try again.' };
  return { valid: true, value: stripped };
}

// Rate limiter — shared singleton per browser session
const ACTION_LIMIT = 20;
const WINDOW_MS = 60_000;
const COOLDOWN_MS = 30_000;

let timestamps = [];
let coolingDown = false;
let cooldownEnd = 0;
const listeners = new Set();

function notify() {
  listeners.forEach(fn => fn(coolingDown));
}

export function recordAction() {
  const now = Date.now();

  // If in cooldown, block
  if (coolingDown) {
    if (now >= cooldownEnd) {
      coolingDown = false;
      timestamps = [];
      notify();
    } else {
      return false;
    }
  }

  // Purge old timestamps outside the 1-minute window
  timestamps = timestamps.filter(t => now - t < WINDOW_MS);
  timestamps.push(now);

  if (timestamps.length > ACTION_LIMIT) {
    coolingDown = true;
    cooldownEnd = now + COOLDOWN_MS;
    notify();
    setTimeout(() => {
      coolingDown = false;
      timestamps = [];
      notify();
    }, COOLDOWN_MS);
    return false;
  }

  return true;
}

export function isRateLimited() {
  if (coolingDown && Date.now() >= cooldownEnd) {
    coolingDown = false;
    timestamps = [];
  }
  return coolingDown;
}

export function subscribeRateLimit(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
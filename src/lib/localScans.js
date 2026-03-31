/**
 * localScans.js
 * Offline-capable scan storage using localStorage.
 * Mirrors the Base44 entities.Scan API surface so call-sites need minimal changes.
 *
 * Scan schema:
 *   id            – UUID
 *   name          – optional label
 *   image_url     – base64 data URL of the (cropped) retinal image
 *   result        – 'pending' | 'normal' | 'abnormal' | 'no_result'
 *   confidence    – 0-100 or undefined
 *   ai_message    – string or undefined
 *   notes         – string or undefined
 *   created_by    – user id of the owner
 *   created_date  – ISO timestamp
 */

const SCANS_KEY = 'dr_monster_scans';

function generateId() {
  return crypto.randomUUID();
}

function getCurrentUserId() {
  try {
    const raw = localStorage.getItem('dr_monster_session');
    return raw ? JSON.parse(raw).id : null;
  } catch {
    return null;
  }
}

function getAllScans() {
  try {
    return JSON.parse(localStorage.getItem(SCANS_KEY) || '[]');
  } catch {
    return [];
  }
}

function saveAllScans(scans) {
  localStorage.setItem(SCANS_KEY, JSON.stringify(scans));
}

export const Scan = {
  /**
   * List scans for the current user.
   * @param {string} sort  – field name, prefix with '-' for descending (e.g. '-created_date')
   * @param {number} limit – max records to return
   */
  list(sort = '-created_date', limit = 50) {
    const userId = getCurrentUserId();
    let scans = getAllScans().filter(s => s.created_by === userId);

    if (sort) {
      const desc = sort.startsWith('-');
      const field = desc ? sort.slice(1) : sort;
      scans.sort((a, b) => {
        if (a[field] < b[field]) return desc ? 1 : -1;
        if (a[field] > b[field]) return desc ? -1 : 1;
        return 0;
      });
    }

    return Promise.resolve(scans.slice(0, limit));
  },

  /** Create a new scan and persist it. Returns the created scan object. */
  create(data) {
    const userId = getCurrentUserId();
    const scan = {
      ...data,
      id: generateId(),
      created_by: userId,
      created_date: new Date().toISOString(),
    };

    try {
      saveAllScans([...getAllScans(), scan]);
    } catch (e) {
      // localStorage quota exceeded
      throw new Error('Storage is full. Please delete some old scans and try again.');
    }

    return Promise.resolve(scan);
  },

  /** Update fields on an existing scan. Returns the updated scan object. */
  update(id, data) {
    const scans = getAllScans();
    const idx = scans.findIndex(s => s.id === id);
    if (idx === -1) return Promise.reject(new Error('Scan not found'));
    scans[idx] = { ...scans[idx], ...data };
    saveAllScans(scans);
    return Promise.resolve(scans[idx]);
  },

  /** Delete a scan by id. */
  delete(id) {
    saveAllScans(getAllScans().filter(s => s.id !== id));
    return Promise.resolve();
  },
};

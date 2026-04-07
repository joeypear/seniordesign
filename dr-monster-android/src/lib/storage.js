// Tiny IndexedDB wrapper for scan history.
// All scans — including the captured image blob — live entirely on-device.
// Nothing ever leaves the phone.

const DB_NAME = 'drmonster';
const DB_VERSION = 1;
const STORE = 'scans';

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        const store = db.createObjectStore(STORE, { keyPath: 'id' });
        store.createIndex('created_date', 'created_date', { unique: false });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function tx(db, mode) {
  return db.transaction(STORE, mode).objectStore(STORE);
}

function uid() {
  return `scan_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

export const Scan = {
  async create(data) {
    const db = await openDB();
    const record = {
      id: uid(),
      created_date: new Date().toISOString(),
      name: data.name || null,
      image_blob: data.image_blob || null, // Blob
      result: data.result || 'pending',    // 'normal' | 'abnormal' | 'no_result' | 'pending'
      confidence: data.confidence ?? null, // number or null
      ai_message: data.ai_message || null,
      notes: data.notes || null,
    };
    await new Promise((resolve, reject) => {
      const req = tx(db, 'readwrite').add(record);
      req.onsuccess = resolve;
      req.onerror = () => reject(req.error);
    });
    db.close();
    return record;
  },

  async list(limit = 100) {
    const db = await openDB();
    const store = tx(db, 'readonly');
    const records = await new Promise((resolve, reject) => {
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
    db.close();
    // Sort newest first.
    records.sort((a, b) => b.created_date.localeCompare(a.created_date));
    return records.slice(0, limit);
  },

  async get(id) {
    const db = await openDB();
    const record = await new Promise((resolve, reject) => {
      const req = tx(db, 'readonly').get(id);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
    db.close();
    return record;
  },

  async update(id, patch) {
    const db = await openDB();
    const store = tx(db, 'readwrite');
    const current = await new Promise((resolve, reject) => {
      const req = store.get(id);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
    if (!current) {
      db.close();
      return null;
    }
    const updated = { ...current, ...patch };
    await new Promise((resolve, reject) => {
      const req = store.put(updated);
      req.onsuccess = resolve;
      req.onerror = () => reject(req.error);
    });
    db.close();
    return updated;
  },

  async delete(id) {
    const db = await openDB();
    await new Promise((resolve, reject) => {
      const req = tx(db, 'readwrite').delete(id);
      req.onsuccess = resolve;
      req.onerror = () => reject(req.error);
    });
    db.close();
  },

  async clear() {
    const db = await openDB();
    await new Promise((resolve, reject) => {
      const req = tx(db, 'readwrite').clear();
      req.onsuccess = resolve;
      req.onerror = () => reject(req.error);
    });
    db.close();
  },
};

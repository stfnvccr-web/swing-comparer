import { openDB } from 'idb';

const DB_NAME = 'golf-swing-comparer-db';
const DB_VERSION = 1;

export async function getDB() {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('videos')) {
        db.createObjectStore('videos');
      }
      if (!db.objectStoreNames.contains('settings')) {
        db.createObjectStore('settings');
      }
    },
  });
}

export async function saveVideoBlob(key, blob, name = '') {
  try {
    const db = await getDB();
    const arrayBuffer = await blob.arrayBuffer();
    await db.put('videos', { data: arrayBuffer, type: blob.type, name, timestamp: Date.now() }, key);
    return true;
  } catch (err) {
    console.error('Failed to save video to IndexedDB:', err);
    return false;
  }
}

export async function getVideoBlob(key) {
  try {
    const db = await getDB();
    const item = await db.get('videos', key);
    if (!item) return null;
    return {
      blob: new Blob([item.data], { type: item.type }),
      name: item.name,
      timestamp: item.timestamp,
    };
  } catch (err) {
    console.error('Failed to load video from IndexedDB:', err);
    return null;
  }
}

export async function saveSetting(key, val) {
  try {
    const db = await getDB();
    await db.put('settings', val, key);
  } catch (err) {
    console.error('Failed to save setting:', err);
  }
}

export async function getSetting(key) {
  try {
    const db = await getDB();
    return await db.get('settings', key);
  } catch (err) {
    console.error('Failed to get setting:', err);
    return null;
  }
}

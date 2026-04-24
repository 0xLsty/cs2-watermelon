const IS_ELECTRON = typeof window !== 'undefined' && Boolean(window.electronAPI);

async function dbGet(key) {
  if (!IS_ELECTRON) return null;
  return window.electronAPI.storeGet(key);
}

async function dbSet(key, value) {
  if (!IS_ELECTRON) return;
  return window.electronAPI.storeSet(key, value);
}

export { IS_ELECTRON, dbGet, dbSet };

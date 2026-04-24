const { contextBridge, ipcRenderer } = require('electron');

const ALLOWED_KEYS = new Set(['portfolio', 'historico', 'schemaVersion']);

function assertKey(key) {
  if (!ALLOWED_KEYS.has(key)) throw new Error(`Chave inválida: ${key}`);
}

contextBridge.exposeInMainWorld('api', {
  storeGet: (key) => {
    assertKey(key);
    return ipcRenderer.invoke('store:get', key);
  },
  storeSet: (key, value) => {
    assertKey(key);
    return ipcRenderer.invoke('store:set', key, value);
  },
  storeDelete: (key) => {
    assertKey(key);
    return ipcRenderer.invoke('store:delete', key);
  },
});

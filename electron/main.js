const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('node:path');
const Store = require('electron-store');

const store = new Store();
const ALLOWED_KEYS = new Set(['portfolio', 'historico', 'schemaVersion']);

function assertKey(key) {
  if (!ALLOWED_KEYS.has(key)) throw new Error(`Chave inválida: ${key}`);
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 1024,
    minHeight: 700,
    backgroundColor: '#0f1319',
    frame: true,
    titleBarStyle: 'default',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  win.maximize();

  if (process.env.NODE_ENV === 'development') {
    win.loadURL('http://localhost:5173');
    win.webContents.openDevTools({ mode: 'detach' });
  } else {
    win.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
  }
}

ipcMain.handle('store:get', (_event, key) => {
  assertKey(key);
  return store.get(key);
});

ipcMain.handle('store:set', (_event, key, value) => {
  assertKey(key);
  store.set(key, value);
  return true;
});

ipcMain.handle('store:delete', (_event, key) => {
  assertKey(key);
  store.delete(key);
  return true;
});

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

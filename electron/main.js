const { app, BrowserWindow, ipcMain } = require('electron');
const Store = require('electron-store');
const path = require('path');

const store = new Store({ name: 'watermelon-cs2-data' });
const isDev = !app.isPackaged;

function createWindow() {
  const win = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1100,
    minHeight: 700,
    backgroundColor: '#0a0c10',
    title: 'Watermelon CS2',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (isDev) {
    win.loadURL('http://localhost:5173');
  } else {
    win.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  win.setMenuBarVisibility(false);
}

app.whenReady().then(() => {
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// ─── IPC Handlers ─────────────────────────────────────────────────────────────

ipcMain.handle('store:get', (_event, key) => {
  return store.get(key, null);
});

ipcMain.handle('store:set', (_event, key, value) => {
  store.set(key, value);
  return true;
});

ipcMain.handle('store:delete', (_event, key) => {
  store.delete(key);
  return true;
});

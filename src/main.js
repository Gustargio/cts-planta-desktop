const { app, BrowserWindow, ipcMain, Notification } = require('electron');
const path = require('path');

function createWindow() {
  const win = new BrowserWindow({
    width: 1000,
    height: 720,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  });

  win.setMenuBarVisibility(false);
  win.loadFile(path.join(__dirname, 'index.html'));
}

app.setAppUserModelId('com.berni.controltotalsola.planta');

app.whenReady().then(() => {
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// Canal para mostrar notificación nativa desde el renderer
ipcMain.handle('show-ack-noti', (_evt, payload) => {
  const { title, body } = payload || {};
  const n = new Notification({ title: title || 'Cambio de estado', body: body || '' });
  n.show();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

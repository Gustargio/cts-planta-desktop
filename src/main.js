
const { app, BrowserWindow, Notification, ipcMain } = require('electron');
const path = require('path');

let win;

function createWindow() {
  win = new BrowserWindow({
    width: 1100,
    height: 750,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js')
    },
    autoHideMenuBar: true
  });

  win.loadFile(path.join(__dirname, 'renderer', 'index.html'));
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// Notificaciones nativas
ipcMain.handle('notify', (_evt, { title, body }) => {
  new Notification({ title, body, silent: false }).show();
  return true;
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

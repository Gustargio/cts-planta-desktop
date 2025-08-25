const { app, BrowserWindow, Notification, ipcMain, Menu } = require('electron');
const path = require('path');

let win;

function createWindow() {
  win = new BrowserWindow({
    width: 1100,
    height: 750,
    webPreferences: { preload: path.join(__dirname, 'preload.js') },
    autoHideMenuBar: true
  });

  // Para que Windows identifique la app en notificaciones
  app.setAppUserModelId('com.berni.controltotalsola.planta');

  win.loadFile(path.join(__dirname, 'renderer', 'index.html'));

  // ===== Menú estilo app Android =====
  const template = [
    {
      label: 'Menú',
      submenu: [
        { label: 'Informes / Historial', click: () => win.webContents.send('menu:historial') },
        { label: 'Resumen de sueldo',     click: () => win.webContents.send('menu:resumen') },
        { label: 'Config. sueldo',        click: () => win.webContents.send('menu:config') },
        { type: 'separator' },
        { label: 'Compartir',             click: () => win.webContents.send('menu:compartir') },
        { type: 'separator' },
        { label: 'Eliminar mixer…',       click: () => win.webContents.send('menu:eliminar') },
        { label: 'Reiniciar (vaciar lista)', click: () => win.webContents.send('menu:reiniciarLista') },
        { label: 'Reiniciar estados',        click: () => win.webContents.send('menu:reiniciarEstados') },
        { type: 'separator' },
        { role: 'quit', label: 'Salir' }
      ]
    }
  ];
  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

// ===== Notificaciones =====
// Simple
ipcMain.handle('notify', (_evt, { title, body }) => {
  new Notification({ title, body, silent: false }).show();
  return true;
});

// Con botón "Dar OK" (si Windows muestra acción)
ipcMain.handle('notifyAckable', (_evt, { title, body, mixerId, status }) => {
  const n = new Notification({
    title,
    body,
    silent: false,
    actions: [{ type: 'button', text: 'Dar OK' }],
    closeButtonText: 'Cerrar'
  });

  n.on('action', () => {
    win?.webContents.send('ack-notify-click', { mixerId, status });
  });

  n.show();
  return true;
});

app.whenReady().then(() => {
  createWindow();
  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
});

app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });

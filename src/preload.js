const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  // Notificaciones
  notify: (title, body) => ipcRenderer.invoke('notify', { title, body }),
  notifyAckable: (title, body, mixerId, status) =>
    ipcRenderer.invoke('notifyAckable', { title, body, mixerId, status }),

  // Click en botón “Dar OK” desde la notificación
  onAckClick: (cb) => ipcRenderer.on('ack-notify-click', (_e, data) => cb(data)),

  // Menú
  onMenu: (channel, cb) => ipcRenderer.on(channel, (_e, data) => cb(data))
});

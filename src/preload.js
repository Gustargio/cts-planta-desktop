const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('planta', {
  notifyAck: async (title, body) => {
    try {
      await ipcRenderer.invoke('show-ack-noti', { title, body });
    } catch (e) {
      new Notification(title || 'Cambio', { body: body || '' });
    }
  }
});

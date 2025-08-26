const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('planta', {
  notifyAck: async (title, body) => {
    try {
      await ipcRenderer.invoke('show-ack-noti', { title, body });
    } catch (e) {
      // fallback si algo falla
      new Notification(title || 'Cambio', { body: body || '' });
    }
  }
});

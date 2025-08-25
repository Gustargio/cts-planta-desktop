
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  notify: (title, body) => ipcRenderer.invoke('notify', { title, body })
});

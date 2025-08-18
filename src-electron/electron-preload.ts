import { contextBridge, ipcRenderer } from "electron"

contextBridge.exposeInMainWorld("electron", {
  log: {
    error: (msg: string) => ipcRenderer.send("log-error", msg),
    info: (msg: string) => ipcRenderer.send("log-info", msg),
    warn: (msg: string) => ipcRenderer.send("log-warn", msg),
  },
  ipcRenderer,
})

// 3.1d: the launcher window's bridge (launcher.html / src/launcher/launcher.js), and nothing else.
// Sandboxed, isolated, no Node: it can ask for the update state, press ИГРАТЬ, change its two settings, open
// three known places, and move its own window. main.cjs answers only when the call comes from the launcher.
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('hushLauncher', {
  state: () => ipcRenderer.invoke('hush:ln:state'),
  onState: (fn) => {
    const h = (_e, s) => { try { fn(s); } catch { /* the page is going away */ } };
    ipcRenderer.on('hush:ln:state', h);
    return () => ipcRenderer.removeListener('hush:ln:state', h);
  },
  play: (force) => ipcRenderer.invoke('hush:ln:play', !!force),
  retry: () => ipcRenderer.invoke('hush:ln:retry'),
  applyShell: () => ipcRenderer.invoke('hush:ln:shell'),
  prefs: () => ipcRenderer.invoke('hush:ln:prefs'),
  setPref: (key, value) => ipcRenderer.invoke('hush:ln:pref', key, value),
  open: (what) => ipcRenderer.invoke('hush:ln:open', what),
  win: (action) => ipcRenderer.invoke('hush:ln:win', action),
});

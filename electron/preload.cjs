// The only bridge between the game and the desktop shell (3.0m).
//
// The window runs sandboxed with context isolation and no Node: the page cannot touch the disk or the network
// beyond what the game itself does. What it *can* do here is ask about updates — which version is running, is
// there a newer build, download it — and open the releases page. Nothing else.
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('hushDesktop', {
  desktop: true,
  version: () => ipcRenderer.invoke('hush:version'),
  // → { state: 'idle' | 'checking' | 'ready' | 'downloading' | 'downloaded' | 'error', version, latest, notes, page, progress, error }
  check: () => ipcRenderer.invoke('hush:update:check'),
  download: () => ipcRenderer.invoke('hush:update:download'),
  openReleases: () => ipcRenderer.invoke('hush:update:page'),
  onProgress: (fn) => {
    const h = (_e, d) => { try { fn(d); } catch { /* the page is gone */ } };
    ipcRenderer.on('hush:update:progress', h);
    return () => ipcRenderer.removeListener('hush:update:progress', h);
  },
});

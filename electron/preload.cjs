// The only bridge between the game and the desktop shell (3.0m).
//
// The window runs sandboxed with context isolation and no Node: the page cannot touch the disk or the network
// beyond what the game itself does. What it *can* do here is ask about updates — which version is running, is
// there a newer build (the launcher fetches it: 3.1d), reload onto it — open the releases page, and (3.1a) sign in
// with Google through the system browser. Nothing else.
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('hushDesktop', {
  desktop: true,
  version: () => ipcRenderer.invoke('hush:version'),
  // (3.1d) the launcher downloads; the game only hears about it:
  // → { phase, version (this page's build), latest, latestGame, updateReady (a newer game is on disk), shell, dev }
  check: () => ipcRenderer.invoke('hush:update:check'),
  restart: () => ipcRenderer.invoke('hush:update:restart'), // reload onto the newer game (between shifts)
  openReleases: () => ipcRenderer.invoke('hush:update:page'),
  // (3.1a) Google sign-in through the player's own browser: a loopback redirect, then the tokens
  oauthBegin: (lang) => ipcRenderer.invoke('hush:oauth:begin', lang),
  oauthFinish: (url) => ipcRenderer.invoke('hush:oauth:finish', url),
  onProgress: (fn) => {
    const h = (_e, d) => { try { fn(d); } catch { /* the page is gone */ } };
    ipcRenderer.on('hush:update:progress', h);
    return () => ipcRenderer.removeListener('hush:update:progress', h);
  },
});

const defaults = { dark: false, compact: false, focus: false };
const controls = [...document.querySelectorAll('[data-setting]')];

chrome.storage.sync.get(defaults, (settings) => {
  controls.forEach((control) => {
    control.checked = Boolean(settings[control.dataset.setting]);
  });
});

controls.forEach((control) => {
  control.addEventListener('change', () => {
    const key = control.dataset.setting;
    chrome.storage.sync.set({ [key]: control.checked });
  });
});

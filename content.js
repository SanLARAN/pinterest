(() => {
  const defaults = { dark: false, compact: false, focus: false };
  const apply = (settings) => {
    const root = document.documentElement;
    root.classList.toggle('pinwave-dark', Boolean(settings.dark));
    root.classList.toggle('pinwave-compact', Boolean(settings.compact));
    root.classList.toggle('pinwave-focus', Boolean(settings.focus));
  };

  chrome.storage.sync.get(defaults, apply);
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'sync') chrome.storage.sync.get(defaults, apply);
  });

  // Reveal pins only as they approach the viewport, including pins added by
  // Pinterest's infinite-scroll feed. A single observer keeps this lightweight.
  const pinSelector = '[data-test-id="pin"], [data-test-id="pinRep"]';
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const revealObserver = 'IntersectionObserver' in window && !reducedMotion.matches
    ? new IntersectionObserver((entries, observer) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('pinwave-revealed');
          observer.unobserve(entry.target);
        });
      }, { rootMargin: '0px 0px 100px 0px', threshold: 0.04 })
    : null;

  const observePins = (root) => {
    if (!revealObserver) return;
    if (root.matches?.(pinSelector) && !root.dataset.pinwaveObserved) {
      root.dataset.pinwaveObserved = 'true';
      revealObserver.observe(root);
    }
    root.querySelectorAll?.(pinSelector).forEach((pin) => {
      if (pin.dataset.pinwaveObserved) return;
      pin.dataset.pinwaveObserved = 'true';
      revealObserver.observe(pin);
    });
  };

  observePins(document);
  let queued = false;
  const mutationObserver = new MutationObserver((records) => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => {
      queued = false;
      records.forEach((record) => record.addedNodes.forEach((node) => {
        if (node.nodeType === Node.ELEMENT_NODE) observePins(node);
      }));
    });
  });
  mutationObserver.observe(document.body, { childList: true, subtree: true });
})();

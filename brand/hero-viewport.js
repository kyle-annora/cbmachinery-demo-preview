/* The first screen includes the normal-flow header and optional announcement.
   Observe their height, not their sticky position while scrolling. */
(() => {
  const hero = document.querySelector('.fi-hero');
  const mount = document.querySelector('[data-site-header]');
  if (!hero || !mount) return;

  function updateHeight() {
    const header = mount.querySelector('.sf-header');
    if (!header) return;
    const announcement = document.querySelector('.announcement');
    const height = header.getBoundingClientRect().height + (announcement?.getBoundingClientRect().height || 0);
    hero.style.setProperty('--fi-chrome-height', `${height}px`);
  }

  const sizes = new ResizeObserver(updateHeight);
  function observeChrome() {
    sizes.disconnect();
    const header = mount.querySelector('.sf-header');
    const announcement = document.querySelector('.announcement');
    if (header) sizes.observe(header);
    if (announcement) sizes.observe(announcement);
    updateHeight();
  }
  // Navigation is mounted asynchronously; the announcement can be removed.
  const structure = new MutationObserver(observeChrome);
  structure.observe(mount, { childList: true });
  structure.observe(document.body, { childList: true });
  observeChrome();
})();

/* Approved site-foundation navigation. Footer and inquiry context remain shared. */
(() => {
  const path = globalThis.CB_PAGES_PATH();
  // The server also serves request.html for the internal receiving route.
  // Keep that staff context compact instead of adding the public navigation.
  if (path.startsWith('/demo/')) {
    const legacy = document.querySelector('[data-legacy-flow-header]');
    if (legacy) legacy.hidden = false;
    document.querySelector('[data-site-header]')?.remove();
    return;
  }
  const icon = name => globalThis.CB_PAGES_HTML(`<img class="icon" src="/cbmachinery-demo-preview/review-kit/icons/${name}.svg" alt="">`);
  const origins = {'/':'home','/machines/':'machines','/machines/double-disc/':'double-disc','/machines/clamp-bore/':'clamp-bore','/rebuilds/':'rebuilds','/services/':'services','/applications/':'applications','/applications/auto-heavy-powertrain/':'auto-heavy-powertrain','/inventory/':'inventory','/resources/':'resources','/about-us/':'about-us','/contact-us/':'contact-us','/resources/quote-preparation/':'quote-preparation','/resources/double-disc-grinding/':'double-disc-guide'};
  const publicInquiry = value => typeof value === 'string' && /^\/request\/(?:\?|$)/.test(value) ? value : null;
  function sectionForPath() {
    if (path.startsWith('/machines/rebuilds/') || path.startsWith('/rebuilds/') || path === '/vertical-turning-lathes/' || path.startsWith('/services/') || path === '/automation/') return 'services';
    if (path.startsWith('/machines/') || path === '/new/') return 'machines';
    if (path.startsWith('/applications/')) return 'applications';
    if (path.startsWith('/inventory/') || path.startsWith('/wheel-carts/') || path === '/used/' || path === '/dresser-diamonds/' || path.startsWith('/stock-')) return 'inventory';
    if (path.startsWith('/resources/') || path.startsWith('/news/') || path === '/blog/' || path === '/videos/') return 'resources';
    if (path.startsWith('/projects/') || path.startsWith('/quotes/')) return 'projects';
    return '';
  }
  function inquiryForPath() {
    if (/^\/request(?:\.html|\/|$)/.test(path)) return '#workspace';
    const supplied = publicInquiry(document.body.dataset.quoteUrl) || publicInquiry(document.body.dataset.inquiryUrl);
    if (supplied) return supplied;
    if (path === '/machines/robotic-double-disc/') return '/request/?application=ring-gear&source=machine-explorer&equipment=robotic-double-disc&focus=machine';
    if (path === '/applications/ring-gear-grinding/') return '/request/?application=ring-gear&source=machine-explorer&equipment=robotic-double-disc&focus=ring&entry=application';
    let origin = origins[path];
    const params = new URLSearchParams({source:'website'});
    if (!origin) {
      if (path.startsWith('/machines/rebuilds/') || path === '/vertical-turning-lathes/') origin = 'rebuilds';
      else if (path.startsWith('/machines/double-disc/')) origin = 'double-disc';
      else if (path.startsWith('/machines/clamp-bore/')) origin = 'clamp-bore';
      else if (path.startsWith('/services/') || path === '/automation/') {
        origin = 'services'; const service = path === '/automation/' ? 'automation' : path.split('/')[2];
        if (['machine-service','spindle-rebuild','automation','control-retrofits','hand-scraping','production-grinding'].includes(service)) params.set('service', service);
      } else if (path.startsWith('/applications/')) {
        origin = 'applications'; const industry = {aerospace:'aerospace',bearing:'bearings',compressor:'compressor',magnetics:'magnetics','oil-gas':'other','knife-tools':'other','recreational-vehicles':'other'}[path.split('/')[2]];
        if (industry) params.set('industry',industry);
      } else origin = ({machines:'machines',services:'rebuilds',applications:'applications',inventory:'inventory',resources:'resources'})[sectionForPath()] || 'home';
    }
    params.set('sitePage',origin); return '/request/?'+params;
  }
  const quote = inquiryForPath();
  window.CB_SITE_QUOTE = quote;
  window.CB_SITE_SECTION = document.body.dataset.section || sectionForPath();
  window.CB_SITE_PAGES = [
    ['Grinding machines','Machine families','/machines/','new equipment grinding'],
    ['Double-disc grinding','Machine family','/machines/double-disc/','double disc horizontal vertical'],
    ['Clamp-bore grinding','Machine family','/machines/clamp-bore/','clamp bore spindle'],
    ['Swing-arm grinding','Machine process','/machines/double-disc/horizontal/swing-arm/','swing arm tooling'],
    ['3D Machine Explorer','Interactive system','/machines/robotic-double-disc/','robot robotic automation 3d'],
    ['Ring gear face grinding','Application explorer','/applications/ring-gear-grinding/','ring gear process'],
    ['Auto & heavy powertrain','Application library','/applications/auto-heavy-powertrain/','powertrain transmission automotive'],
    ['Spindle rebuilds','Service','/services/spindle-rebuild/','spindle repair rebuild'],
    ['Machine inventory','Equipment','/inventory/','stock used available'],
    ['Resources & insights','Resources','/resources/','videos news guide'],
    ['My projects','Saved inquiries and quotations','/projects/','projects saved resume quote inquiry'],
    ['Request a Quote','Guided inquiry',quote,'request quote inquiry']
  ];
  const head = document.querySelector('[data-site-header]');
  const internalRoute = path.startsWith('/demo/');
  if (head) head.style.display = 'contents';
  if (head && internalRoute) head.innerHTML = globalThis.CB_PAGES_HTML('<header class="sf-internal-header" aria-label="C&B workspace"><a href="/cbmachinery-demo-preview/demo/" aria-label="C&B workspace"><img src="/cbmachinery-demo-preview/assets/logo.webp" width="144" height="35" alt="C&B Machinery"></a><a href="/cbmachinery-demo-preview/demo/">C&B workspace</a><a href="/cbmachinery-demo-preview/">Back to website</a></header>');
  if (head && !internalRoute) document.body.dataset.sfNavigation = 'true';
  const foot = document.querySelector('[data-site-footer]');
  if (foot) foot.innerHTML = globalThis.CB_PAGES_HTML(`<footer class="cb-footer"><div class="site-wrap cb-footer-grid"><div class="cb-footer-brand"><a href="/cbmachinery-demo-preview/" aria-label="C&B Machinery home"><img src="/cbmachinery-demo-preview/assets/logo.webp" alt="C&B Machinery" width="164" height="40" loading="lazy"></a><p>Precision grinding.<br>Personal engineering.</p><address>55397 Lyon Industrial Dr<br>New Hudson, MI 48165, USA</address><a href="tel:+12482649800">+1 248.264.9800</a><a href="mailto:sales@cbmachinery.com">sales@cbmachinery.com</a></div><div><h2>Equipment</h2><a href="/cbmachinery-demo-preview/machines/">All machines</a><a href="/cbmachinery-demo-preview/machines/double-disc/">Double-disc grinding</a><a href="/cbmachinery-demo-preview/machines/clamp-bore/">Clamp-bore grinding</a><a href="/cbmachinery-demo-preview/machines/robotic-double-disc/">3D Machine Explorer</a><a href="/cbmachinery-demo-preview/inventory/">Machine inventory</a></div><div><h2>Your application</h2><a href="/cbmachinery-demo-preview/applications/">Explore applications</a><a href="/cbmachinery-demo-preview/applications/ring-gear-grinding/">Ring gear face grinding</a><a href="/cbmachinery-demo-preview/rebuilds/">Machine rebuilds</a><a href="/cbmachinery-demo-preview/services/">Services & support</a><a href="${quote}">Request a Quote</a><a href="/cbmachinery-demo-preview/projects/">My projects</a></div><div><h2>C&B Machinery</h2><a href="/cbmachinery-demo-preview/about-us/">About us</a><a href="/cbmachinery-demo-preview/resources/">Resources & insights</a><a href="/cbmachinery-demo-preview/contact-us/">Contact us</a><div class="cb-footer-socials"><a href="https://www.facebook.com/cbmachinery/" aria-label="C&B on Facebook">${icon('facebook-f')}</a><a href="https://twitter.com/cbmachinery" aria-label="C&B on X">${icon('x-twitter')}</a><a href="https://www.instagram.com/cbmachinery/" aria-label="C&B on Instagram">${icon('instagram')}</a><a href="https://www.youtube.com/@cbmachinery" aria-label="C&B on YouTube">${icon('youtube')}</a></div></div></div><div class="site-wrap cb-footer-bottom"><span>C&B Machinery · Website demo</span><span>Local preview. No inquiries or quotations sent.</span><a href="/cbmachinery-demo-preview/demo/">C&B workspace · Demo${icon('arrow-up-right')}</a></div></footer>`);

  function stylesheet(href) {
    if (document.querySelector(globalThis.CB_PAGES_HTML(`link[href="${href}"]`))) return;
    const link = document.createElement('link'); link.rel = 'stylesheet'; link.href = globalThis.CB_PAGES_URL(href); document.head.append(link);
  }
  if (head || foot) stylesheet('/site-shell.css');
  if (head && !internalRoute) {
    stylesheet('/cbmachinery-demo-preview/site/navigation.css');
    if (!document.querySelector('script[src="/cbmachinery-demo-preview/site/navigation.js"]')) {
      const script = document.createElement('script'); script.src = '/cbmachinery-demo-preview/site/navigation.js'; script.defer = true; document.head.append(script);
    }
  }
})();

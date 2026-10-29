/* Generated GitHub Pages project-site URL adapter. */
(() => {
  const base = "/cbmachinery-demo-preview/";
  const prefix = base.slice(0,-1);
  const path = (value=location.pathname) => {
    value=String(value);
    return value===prefix ? '/' : value.startsWith(base) ? '/'+value.slice(base.length) : value;
  };
  const url = value => {
    if (value==null) return value;
    if (value instanceof URL) return value;
    value=String(value);
    if (!value.startsWith('/') || value.startsWith('//')) return value;
    value=path(value);
    const parsed=new URL(value,'https://pages-adapter.invalid');
    const legacy=parsed.pathname.match(/^\/demo\/requests\/([^/]+)\/?$/);
    if (legacy) {
      parsed.pathname='/demo/requests/';
      parsed.searchParams.set('id',decodeURIComponent(legacy[1]));
      value=parsed.pathname+parsed.search+parsed.hash;
    }
    return prefix+value;
  };
  const set = value => value.split(',').map(item=>{
    const bits=item.trim().split(/\s+/);bits[0]=url(bits[0]);return bits.join(' ');
  }).join(', ');
  const html = value => String(value)
    .replace(/(^|[\s<])(href|src|srcset|poster)\s*=\s*(["'])(.*?)\3/gis,
      (_,start,name,quote,value)=>start+name+'='+quote+(name.toLowerCase()==='srcset'?set(value):url(value))+quote)
    .replace(/url\(\s*(["']?)(\/(?!\/)[^\s)"']+)\1\s*\)/gi,
      (_,quote,value)=>'url('+quote+url(value)+quote+')');
  globalThis.CB_PAGES_BASE=base;
  globalThis.CB_PAGES_PATH=path;
  globalThis.CB_PAGES_URL=url;
  globalThis.CB_PAGES_HTML=html;
  globalThis.CB_PAGES_ASSIGN=value=>location.assign(url(value));
  globalThis.CB_PAGES_REPLACE=value=>location.replace(url(value));
  globalThis.CB_PAGES_REPLACE_STATE=(state,title,value)=>history.replaceState(state,title,value==null?value:url(value));
  globalThis.CB_PAGES_PUSH_STATE=(state,title,value)=>history.pushState(state,title,value==null?value:url(value));
})();

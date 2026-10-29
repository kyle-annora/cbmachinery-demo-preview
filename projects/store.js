// Local demo project records. Inquiry snapshots and quotation revisions stay immutable.
const PREFIX = 'cb-projects-v1:record:';
const DRAFT_KEY = 'cb-demo-v1:draft';
const REQUEST_PREFIX = 'cb-demo-v1:request:';
const QUOTE_PREFIX = 'cb-quotes-v1:record:';
const clone = value => JSON.parse(JSON.stringify(value));
const safeId = value => typeof value === 'string' && /^[A-Za-z0-9_-]{1,80}$/.test(value);
const now = () => new Date().toISOString();
const read = key => { try { return JSON.parse(localStorage.getItem(key)); } catch { return null; } };
const write = (key, value) => localStorage.setItem(key, JSON.stringify(value));
function records(prefix) {
  const result = [];
  try { for (let i = 0; i < localStorage.length; i++) { const key = localStorage.key(i); if (key?.startsWith(prefix)) { const value = read(key); if (value && typeof value === 'object') result.push(value); } } } catch {}
  return result;
}
const all = () => records(PREFIX).filter(p => safeId(p.id) && Array.isArray(p.requestIds));
export function getProject(id) { return safeId(id) ? read(PREFIX + id) : null; }
export function getProjectForRequest(id) { return all().find(p => p.requestIds.includes(id)) || null; }
function create(id, date) { return { version: 1, id, createdAt: date || now(), updatedAt: date || now(), requestIds: [], draft: null }; }

export function ensureForDraft(draft) {
  let project = safeId(draft.projectId) ? getProject(draft.projectId) : null;
  if (!project && draft.submissionId) project = getProjectForRequest(draft.submissionId);
  if (!project) project = create(safeId(draft.projectId) ? draft.projectId : 'CB-P-' + crypto.randomUUID().slice(0, 8).toUpperCase());
  draft.projectId = project.id;
  project.title = draft.part || 'New grinding project';
  project.company = draft.company || '';
  project.updatedAt = now();
  project.draft = draft.submissionId ? null : clone(draft);
  write(PREFIX + project.id, project);
  return project.id;
}

export function recordInquiry(record) {
  if (!safeId(record.submissionId)) throw new Error('Invalid inquiry reference');
  let project = safeId(record.projectId) ? getProject(record.projectId) : null;
  project ||= getProjectForRequest(record.submissionId);
  // Deterministic migration means opening an old link never duplicates a project.
  project ||= create(safeId(record.projectId) ? record.projectId : 'CB-P-' + record.submissionId.replace(/^CB-DEMO-/, ''), record.savedAt);
  if (!project.requestIds.includes(record.submissionId)) project.requestIds.push(record.submissionId);
  project.title = record.part || 'Grinding project';
  project.company = record.company || '';
  project.updatedAt = record.savedAt || now();
  project.draft = null;
  write(PREFIX + project.id, project);
  return project.id;
}

export function getProjectDraft(id) {
  const draft = getProject(id)?.draft;
  return draft ? clone(draft) : null;
}

export function migrateLegacyProjects() {
  const inquiries = records(REQUEST_PREFIX).filter(r => safeId(r.submissionId));
  for (const inquiry of inquiries) if (!getProjectForRequest(inquiry.submissionId)) recordInquiry(inquiry);
  const draft = read(DRAFT_KEY);
  if (draft && !draft.submissionId && (draft.part || draft.description || draft.name || draft.email)) {
    if (!safeId(draft.projectId) || !getProject(draft.projectId)) {
      // Persist the migration identity first so a partial write can be retried.
      if (!safeId(draft.projectId)) draft.projectId = 'CB-P-' + crypto.randomUUID().slice(0, 8).toUpperCase();
      write(DRAFT_KEY, draft);
      ensureForDraft(draft);
    }
  }
  // The old demo saved immutable customer previews without a visibility field.
  // Carry those previews forward once; never expose an editable quotation draft.
  for (const bundle of records(QUOTE_PREFIX)) {
    if (!bundle.visibilityVersion && safeId(bundle.draft?.id) && Array.isArray(bundle.revisions)) {
      bundle.visibilityVersion = 1;
      bundle.customerRevisions = bundle.revisions.map(r => r.revision);
      bundle.sharedAt = Object.fromEntries(bundle.revisions.map(r => [r.revision, r.savedAt || r.updatedAt || now()]));
      write(QUOTE_PREFIX + bundle.draft.id, bundle);
    }
  }
}

export function projectInquiries(project) {
  return (project.requestIds || []).map(id => read(REQUEST_PREFIX + id)).filter(Boolean).sort((a,b) => String(b.savedAt).localeCompare(String(a.savedAt)));
}

export function projectQuotations(project) {
  // Only explicitly shared immutable revisions belong in the customer project.
  return records(QUOTE_PREFIX).filter(b => Array.isArray(b.revisions)).flatMap(b => {
    const shared = Array.isArray(b.customerRevisions) ? b.customerRevisions : [];
    return b.revisions.filter(r => project.requestIds.includes(r.requestId) && shared.includes(r.revision)).map(revision => ({...revision, availableAt: b.sharedAt?.[revision.revision] || revision.savedAt || revision.updatedAt}));
  }).sort((a,b) => String(b.availableAt).localeCompare(String(a.availableAt)) || b.revision - a.revision);
}

export function shareQuotation(quoteId, revisionNumber) {
  const bundle = safeId(quoteId) ? read(QUOTE_PREFIX + quoteId) : null;
  const revision = bundle?.revisions?.find(r => r.revision === revisionNumber);
  if (!revision) throw new Error('Quotation revision not found');
  const inquiry = read(REQUEST_PREFIX + revision.requestId);
  if (!inquiry) throw new Error('Save a real demo inquiry before adding a quotation to a project.');
  const projectId = getProjectForRequest(inquiry.submissionId)?.id || recordInquiry(inquiry);
  const shared = new Set(bundle.customerRevisions || []); shared.add(revisionNumber);
  bundle.customerRevisions = [...shared];
  bundle.visibilityVersion = 1;
  bundle.sharedAt = {...bundle.sharedAt, [revisionNumber]: now()};
  const project = getProject(projectId);
  project.updatedAt = bundle.sharedAt[revisionNumber];
  write(PREFIX + projectId, project);
  write(QUOTE_PREFIX + quoteId, bundle);
  return projectId;
}

export function isSharedQuotation(quoteId, revisionNumber) {
  const bundle = safeId(quoteId) ? read(QUOTE_PREFIX + quoteId) : null;
  return Boolean(bundle?.customerRevisions?.includes(revisionNumber));
}

export function listProjects() { return all().sort((a,b) => String(b.updatedAt).localeCompare(String(a.updatedAt))); }
export const projectHref = id => '/projects/?project=' + encodeURIComponent(id);

// A local account-flow preview, not an authentication or cloud-storage boundary.
// Project/inquiry/quotation records remain in their existing namespaces.
import {getProject} from './store.js';

const KEY = 'cb-account-demo-v1:profiles';
const clone = value => JSON.parse(JSON.stringify(value));
const safeId = value => typeof value === 'string' && /^[A-Za-z0-9_-]{1,80}$/.test(value);
const normalizedEmail = value => typeof value === 'string' ? value.trim().toLowerCase() : '';
const validEmail = value => value.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
const validDate = value => typeof value === 'string' && Number.isFinite(Date.parse(value));

function validProfile(profile) {
  return Boolean(profile && safeId(profile.id) && profile.kind === 'demo-preview'
    && typeof profile.email === 'string' && validEmail(profile.email)
    && normalizedEmail(profile.email) === profile.email
    && typeof profile.name === 'string' && profile.name.length <= 120
    && Array.isArray(profile.projectIds) && profile.projectIds.every(safeId)
    && new Set(profile.projectIds).size === profile.projectIds.length
    && validDate(profile.createdAt) && validDate(profile.updatedAt));
}

function readContainer() {
  const raw = localStorage.getItem(KEY);
  if (raw === null) return {version: 1, activeId: null, profiles: []};
  const value = JSON.parse(raw);
  if (!value || value.version !== 1 || !Array.isArray(value.profiles)
    || !value.profiles.every(validProfile)
    || new Set(value.profiles.map(profile => profile.id)).size !== value.profiles.length
    || new Set(value.profiles.map(profile => profile.email)).size !== value.profiles.length
    || !(value.activeId === null || safeId(value.activeId) && value.profiles.some(profile => profile.id === value.activeId))) {
    throw new Error('The saved account preview could not be read. Your projects are unchanged.');
  }
  return value;
}

function existingProject(projectId) {
  const project = safeId(projectId) ? getProject(projectId) : null;
  return project && project.id === projectId && Array.isArray(project.requestIds) ? project : null;
}

function requireProject(projectId) {
  if (!existingProject(projectId)) throw new Error('This project is not available in this browser.');
}

function persist(container, profile) {
  // One setItem writes the active profile and project association together.
  // Do not catch failures here: callers must keep the form open instead of showing success.
  localStorage.setItem(KEY, JSON.stringify(container));
  return clone(profile);
}

export function getAccountPreview() {
  try {
    const container = readContainer();
    const profile = container.profiles.find(item => item.id === container.activeId);
    return profile ? clone(profile) : null;
  } catch {
    return null;
  }
}

export function saveAccountPreview({email, name = '', projectId} = {}) {
  const address = normalizedEmail(email);
  if (!validEmail(address)) throw new Error('Enter a valid work email address.');
  if (typeof name !== 'string' || name.trim().length > 120) throw new Error('Enter a name of 120 characters or fewer.');
  requireProject(projectId);
  const container = readContainer();
  const displayName = name.trim();
  const previous = container.profiles.find(profile => profile.email === address);
  const timestamp = new Date().toISOString();
  if (previous) {
    const needsLink = !previous.projectIds.includes(projectId);
    const nameChanged = previous.name !== displayName;
    const activeChanged = container.activeId !== previous.id;
    if (!needsLink && !nameChanged && !activeChanged) return clone(previous);
    if (needsLink) previous.projectIds.push(projectId);
    if (nameChanged) previous.name = displayName;
    if (needsLink || nameChanged) previous.updatedAt = timestamp;
    container.activeId = previous.id;
    return persist(container, previous);
  }
  const profile = {
    id: 'CB-A-DEMO-' + crypto.randomUUID().slice(0, 8).toUpperCase(),
    kind: 'demo-preview', email: address, name: displayName,
    projectIds: [projectId], createdAt: timestamp, updatedAt: timestamp
  };
  container.profiles.push(profile);
  container.activeId = profile.id;
  return persist(container, profile);
}

export function linkProjectToPreview(projectId) {
  requireProject(projectId);
  const container = readContainer();
  const profile = container.profiles.find(item => item.id === container.activeId);
  if (!profile) throw new Error('Create the demo account preview before adding this project.');
  if (profile.projectIds.includes(projectId)) return clone(profile);
  profile.projectIds.push(projectId);
  profile.updatedAt = new Date().toISOString();
  return persist(container, profile);
}

export function hasPreviewProject(projectId) {
  return Boolean(existingProject(projectId) && getAccountPreview()?.projectIds.includes(projectId));
}

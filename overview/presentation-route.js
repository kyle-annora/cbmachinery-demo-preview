// Overview explains the value; the same route then demonstrates one customer case.
export const PANEL_SEQUENCE = Object.freeze([8, 9, 0, 1, 2, 3, 4, 5, 6, 7]);
export const PANEL_HASHES = Object.freeze(['get-found', 'build-confidence', 'brand-assets', 'brief', 'review', 'handoff', 'quotation', 'value', 'overview', 'journey']);
export function panelFromHash(hash) {
  const index = PANEL_HASHES.indexOf(String(hash).replace(/^#/, ''));
  return index < 0 ? 8 : index;
}
export function adjacentPanel(panel, direction) {
  const index = PANEL_SEQUENCE.indexOf(panel);
  if (index < 0) return 8;
  return PANEL_SEQUENCE[Math.max(0, Math.min(PANEL_SEQUENCE.length - 1, index + direction))];
}
export function chapterForPanel(panel) {
  return panel >= 8 || panel === 7 ? 8 : panel === 0 ? 0 : panel < 3 ? 1 : 3;
}

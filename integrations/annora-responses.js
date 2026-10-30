/* Annora integration port. The shipped transport is deliberately browser-local.
   Replace the transport only when a customer-facing Annora API is available. */
const PREFIX = 'cb-annora-response-demo-v1:';
const intents = new Set(['discuss', 'revision']);
const clone = value => structuredClone(value);
const nonempty = value => typeof value === 'string' && value.trim().length > 0 && value.length <= 120;
const validDate = value => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(value) && Number.isFinite(Date.parse(value));
function reference(context) {
  if (!context || !['projectId','requestId','quoteId'].every(key => nonempty(context[key])) || !Number.isSafeInteger(context.revision) || context.revision < 1) throw new Error('Open a saved project quotation before submitting a response.');
  return {projectId:context.projectId, inquiryId:context.requestId, quotationId:context.quoteId, revision:context.revision};
}
const receiptKey = ref => PREFIX + encodeURIComponent(ref.quotationId) + ':' + ref.revision;
const sameReference = (a,b) => Object.keys(a).every(key => a[key] === b?.[key]);
export function responseCommand({context, intent, note = ''}) {
  const ref = reference(context);
  if (!intents.has(intent)) throw new Error('Choose a discussion or revision request.');
  if (typeof note !== 'string' || note.trim().length > 2000) throw new Error('Use a response note of up to 2,000 characters.');
  const inputs = {intent, note:note.trim()};
  // One response per exact revision. Retrying never creates another record.
  const idempotencyKey = JSON.stringify(['quotation-response-v1',...Object.values(ref)]);
  return {version:1, operation:'quotation.response.submit', source:'cbmachinery-demo', reference:ref, inputs, idempotencyKey};
}
export function validateResponseReceipt(receipt, command, {demo = false} = {}) {
  if (!receipt || !nonempty(receipt.submissionId) || !validDate(receipt.receivedAt) || receipt.status !== 'submitted' || receipt.demo !== demo || !sameReference(command.reference,receipt.reference) || receipt.intent !== command.inputs.intent || receipt.note !== command.inputs.note || receipt.idempotencyKey !== command.idempotencyKey) throw new Error('The submission could not be confirmed. Your response is still here. Please retry.');
  return clone(receipt);
}
export function getDemoResponse(context) {
  try {
    const ref = reference(context), raw = localStorage.getItem(receiptKey(ref));
    if (!raw) return null;
    const receipt = JSON.parse(raw);
    const command = responseCommand({context,intent:receipt.intent,note:receipt.note});
    return validateResponseReceipt(receipt,command,{demo:true});
  } catch { return null; }
}
export async function demoResponseTransport(command) {
  // The delay makes the pending UI observable. This does not make a network call.
  await new Promise(resolve => setTimeout(resolve,240));
  const context = {projectId:command.reference.projectId,requestId:command.reference.inquiryId,quoteId:command.reference.quotationId,revision:command.reference.revision};
  const checked = responseCommand({context,...command.inputs});
  if (checked.idempotencyKey !== command.idempotencyKey) throw new Error('The response reference changed. Refresh the quotation and try again.');
  const key = receiptKey(command.reference), raw = localStorage.getItem(key);
  if (raw !== null) {
    const existing = JSON.parse(raw);
    if (existing.idempotencyKey !== command.idempotencyKey || existing.intent !== command.inputs.intent || existing.note !== command.inputs.note) throw new Error('A response is already recorded for this quotation revision. Return to your project to review it.');
    return validateResponseReceipt(existing,command,{demo:true});
  }
  const receipt = {submissionId:'CB-R-DEMO-'+crypto.randomUUID().slice(0,8).toUpperCase(),receivedAt:new Date().toISOString(),status:'submitted',demo:true,reference:clone(command.reference),intent:command.inputs.intent,note:command.inputs.note,idempotencyKey:command.idempotencyKey};
  localStorage.setItem(key,JSON.stringify(receipt));
  return clone(receipt);
}
export function createResponseService({transport, demo = false}) {
  if (typeof transport !== 'function') throw new Error('A response transport is required.');
  return async input => {
    const command = responseCommand(input);
    return validateResponseReceipt(await transport(clone(command)),command,{demo});
  };
}
export const submitQuotationResponse = createResponseService({transport:demoResponseTransport,demo:true});

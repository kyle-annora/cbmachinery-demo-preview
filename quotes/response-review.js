import {responseCommand} from '../integrations/annora-responses.js';

// A review is an in-memory checkpoint, never a submission or persistence event.
// The caller supplies a transport that validates the exact-revision receipt.
export function createResponseReview({context, submit, initialIntent = 'discuss', initialNote = ''} = {}) {
  const savedContext = context && typeof context === 'object' ? structuredClone(context) : null;
  let phase = 'editing', intent = initialIntent, note = initialNote;
  let reviewed = null, receipt = null, inFlight = null;
  const getState = () => structuredClone({phase, intent, note, receipt});
  const editable = () => {
    if (phase === 'pending') throw new Error('Wait for the current response to finish.');
    if (phase === 'received') throw new Error('A response is already saved for this quotation revision.');
  };

  function review(input) {
    editable();
    // A changed/invalid review attempt cannot leave an older confirmation armed.
    reviewed = null;
    phase = 'editing';
    const command = responseCommand({context:savedContext, intent:input?.intent, note:input?.note});
    intent = command.inputs.intent;
    note = command.inputs.note;
    reviewed = structuredClone({context:savedContext, intent, note});
    phase = 'review';
    return getState();
  }

  function edit() {
    editable();
    reviewed = null;
    phase = 'editing';
    return getState();
  }

  function submitReviewed() {
    if (inFlight) return inFlight;
    if (phase !== 'review' || !reviewed) return Promise.reject(new Error('Review your response before confirming submission.'));
    if (typeof submit !== 'function') return Promise.reject(new Error('Response submission is not connected.'));
    const payload = structuredClone(reviewed);
    phase = 'pending';
    inFlight = Promise.resolve().then(() => submit(payload)).then(result => {
      if (!result || typeof result.submissionId !== 'string' || !result.submissionId.trim() || typeof result.receivedAt !== 'string' || !Number.isFinite(Date.parse(result.receivedAt))) {
        throw new Error('A valid submission receipt was not returned.');
      }
      receipt = structuredClone(result);
      phase = 'received';
      return structuredClone(receipt);
    }).catch(error => {
      phase = 'review';
      throw error;
    }).finally(() => { inFlight = null; });
    return inFlight;
  }

  return {getState, review, edit, submitReviewed};
}

// Document availability and draft changes are independent project facts.
export const quotationHref = quote => `/quotes/?quote=${encodeURIComponent(quote.id)}&revision=${encodeURIComponent(quote.revision)}&view=customer&from=project`;
export const savedInquiryHref = inquiry => '/inquiry-document/?request=' + encodeURIComponent(inquiry.submissionId);

export function projectState(project, records = [], quotes = []) {
  const hasDraft = Boolean(project.draft);
  const latestInquiry = records[0] || null;
  const latestQuote = quotes[0] || null;
  const kind = latestQuote ? 'quote' : hasDraft && !latestInquiry ? 'draft' : 'inquiry';
  const label = latestQuote ? 'Quotation available' : hasDraft && !latestInquiry ? 'Draft inquiry' : latestInquiry ? 'Inquiry saved' : 'Project saved';
  const projectUrl = '/projects/?project=' + encodeURIComponent(project.id);
  const primaryAction = latestQuote
    ? {label: 'View quotation', href: quotationHref(latestQuote)}
    : hasDraft
      ? {label: 'Continue inquiry', href: '/request/?project=' + encodeURIComponent(project.id)}
      : {label: 'View project', href: projectUrl};
  const quoteInquiry = latestQuote
    ? records.find(record => record.submissionId === latestQuote.requestId)
      || (latestQuote.sourceSnapshot?.submissionId === latestQuote.requestId ? latestQuote.sourceSnapshot : null)
    : null;
  return {
    kind, label, primaryAction, hasDraft, latestInquiry, latestQuote, quoteInquiry,
    hasQuoteInquiryDocument: Boolean(latestQuote && records.some(record => record.submissionId === latestQuote.requestId)),
    revision: latestQuote ? `Rev ${String(latestQuote.revision).padStart(2, '0')}` : '',
    draftLabel: hasDraft && (latestInquiry || latestQuote) ? 'Draft changes' : '',
    currentData: project.draft || latestInquiry || {},
  };
}

export function projectContext(data) {
  const known = value => value !== undefined && value !== null && String(value).trim() !== '' && !['Not sure yet', 'To discuss'].includes(value);
  const unit = data.unit || 'mm';
  const dimensions = known(data.diameter)
    ? `Ø${data.diameter}${known(data.thickness) ? ` × ${data.thickness}` : ''} ${unit}`
    : known(data.thickness) ? `${data.thickness} ${unit} thick` : '';
  return [known(data.material) ? data.material : '', dimensions].filter(Boolean).join(' · ');
}

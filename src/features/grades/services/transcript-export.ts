const DOCX_FONT_FAMILY = 'Times New Roman';

/** Convert a student name to a filesystem-safe value without changing its casing. */
export function getSafeTranscriptFileName(name: string): string {
  const normalized = name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/Đ/g, 'D')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9]+/gi, '_')
    .replace(/^_+|_+$/g, '');

  return `Bang_diem_${normalized || 'SinhVien'}`;
}

function splitCombinedSummaryParagraph(paragraph: string): string {
  if (!paragraph.includes('{{tongTinChi}}') || !paragraph.includes('{{gpa10}}')) {
    return paragraph;
  }

  const parts = paragraph.match(/^(<w:p\b[^>]*>(?:<w:pPr>[\s\S]*?<\/w:pPr>)?)([\s\S]*)(<\/w:p>)$/);
  if (!parts) return paragraph;

  const [, prefix, body, suffix] = parts;
  const runs = body.match(/<w:r(?:\s[^>]*)?>[\s\S]*?<\/w:r>/g) ?? [];
  const totalCreditsRun = runs.find((run) => run.includes('{{tongTinChi}}'));
  const gpa10Run = runs.find((run) => run.includes('{{gpa10}}'));
  if (!totalCreditsRun || !gpa10Run) return paragraph;

  // A duplicated Word paragraph ID is invalid, so omit the optional IDs on the clone.
  const clonedPrefix = prefix
    .replace(/\s+w14:paraId="[^"]*"/g, '')
    .replace(/\s+w14:textId="[^"]*"/g, '');

  return `${prefix}${totalCreditsRun}${suffix}${clonedPrefix}${gpa10Run}${suffix}`;
}

/** Repair layout and font inconsistencies in the DOCX template before rendering. */
export function normalizeTranscriptDocumentXml(xml: string): string {
  const withConsistentFonts = xml.replace(
    /<w:rFonts\b[^>]*\/>/g,
    `<w:rFonts w:ascii="${DOCX_FONT_FAMILY}" w:hAnsi="${DOCX_FONT_FAMILY}" w:eastAsia="${DOCX_FONT_FAMILY}" w:cs="${DOCX_FONT_FAMILY}"/>`,
  );

  return withConsistentFonts.replace(/<w:p\b[^>]*>[\s\S]*?<\/w:p>/g, splitCombinedSummaryParagraph);
}

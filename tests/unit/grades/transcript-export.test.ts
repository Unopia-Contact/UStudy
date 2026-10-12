import { describe, expect, it } from 'vitest';
import {
  getSafeTranscriptFileName,
  normalizeTranscriptDocumentXml,
} from '../../../src/features/grades/services/transcript-export';

describe('transcript export', () => {
  it('preserves the original casing when removing Vietnamese diacritics', () => {
    expect(getSafeTranscriptFileName('ĐÀO THỊ HỒNG')).toBe('Bang_diem_DAO_THI_HONG');
    expect(getSafeTranscriptFileName('Đào Thị Hồng')).toBe('Bang_diem_Dao_Thi_Hong');
  });

  it('uses a fallback for a name without safe filename characters', () => {
    expect(getSafeTranscriptFileName('---')).toBe('Bang_diem_SinhVien');
  });

  it('separates transcript totals and normalizes explicit run fonts', () => {
    const xml = [
      '<w:document xmlns:w="word" xmlns:w14="word14"><w:body>',
      '<w:p w14:paraId="ONE"><w:pPr><w:rPr><w:b/></w:rPr></w:pPr>',
      '<w:r><w:rPr><w:rFonts w:ascii="Arial" w:hAnsi="Arial"/></w:rPr><w:t>{{tongTinChi}}</w:t></w:r>',
      '<w:r><w:rPr><w:rFonts w:ascii="Arial" w:hAnsi="Arial"/></w:rPr><w:t>{{gpa10}}</w:t></w:r>',
      '</w:p>',
      '<w:p><w:r><w:t>{{gpa4}}</w:t></w:r></w:p>',
      '</w:body></w:document>',
    ].join('');

    const normalized = normalizeTranscriptDocumentXml(xml);
    const paragraphs = normalized.match(/<w:p\b[^>]*>[\s\S]*?<\/w:p>/g) ?? [];

    expect(paragraphs).toHaveLength(3);
    expect(paragraphs[0]).toContain('{{tongTinChi}}');
    expect(paragraphs[0]).not.toContain('{{gpa10}}');
    expect(paragraphs[1]).toContain('{{gpa10}}');
    expect(paragraphs[2]).toContain('{{gpa4}}');
    expect(normalized).not.toContain('Arial');
    expect(normalized.match(/Times New Roman/g)).toHaveLength(8);
  });
});

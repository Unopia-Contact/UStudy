export interface NormalizedSemester {
    academicYear: string;  // "2026-2027"
    semester: number;      // 1, 2, or 3
}

// ── Helpers ────────────────────────────────────────────────────────────────────

/**
 * Normalize semester string từ Portal hoặc import_meta về format thống nhất.
 *
 * Chấp nhận:
 *   "HK1 (2026-2027)"
 *   "HK1 2026-2027"
 *   "Học kỳ 1 2026-2027"
 *   "2026-2027 / HK1"
 *   { sem: 1, year: "2026-2027" }
 */
export function normalizeSemester(input: unknown): NormalizedSemester | null {
    if (!input) return null;

    const standardizeYear = (yearStr: string) => {
        return yearStr.split('-').map(y => y.trim().length === 2 ? '20' + y.trim() : y.trim()).join('-');
    };

    // Object form from import_meta.params: { sem, year }
    if (typeof input === 'object' && input !== null) {
        const obj = input as Record<string, any>;
        if (obj.academicYear && obj.semester) return normalizeSemester({ year: obj.academicYear, sem: obj.semester });
        if (obj.sem && obj.year && /^[1-3]$/.test(String(obj.sem)) && /^(?:\d{2}|\d{4})-(?:\d{2}|\d{4})$/.test(String(obj.year))) {
            return {
                academicYear: standardizeYear(String(obj.year)),
                semester: Number(obj.sem),
            };
        }
        // Try { semester: "HK1 (2026-2027)" }
        if (obj.semester) {
            return normalizeSemester(String(obj.semester));
        }
        return null;
    }

    const text = String(input).trim().replace(/^(\d{2,4}-\d{2,4})-([1-3])$/, '$1/$2');
    if (!text) return null;

    // Pattern 1: "HK1 (2026-2027)" or "HK1 2026-2027"
    const semFirst = text.match(/(?:học\s*kỳ|hoc\s*ky|HK)\s*([1-3])\s*[(\s,/-]?\s*(\d{2,4}\s*-\s*\d{2,4})/i);
    if (semFirst) {
        return {
            academicYear: standardizeYear(semFirst[2].replace(/\s/g, '')),
            semester: parseInt(semFirst[1], 10),
        };
    }

    // Pattern 2: "2026-2027 / HK1"
    const yearFirst = text.match(/(\d{2,4}\s*-\s*\d{2,4})\s*[/,\s]\s*(?:HK\s*)?([1-3])\b/i);
    if (yearFirst) {
        return {
            academicYear: standardizeYear(yearFirst[1].replace(/\s/g, '')),
            semester: parseInt(yearFirst[2], 10),
        };
    }

    return null;
}

/**
 * So sánh 2 semester đã normalize có giống nhau không.
 */
export function semesterMatch(a: NormalizedSemester | null, b: NormalizedSemester | null): boolean {
    if (!a || !b) return false;
    return a.academicYear === b.academicYear && a.semester === b.semester;
}


export function semesterKey(input: unknown): string {
    const period = normalizeSemester(input);
    return period ? period.academicYear.split('-').map(year => year.slice(-2)).join('-') + '/' + period.semester : '';
}

export function activeSemester(rows: readonly { semester?: unknown }[], configured?: unknown): NormalizedSemester | null {
    const explicit = normalizeSemester(configured);
    if (explicit) return explicit;
    let latest: NormalizedSemester | null = null;
    for (const row of rows) {
        const period = normalizeSemester(row?.semester);
        if (period && (!latest || period.academicYear > latest.academicYear ||
            (period.academicYear === latest.academicYear && period.semester > latest.semester))) latest = period;
    }
    return latest;
}

export function registrationsForSemester<T extends { semester?: unknown }>(
    rows: T[], period: NormalizedSemester | null, acceptMissing = true,
): T[] {
    return rows.filter(row => {
        const semester = normalizeSemester(row.semester);
        return !period || (semester ? semesterMatch(semester, period) : acceptMissing);
    });
}

/** Quy đổi điểm hệ 10 sang thang 4 và thang chữ theo cấu hình hiện hành. */
export function score10ToFourPoint(score: number): number {
    if (!Number.isFinite(score) || score < 3) return 0;
    if (score >= 9) return 4;
    return Number((1 + (score - 3) * 0.5).toFixed(1));
}

export function gradePointToLetter(gradePoint: number): string {
    if (gradePoint >= 4.0) return 'A+';
    if (gradePoint >= 3.5) return 'A';
    if (gradePoint >= 3.0) return 'B+';
    if (gradePoint >= 2.5) return 'B';
    if (gradePoint >= 2.0) return 'C';
    if (gradePoint >= 1.5) return 'D+';
    if (gradePoint >= 1.0) return 'D';
    return 'F';
}

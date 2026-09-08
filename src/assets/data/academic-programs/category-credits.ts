type CategoryNode = {
    total_credits_required?: number | string;
    credits_required?: number | string;
    credits?: number | string;
};

/**
 * Tổng tín chỉ cần hoàn thành của một CTĐT.
 *
 * Mỗi category cấp một đã khai báo số tín chỉ yêu cầu của cả khối. Không cộng
 * các node con vì chúng có thể là phương án tự chọn hoặc phân nhánh chuyên ngành.
 */
export function getProgramRequiredCredits(categories: Record<string, CategoryNode> | null | undefined): number {
    return Object.entries(categories ?? {}).reduce((total, [key, category]) => {
        if (key === 'MASTER_TRANSITION') return total;

        const credits = Number(
            category?.total_credits_required
            ?? category?.credits_required
            ?? category?.credits
            ?? 0,
        );

        return total + (Number.isFinite(credits) && credits > 0 ? credits : 0);
    }, 0);
}

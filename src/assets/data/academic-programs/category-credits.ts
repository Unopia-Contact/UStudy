type CategoryNode = {
    total_credits_required?: number | string;
    credits_required?: number | string;
    credits?: number | string;
    breakdown?: Record<string, CategoryNode>;
    options?: CategoryNode[];
};

function readDeclaredCredits(category: CategoryNode | undefined): number {
    const credits = Number(
        category?.total_credits_required
        ?? category?.credits_required
        ?? category?.credits
        ?? 0,
    );

    return Number.isFinite(credits) && credits > 0 ? credits : 0;
}

function getMajorRequiredCredits(category: CategoryNode): number {
    const declaredCredits = readDeclaredCredits(category);
    if (declaredCredits > 0) return declaredCredits;

    const alternativeCredits = [
        ...(category.options ?? []).map(readDeclaredCredits),
        ...Object.entries(category.breakdown ?? {})
            .filter(([key]) => key.startsWith('MAJOR_'))
            .map(([, branch]) => readDeclaredCredits(branch)),
    ];

    return alternativeCredits.length > 0 ? Math.max(...alternativeCredits) : 0;
}

/**
 * Tổng tín chỉ cần hoàn thành của một CTĐT.
 *
 * Mỗi category cấp một đã khai báo số tín chỉ yêu cầu của cả khối. Không cộng
 * các node con vì chúng có thể là phương án tự chọn hoặc phân nhánh chuyên ngành.
 */
export function getProgramRequiredCredits(categories: Record<string, CategoryNode> | null | undefined): number {
    return Object.entries(categories ?? {}).reduce((total, [key, category]) => {
        if (key === 'MASTER_TRANSITION') return total;

        const credits = key === 'MAJOR'
            ? getMajorRequiredCredits(category)
            : readDeclaredCredits(category);

        return total + credits;
    }, 0);
}

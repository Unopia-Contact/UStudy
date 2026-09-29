// Constants.js

/**
* Interface cho CONFIG
*/
interface CONFIG {
    /**
     * Kích thước quần thể
     */
    POPULATION_SIZE: number;
    /**
     * Số thế hệ
     */
    GENERATIONS: number;
    /**
     * Tỷ lệ đột biến
     */
    MUTATION_RATE: number;
    /**
     * Kích thước giải đấu
     */
    TOURNAMENT_SIZE: number;
}

/**
 * Interface cho WEIGHTS
 */
interface WEIGHTS {
    /**
     * Trọng số cơ bản
     */
    BASE: number;
    /**
     * Trọng số vi phạm cứng
     */
    PENALTY_HARD: number;
    /**
     * Trọng số vi phạm ngày nghỉ
     */
    PENALTY_DAY_OFF: number;
    /**
     * Trọng số buổi học
     */
    BONUS_SESSION: number;
    /**
     * Trọng số buổi học sai
     */
    PENALTY_WRONG_SESSION: number;
    /**
     * Trọng số chiến thuật
     */
    BONUS_COMPRESS: number;
    /**
     * Trọng số chiến thuật sai
     */
    PENALTY_SPREAD: number;
    /**
     * Trọng số trống tiết
     */
    PENALTY_GAP: number;
    /**
     * Trọng số vi phạm lựa chọn thủ công
     */
    PENALTY_MANUAL_SELECTION_CHANGED: number;
}

interface GROUP_SCHEDULER_CONFIG {
    DEFAULT_MAX_SOLUTIONS: number;
    SEARCH_NODE_BUDGET: number;
    RELAXED_CLASS_CANDIDATE_LIMIT: number;
}

interface GROUP_SCHEDULER_WEIGHTS {
    FAIRNESS: number;
    SHARED_SLOT_BONUS: number;
    PERSONAL_PREFERRED_BONUS: number;
    PERSONAL_REQUIRED_BONUS: number;
    GROUP_PREFERRED_BONUS: number;
    GROUP_REQUIRED_BONUS: number;
    PERSONAL_PREFERRED_MISS_PENALTY: number;
    PERSONAL_REQUIRED_MISS_PENALTY: number;
    GROUP_PREFERRED_MISS_PENALTY: number;
    GROUP_REQUIRED_MISS_PENALTY: number;
    PERSONAL_EXCLUDED_MISS_PENALTY: number;
    GROUP_EXCLUDED_MISS_PENALTY: number;
    CLASS_ORDER_GROUP_REQUIRED: number;
    CLASS_ORDER_GROUP_PREFERRED: number;
    CLASS_ORDER_GROUP_EXCLUDED: number;
    CLASS_ORDER_PERSONAL_REQUIRED: number;
    CLASS_ORDER_PERSONAL_PREFERRED: number;
    CLASS_ORDER_PERSONAL_EXCLUDED: number;
}
/**
 * Cấu hình
 */
export const CONFIG: CONFIG = {
    /**
     * Kích thước quần thể
     */
    POPULATION_SIZE: 1000,
    /**
     * Số thế hệ
     */
    GENERATIONS: 1000,
    /**
     * Tỷ lệ đột biến
     */
    MUTATION_RATE: 0.1,
    /**
     * Kích thước giải đấu
     */
    TOURNAMENT_SIZE: 5,
};

/**
 * Trọng số
 */
export const WEIGHTS: WEIGHTS = {
    /**
     * Trọng số cơ bản
     */
    BASE: 100000.0,
    /**
     * Trọng số vi phạm cứng
     */
    PENALTY_HARD: 99999.0,         // Trùng lịch 
    /**
     * Trọng số vi phạm ngày nghỉ
     */
    PENALTY_DAY_OFF: 4000.0,       // Vi phạm ngày nghỉ
    /**
     * Trọng số buổi học
     */
    BONUS_SESSION: 500.0,          // Đúng buổi ưu tiên 
    /**
     * Trọng số buổi học sai
     */
    PENALTY_WRONG_SESSION: 100.0,  // Trái buổi 
    /**
     * Trọng số chiến thuật
     */
    BONUS_COMPRESS: 1000.0,        // Thưởng mỗi ngày trống (Compress strategy)
    /**
     * Trọng số chiến thuật sai
     */
    PENALTY_SPREAD: 200.0,        // Phạt ngày học quá nặng (Spread strategy) 
    /**
     * Trọng số trống tiết
     */
    PENALTY_GAP: 50.0,            // Phạt trống tiết
    /**
     * Trọng số vi phạm lựa chọn thủ công
     */
    // Must dominate the maximum possible sum of all normal fitness terms.
    // 1 violation is strictly worse than 0 violations, regardless of normal fitness.
    PENALTY_MANUAL_SELECTION_CHANGED: 10_000_000.0
};

export const GROUP_SCHEDULER_CONFIG: GROUP_SCHEDULER_CONFIG = {
    DEFAULT_MAX_SOLUTIONS: 250,
    SEARCH_NODE_BUDGET: 1000000,
    RELAXED_CLASS_CANDIDATE_LIMIT: 18,
};

export const GROUP_SCHEDULER_WEIGHTS: GROUP_SCHEDULER_WEIGHTS = {
    // Phạt độ lệch điểm giữa các thành viên. Số càng cao thì solver càng ưu tiên cân bằng lịch trong nhóm.
    FAIRNESS: 0.8,

    // Thưởng nhẹ cho mỗi môn chung được xếp cùng lớp, giúp giữ lớp chung khi có thể.
    SHARED_SLOT_BONUS: 12,

    // Thưởng khi lịch chọn đúng lớp ưu tiên/bắt buộc của từng cá nhân.
    PERSONAL_PREFERRED_BONUS: 8,
    PERSONAL_REQUIRED_BONUS: 24,

    // Thưởng khi lịch chọn đúng lớp ưu tiên/bắt buộc của nhóm. Nhóm cao hơn cá nhân.
    GROUP_PREFERRED_BONUS: 18,
    GROUP_REQUIRED_BONUS: 48,

    // Phạt khi KHÔNG chọn được lớp ưu tiên. Ưu tiên cá nhân phạt thấp hơn ưu tiên nhóm.
    PERSONAL_PREFERRED_MISS_PENALTY: 2500,
    GROUP_PREFERRED_MISS_PENALTY: 8500,

    // Phạt rất nặng khi KHÔNG chọn được lớp bắt buộc. Nhóm cao hơn cá nhân.
    PERSONAL_REQUIRED_MISS_PENALTY: 100000,
    GROUP_REQUIRED_MISS_PENALTY: 250000,

    // Phạt rất nặng khi bị xếp vào lớp đã đánh dấu "Cấm". Nhóm cao hơn cá nhân.
    PERSONAL_EXCLUDED_MISS_PENALTY: 100000,
    GROUP_EXCLUDED_MISS_PENALTY: 250000,

    // Điểm dùng để sắp xếp thứ tự thử lớp trước khi search. Không cộng trực tiếp vào điểm kết quả.
    // Số càng cao thì lớp đó càng được thử sớm hơn, giúp solver tìm nghiệm tốt nhanh hơn.
    CLASS_ORDER_GROUP_REQUIRED: 400,
    CLASS_ORDER_GROUP_PREFERRED: 180,
    CLASS_ORDER_GROUP_EXCLUDED: 450,
    CLASS_ORDER_PERSONAL_REQUIRED: 120,
    CLASS_ORDER_PERSONAL_PREFERRED: 60,
    CLASS_ORDER_PERSONAL_EXCLUDED: 140,
};

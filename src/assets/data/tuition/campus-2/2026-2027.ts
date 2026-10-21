/**
 * Bảng đơn giá tín chỉ CHÍNH THỨC năm học 2026-2027.
 * Nguồn: Quyết định 3317/QĐ-KHTN ngày 14/10/2026, Phụ lục I,
 * áp dụng chương trình đại trà khóa tuyển 2022-2026.
 *
 * - shared: Đơn giá chung theo nhóm học phần.
 * - majors: Đơn giá học phần chuyên ngành theo ngành.
 * - Khi đọc: merge shared + majors[majorId].
 * - Anh văn: 488.000 VND/tín chỉ theo mục 3 Phụ lục I.
 */

export const tuition_2026_2027 = {
    default_price: 488000,

    // Đơn giá chung toàn trường
    shared: {
        // LLCT - KT - XH - PL
        BAA: 488000,
        ADD: 488000,
        CSC00003: 488000,
        // GDQPAN - TC
        BAA0002: 488000,
        BAA0003: 488000,

        // Toán - Khoa học tự nhiên - Môi trường
        MTH: 734000,
        PHY: 734000,
        CHE: 734000,
        BIO: 734000,
        GEO: 734000,
        ENV: 734000,
        OMH: 734000,
        MTS: 734000,
        MSC: 734000,
        CSC0: 734000,
    },

    // Đơn giá riêng theo ngành
    majors: {
        'nhom-nganh': { CSC1: 974000 },
        'cong-nghe-thong-tin': { CSC1: 974000 },
        'he-thong-thong-tin': { CSC1: 974000 },
        'ky-thuat-phan-mem': { CSC1: 974000 },
        'khoa-hoc-may-tinh': { CSC1: 974000 },
        'tri-tue-nhan-tao': { CSC1: 1014000 },
        'cu-nhan-tai-nang': { CSC1: 974000 },
        'mang-may-tinh': { CSC1: 974000 },

        'sinh-hoc': { BIO1: 900000, BTE1: 900000 },
        'cong-nghe-sinh-hoc': { BIO1: 940000, BTE1: 940000 },

        'vat-ly-hoc': { PHY1: 734000 },
        'ky-thuat-dien-tu-vien-thong': { ETC1: 1048000 },
        'cong-nghe-vat-ly-dien-tu-va-tin-hoc': { PHY1: 877000, PET1: 877000 },
        'ky-thuat-hat-nhan': { MPH1: 762000, NTE1: 762000, PHY1: 762000 },
        'cong-nghe-ban-dan': { PHY1: 919000, SEM1: 919000 },
        'thiet-ke-vi-mach': { PHY1: 981000, ICD1: 981000, ETC1: 981000 },
        'vat-ly-y-khoa': { PHY1: 913000, MPH1: 913000 },

        'hoa-hoc': { CHE1: 800000 },

        'khoa-hoc-vat-lieu': { MSC1: 989000, MST1: 989000 },
        'cong-nghe-vat-lieu': { MST1: 1001000, MSC1: 1001000 },

        'cong-nghe-ky-thuat-moi-truong': { ENE1: 782000 },
        'quan-ly-tai-nguyen-va-moi-truong': { ENM1: 770000 },
        'khoa-hoc-moi-truong': { ENV1: 750000 },

        'dia-chat-hoc': { GEO1: 756000 },
        'ky-thuat-dia-chat': { GEO1: 737000 },
        'kinh-te-dat-dai': { GEO1: 1002000 },

        'hai-duong-hoc': { OMH1: 734000 },

        'cong-nghe-giao-duc': { EDT1: 760000, EDT2: 760000 },

        'toan-hoc': { MTH1: 1035000 },
        'toan-tin': { MTH1: 1022000 },
        'toan-ung-dung': { MTH1: 968000 },
        'khoa-hoc-du-lieu': { MTH1: 970000 },
        'thong-ke': { MTH1: 1015000 },
    } as Record<string, Record<string, number>>,
};

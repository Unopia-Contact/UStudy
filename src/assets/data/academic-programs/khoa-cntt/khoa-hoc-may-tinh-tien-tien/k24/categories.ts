export const categories = {
    "REQUIRED": {
        "name": "Kiến thức bắt buộc",
        "total_credits_required": 110,
        "breakdown": {
            "COMPUTER_SCIENCE_A": {
                "name": "Computer Science (A)",
                "credits_required": 56,
                "note": "Có thể dùng tín chỉ dư của (A) cho (C).",
                "courses": [
                    "CS160",
                    "CS163",
                    "CS201",
                    "CS202",
                    "CS250",
                    "CS300",
                    "CS323",
                    "CS333",
                    "CS486",
                    "ECE341",
                    "CS251",
                    "CS252",
                    "CS311",
                    "CS320",
                    "CS350",
                    "CS420"
                ]
            },
            "NON_COMPUTER_SCIENCE": {
                "name": "Non Computer Science",
                "credits": 26,
                "note": "Không kể Thể dục và GDQP-AN vào tổng ≥163.",
                "courses": [
                    "CM102",
                    "SC203",
                    "WR227",
                    "BAA00101",
                    "BAA00102",
                    "BAA00103",
                    "BAA00104",
                    "BAA00003",
                    "BAA00004",
                    "BAA00021",
                    "BAA00022",
                    "BAA00030"
                ]
            },
            "MATH": {
                "name": "Math",
                "credits": 16,
                "courses": [
                    "MTH251",
                    "MTH252",
                    "MTH261",
                    "STAT451"
                ]
            },
            "PHYSICS": {
                "name": "Physics",
                "credits": 12,
                "courses": [
                    "PH211",
                    "PH212",
                    "PH213"
                ]
            }
        }
    },
    "ELECTIVE": {
        "name": "Kiến thức tự chọn",
        "total_credits_required": 43,
        "note": "Tổng tín chỉ tự chọn Math (B) + Computer Science (C) tối thiểu 43 TC.",
        "breakdown": {
            "MATH_B": {
                "credits_required": 8,
                "note": "Chọn ít nhất 2 học phần",
                "courses": [
                    "MTH253",
                    "MTH344",
                    "MTH346",
                    "STAT452"
                ]
            },
            "COMPUTER_SCIENCE_C": {
                "credits_required": 35,
                "courses": [
                    "CS404",
                    "CS405",
                    "CS407",
                    "CS408",
                    "CS409",
                    "CS411",
                    "CS412",
                    "CS414",
                    "CS415",
                    "CS416",
                    "CS417",
                    "CS418",
                    "CS419",
                    "CS421",
                    "CS422",
                    "CS423",
                    "CS424",
                    "CS426",
                    "CS427",
                    "CS428",
                    "CS430",
                    "CS431",
                    "CS432",
                    "CS433",
                    "CS434",
                    "CS435",
                    "CS494"
                ]
            }
        }
    },
    "GRADUATION": {
        "name": "Kiến thức tốt nghiệp",
        "total_credits_required": 10,
        "note": "Chọn Khóa luận tốt nghiệp 10 TC hoặc Đồ án tốt nghiệp thực tế gồm CS469 + CS470, mỗi học phần 5 TC.",
        "options": [
            {
                "type": "THESIS",
                "credits": 10,
                "courses": [
                    "CS468"
                ]
            },
            {
                "type": "PRACTICAL_PROJECT",
                "credits": 10,
                "courses": [
                    "CS469",
                    "CS470"
                ]
            }
        ]
    }
}

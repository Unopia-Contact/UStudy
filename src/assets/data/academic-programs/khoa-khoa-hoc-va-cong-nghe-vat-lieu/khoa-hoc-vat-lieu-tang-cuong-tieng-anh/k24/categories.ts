export const categories = {
    "GENERAL_EDUCATION": {
        "name": "Giáo dục đại cương",
        "total_credits_required": 54,
        "note": "Không kể GDQP-AN, GDTC, Tin học cơ sở và ngoại ngữ tổng quát. Theo CTĐT TCTA K2024: 50 TC bắt buộc + 4 TC tự chọn.",
        "breakdown": {
            "GENERAL_POLITICS": {
                "name": "Lý luận chính trị - Pháp luật",
                "credits": 14,
                "mandatory": true,
                "courses": [
                    "BAA00101",
                    "BAA00102",
                    "BAA00103",
                    "BAA00104",
                    "BAA00003",
                    "BAA00004"
                ]
            },
            "GENERAL_SOCIAL": {
                "name": "Khoa học xã hội - Kinh tế - Kỹ năng",
                "credits_required": 2,
                "mandatory": false,
                "note": "Chọn 1 trong 3 học phần",
                "courses": [
                    "BAA00005",
                    "BAA00006",
                    "BAA00007"
                ]
            },
            "GENERAL_MATH_SCIENCE": {
                "name": "Toán - Khoa học tự nhiên - Công nghệ - Môi trường",
                "credits": 38,
                "note": "Trong nhóm GEO00002 / ENV00001 / MST00001 chọn 1 học phần (2 TC).",
                "courses": [
                    "GEO00002",
                    "ENV00001",
                    "MST00001",
                    "MSC00003",
                    "CHE00001",
                    "CHE00002",
                    "MSC00001",
                    "PHY00081",
                    "MSC00002",
                    "MSC00010",
                    "MTH00002",
                    "MTH00003",
                    "MTH00040",
                    "PHY00001",
                    "PHY00002",
                    "PHY00004"
                ]
            },
            "GENERAL_IT": {
                "name": "Tin học",
                "credits": 3,
                "note": "Không tính vào điểm trung bình, tính vào số tín chỉ tích lũy.",
                "courses": [
                    "CSC00003"
                ]
            },
            "GENERAL_PE": {
                "name": "Giáo dục thể chất",
                "credits": 4,
                "note": "Không tính vào điểm trung bình, tính vào số tín chỉ tích lũy.",
                "courses": [
                    "BAA00021",
                    "BAA00022"
                ]
            },
            "GENERAL_DEFENSE": {
                "name": "Giáo dục quốc phòng - An ninh",
                "credits": 4,
                "note": "Không tính vào điểm trung bình, tính vào số tín chỉ tích lũy.",
                "courses": [
                    "BAA00030"
                ]
            }
        }
    },
    "FOUNDATION": {
        "name": "Kiến thức cơ sở ngành",
        "total_credits_required": 54,
        "mandatory": true,
        "courses": [
            "MSC10009",
            "MSC10030",
            "MSC10031",
            "MSC10032",
            "MSC10033",
            "MSC10034",
            "MSC10035",
            "MSC10036",
            "MSC10037",
            "MSC10038",
            "MSC10039",
            "MSC10040",
            "MSC10041",
            "MSC10042",
            "MSC10043",
            "MSC10044",
            "MST10001",
            "MST10002",
            "MST10003",
            "MST10004",
            "MST10011"
        ]
    },
    "MAJOR_MATERIALS_SCIENCE": {
        "name": "Kiến thức chuyên ngành Khoa học vật liệu",
        "total_credits_required": 23,
        "breakdown": {
            "mandatory": {
                "courses": [
                    "MSC10500",
                    "MSC10501",
                    "MSC10502",
                    "MSC10503",
                    "MSC10504",
                    "MSC10505"
                ],
                "total_credits_required": 13
            },
            "elective_a": {
                "note": "Chọn 1 trong 3 học phần",
                "courses": [
                    "MSC10551",
                    "MSC10552",
                    "MSC10553"
                ],
                "total_credits_required": 2
            },
            "elective_b": {
                "note": "Chọn 1 trong 4 học phần",
                "courses": [
                    "MSC10554",
                    "MSC10555",
                    "MSC10318",
                    "MSC10556"
                ],
                "total_credits_required": 2
            },
            "elective_c": {
                "note": "Chọn 1 trong 4 học phần",
                "courses": [
                    "MSC10557",
                    "MSC10558",
                    "MSC10111",
                    "MSC10209"
                ],
                "total_credits_required": 2
            },
            "elective_d": {
                "note": "Chọn 1 trong 4 học phần",
                "courses": [
                    "MSC10559",
                    "MSC10560",
                    "MSC10561",
                    "MSC10562"
                ],
                "total_credits_required": 2
            },
            "elective_e": {
                "note": "Chọn 1 trong 3 học phần",
                "courses": [
                    "MSC10563",
                    "MSC10564",
                    "MSC10565"
                ],
                "total_credits_required": 2
            }
        }
    },
    "GRADUATION": {
        "name": "Kiến thức tốt nghiệp",
        "total_credits_required": 10,
        "note": "Khóa luận tốt nghiệp 10 TC.",
        "courses": [
            "MSC10595"
        ]
    }
}

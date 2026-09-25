export const categories = {
    "GENERAL_EDUCATION": {
        "name": "Giáo dục đại cương",
        "total_credits_required": 47,
        "note": "Không kể GDQP-AN, GDTC và Tin học cơ sở. CTĐT TCTA K2024: 34 TC bắt buộc + 13 TC tự chọn.",
        "breakdown": {
            "GENERAL_POLITICS": {
                "name": "Lý luận chính trị - Pháp luật",
                "total_credits_required": 14,
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
                "total_credits_required": 4,
                "mandatory": false,
                "note": "Chọn 2 học phần (4 TC) trong nhóm TC1.",
                "courses": [
                    "BAA00005",
                    "BAA00007",
                    "BAA00006",
                    "BTE10001",
                    "BAA00009",
                    "BIO10024"
                ]
            },
            "GENERAL_MATH_SCIENCE": {
                "name": "Toán - Khoa học tự nhiên - Công nghệ - Môi trường",
                "total_credits_required": 29,
                "breakdown": {
                    "tc2": {
                        "total_credits_required": 3,
                        "note": "Chọn 1 môn trong TC2.",
                        "courses": [
                            "MTH00001",
                            "MTH00002"
                        ]
                    },
                    "tc3": {
                        "total_credits_required": 3,
                        "note": "Chọn 1 môn trong TC3.",
                        "courses": [
                            "PHY00001",
                            "PHY00002"
                        ]
                    },
                    "tc4": {
                        "total_credits_required": 3,
                        "note": "Chọn 1 môn trong TC4.",
                        "courses": [
                            "CHE00002",
                            "CHE00003"
                        ]
                    },
                    "mandatory": {
                        "courses": [
                            "MTH00040",
                            "CHE00001",
                            "CHE00082",
                            "BIO00001",
                            "BIO00081",
                            "BIO00002",
                            "BIO00082",
                            "BIO00011",
                            "ENV00003"
                        ]
                    }
                }
            },
            "GENERAL_IT": {
                "name": "Tin học",
                "total_credits_required": 3,
                "mandatory": true,
                "courses": [
                    "CSC00003"
                ]
            },
            "GENERAL_PE": {
                "name": "Giáo dục thể chất",
                "total_credits_required": 4,
                "mandatory": true,
                "courses": [
                    "BAA00021",
                    "BAA00022"
                ]
            },
            "GENERAL_DEFENSE": {
                "name": "Giáo dục quốc phòng - An ninh",
                "total_credits_required": 4,
                "mandatory": true,
                "courses": [
                    "BAA00030"
                ]
            }
        }
    },
    "FOUNDATION": {
        "name": "Kiến thức cơ sở ngành",
        "total_credits_required": 56,
        "breakdown": {
            "mandatory": {
                "total_credits_required": 42,
                "courses": [
                    "BTE10030",
                    "BTE10031",
                    "BTE10032",
                    "BTE10033",
                    "BTE10009",
                    "BTE10008",
                    "BIO10012",
                    "BIO10022",
                    "BTE10002",
                    "BIO10010",
                    "BTE10017",
                    "BIO10002",
                    "BTE10005",
                    "BTE10011",
                    "BTE10014",
                    "BTE10019",
                    "BTE10035"
                ]
            },
            "elective": {
                "total_credits_required": 14,
                "note": "TC5 + TC6 tối thiểu 14 TC; riêng TC5 tối thiểu 7 TC.",
                "breakdown": {
                    "tc5": {
                        "total_credits_required": 7,
                        "note": "Tích lũy ít nhất 7 TC.",
                        "courses": [
                            "BTE10004",
                            "BTE10010",
                            "BTE10044",
                            "BTE10036",
                            "BTE10041",
                            "BTE10013",
                            "BIO10335",
                            "BIO10302",
                            "BTE10310",
                            "BTE10043"
                        ]
                    },
                    "tc6": {
                        "note": "TC5 + TC6 phải đạt ít nhất 14 TC.",
                        "courses": [
                            "BTE10037",
                            "BTE10021",
                            "BTE10023",
                            "BTE10038",
                            "BTE10025",
                            "BIO00004",
                            "BTE10028",
                            "BTE10045"
                        ]
                    }
                }
            }
        }
    },
    "MAJOR_BIOTECHNOLOGY": {
        "name": "Kiến thức chuyên ngành Công nghệ sinh học — chương trình Tăng cường tiếng Anh",
        "total_credits_required": 25,
        "breakdown": {
            "mandatory_practicum": {
                "total_credits_required": 6,
                "note": "Chọn ít nhất 2 học phần thực tập chuyên ngành, mỗi học phần 3 TC.",
                "courses": [
                    "BTE10516",
                    "BTE10517",
                    "BTE10518",
                    "BTE10519"
                ]
            },
            "elective": {
                "total_credits_required": 19,
                "note": "Tích lũy ít nhất 19 TC từ TC7 và TC8; trong đó TC7 ít nhất 12 TC.",
                "breakdown": {
                    "tc7": {
                        "total_credits_required": 12,
                        "note": "Tích lũy ít nhất 12 TC.",
                        "courses": [
                            "BTE10204",
                            "BTE10501",
                            "BIO10207",
                            "BTE10211",
                            "BTE10502",
                            "BTE10503",
                            "BTE10504",
                            "BTE10109",
                            "BTE10102",
                            "BTE10308",
                            "BIO10608",
                            "BIO10208",
                            "BTE10307",
                            "BTE10309",
                            "BIO10203",
                            "BTE10406",
                            "BTE10505",
                            "BTE10506",
                            "BTE10515",
                            "BTE10312",
                            "BTE10213",
                            "BTE10214"
                        ]
                    },
                    "tc8": {
                        "note": "TC7 + TC8 phải đạt ít nhất 19 TC.",
                        "courses": [
                            "BIO10411",
                            "BTE10209",
                            "BTE10203",
                            "BTE10104",
                            "BTE10507",
                            "BTE10105",
                            "BIO10407",
                            "BTE10311",
                            "BTE10508",
                            "BTE10509",
                            "BTE10510",
                            "BTE10511",
                            "BTE10512",
                            "BIO10214",
                            "BIO10110",
                            "BIO10107",
                            "BIO10104",
                            "BTE10210"
                        ]
                    }
                }
            }
        }
    },
    "GRADUATION": {
        "name": "Kiến thức tốt nghiệp",
        "total_credits_required": 10,
        "note": "Chọn 1 trong 2 phương án: khóa luận 10 TC; hoặc thực tập 6 TC + 4 TC học phần lý thuyết dạy bằng tiếng Anh thuộc TC7 chưa dùng để đủ phần TC7.",
        "breakdown": {
            "thesis_option": {
                "total_credits_required": 10,
                "elective": true,
                "courses": [
                    "BTE10520",
                    "BTE10521",
                    "BTE10522",
                    "BTE10523"
                ]
            },
            "internship_option": {
                "total_credits_required": 10,
                "breakdown": {
                    "internship": {
                        "total_credits_required": 6,
                        "courses": [
                            "BTE10524",
                            "BTE10525",
                            "BTE10526",
                            "BTE10527"
                        ]
                    },
                    "elective": {
                        "total_credits_required": 4,
                        "note": "Chọn 4 TC lý thuyết dạy bằng tiếng Anh thuộc TC7, không kể phần đã dùng để đủ 12 TC TC7.",
                        "courses": [
                            "BTE10204",
                            "BIO10207",
                            "BTE10211",
                            "BTE10502",
                            "BTE10503",
                            "BTE10109",
                            "BTE10102",
                            "BTE10308",
                            "BIO10608",
                            "BIO10208",
                            "BTE10307",
                            "BTE10309",
                            "BIO10203",
                            "BTE10406",
                            "BTE10505",
                            "BTE10506",
                            "BTE10515",
                            "BTE10312",
                            "BTE10213",
                            "BTE10214"
                        ]
                    }
                }
            }
        }
    }
}

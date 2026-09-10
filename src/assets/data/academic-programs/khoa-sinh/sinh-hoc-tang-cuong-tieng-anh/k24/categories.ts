export const categories = {
    "GENERAL_EDUCATION": {
        "name": "Giáo dục đại cương",
        "total_credits_required": 47,
        "note": "Không kể GDQP-AN, GDTC và Tin học cơ sở. CTĐT TCTA K2024: 37 TC bắt buộc + 10 TC tự chọn.",
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
                "note": "Chọn 2 môn (4 tín chỉ) trong nhóm TC1.",
                "courses": [
                    "BAA00007",
                    "BAA00006",
                    "BTE10001",
                    "BIO10024"
                ]
            },
            "GENERAL_MATH_SCIENCE": {
                "name": "Toán - Khoa học tự nhiên - Công nghệ - Môi trường",
                "total_credits_required": 29,
                "breakdown": {
                    "tc2": {
                        "total_credits_required": 3,
                        "note": "Chọn 3 tín chỉ trong TC2.",
                        "courses": [
                            "MTH00001",
                            "MTH00002"
                        ]
                    },
                    "mandatory": {
                        "note": "Các học phần bắt buộc của nhóm 7.1.3.",
                        "courses": [
                            "MTH00040",
                            "PHY00001",
                            "CHE00001",
                            "CHE00082",
                            "BIO00001",
                            "BIO00081",
                            "BIO00002",
                            "BIO00082",
                            "BIO00010",
                            "ENV00003"
                        ]
                    },
                    "tc3": {
                        "total_credits_required": 3,
                        "note": "Chọn 3 tín chỉ trong TC3.",
                        "courses": [
                            "CHE00002",
                            "CHE00003"
                        ]
                    }
                }
            },
            "GENERAL_IT": {
                "name": "Tin học",
                "total_credits_required": 3,
                "mandatory": true,
                "note": "Không tính vào điểm trung bình, tính vào số tín chỉ tích lũy.",
                "courses": [
                    "CSC00003"
                ]
            },
            "GENERAL_PE": {
                "name": "Giáo dục thể chất",
                "total_credits_required": 4,
                "mandatory": true,
                "note": "Không tính vào điểm trung bình, tính vào số tín chỉ tích lũy.",
                "courses": [
                    "BAA00021",
                    "BAA00022"
                ]
            },
            "GENERAL_DEFENSE": {
                "name": "Giáo dục quốc phòng - An ninh",
                "total_credits_required": 4,
                "mandatory": true,
                "note": "Không tính vào điểm trung bình, tính vào số tín chỉ tích lũy.",
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
                    "BIO10030",
                    "BIO10031",
                    "BIO10032",
                    "BIO10033",
                    "BIO10007",
                    "BIO10017",
                    "BIO10012",
                    "BIO10022",
                    "BTE10002",
                    "BTE10035",
                    "BIO10302",
                    "BAA00010",
                    "BIO10002",
                    "BTE10005",
                    "BTE10011",
                    "BTE10014",
                    "BTE10019"
                ]
            },
            "elective": {
                "total_credits_required": 14,
                "note": "Tích lũy ít nhất 14 TC từ TC4 và TC5; riêng TC4 ít nhất 4 TC.",
                "breakdown": {
                    "tc4": {
                        "total_credits_required": 4,
                        "note": "Chọn ít nhất 4 tín chỉ.",
                        "courses": [
                            "BIO00003",
                            "BIO00004",
                            "BIO00005",
                            "BAA00009"
                        ]
                    },
                    "tc5": {
                        "note": "TC4 + TC5 phải đạt ít nhất 14 tín chỉ.",
                        "courses": [
                            "BIO10023",
                            "BIO10335",
                            "BTE10037",
                            "BIO10010",
                            "BTE10017",
                            "BIO10006",
                            "BIO10016",
                            "BTE10004",
                            "BTE10010",
                            "BIO10004",
                            "BIO10014",
                            "BIO10005",
                            "BIO10015",
                            "BTE10311"
                        ]
                    }
                }
            }
        }
    },
    "MAJOR_BIOLOGY": {
        "name": "Kiến thức chuyên ngành Sinh học — chương trình Tăng cường tiếng Anh",
        "total_credits_required": 18,
        "breakdown": {
            "directional_elective": {
                "total_credits_required": 10,
                "breakdown": {
                    "tc6": {
                        "total_credits_required": 6,
                        "note": "Chọn 6 tín chỉ trong nhóm TC6.",
                        "courses": [
                            "BIO10709",
                            "BIO10710",
                            "BIO10711",
                            "BIO10712",
                            "BIO10713",
                            "BIO10714"
                        ]
                    },
                    "tc7": {
                        "total_credits_required": 4,
                        "note": "Chọn 4 tín chỉ trong nhóm TC7.",
                        "courses": [
                            "BIO10703",
                            "BIO10704",
                            "BIO10705",
                            "BIO10706",
                            "BIO10707",
                            "BIO10708"
                        ]
                    }
                }
            },
            "free_elective": {
                "total_credits_required": 8,
                "note": "Tích lũy ít nhất 8 tín chỉ từ TC8 và TC9.",
                "breakdown": {
                    "tc8": {
                        "courses": [
                            "BIO10701",
                            "BTE10515",
                            "BIO10215",
                            "BIO10608",
                            "BIO10208",
                            "BIO10203"
                        ]
                    },
                    "tc9": {
                        "courses": [
                            "BIO10702",
                            "BTE10511",
                            "BIO10214",
                            "BIO10110",
                            "BIO10107",
                            "BIO10104",
                            "BIO10206",
                            "BIO10106",
                            "BIO10412",
                            "BIO10402",
                            "BIO10407",
                            "BIO10409",
                            "BIO10305",
                            "BIO10406",
                            "BIO10411"
                        ]
                    }
                }
            }
        }
    },
    "GRADUATION": {
        "name": "Kiến thức tốt nghiệp",
        "total_credits_required": 15,
        "note": "Chọn 1 trong 2 phương án của mục 7.2.3.",
        "breakdown": {
            "thesis_option": {
                "total_credits_required": 15,
                "breakdown": {
                    "mandatory": {
                        "total_credits_required": 5,
                        "courses": [
                            "BIO10796"
                        ]
                    },
                    "elective": {
                        "total_credits_required": 10,
                        "note": "Chọn 1 khóa luận 10 TC trong TC10.",
                        "courses": [
                            "BIO10791",
                            "BIO10792",
                            "BIO10793",
                            "BIO10797",
                            "BIO10798",
                            "BIO10799"
                        ]
                    }
                }
            },
            "internship_option": {
                "total_credits_required": 15,
                "breakdown": {
                    "mandatory": {
                        "total_credits_required": 5,
                        "courses": [
                            "BIO10796"
                        ]
                    },
                    "internship": {
                        "total_credits_required": 6,
                        "note": "Chọn 1 thực tập tốt nghiệp 6 TC trong TC11.",
                        "courses": [
                            "BIO10800",
                            "BIO10801",
                            "BIO10802",
                            "BIO10803",
                            "BIO10804",
                            "BIO10805"
                        ]
                    },
                    "elective": {
                        "total_credits_required": 4,
                        "note": "Chọn 4 TC học phần lý thuyết dạy bằng tiếng Anh trong TC8, không kể các tín chỉ đã tích lũy tại 7.2.2.b.",
                        "courses": [
                            "BIO10701",
                            "BTE10515",
                            "BIO10215",
                            "BIO10608",
                            "BIO10208",
                            "BIO10203"
                        ]
                    }
                }
            }
        }
    }
}

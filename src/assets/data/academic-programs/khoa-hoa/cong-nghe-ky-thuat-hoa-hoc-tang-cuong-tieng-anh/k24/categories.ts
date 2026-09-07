export const categories = {
    "GENERAL_EDUCATION": {
        "name": "Giáo dục đại cương",
        "total_credits_required": 50,
        "note": "Không kể GDQP-AN, GDTC và Tin học cơ sở. 46 TC bắt buộc + 4 TC tự chọn.",
        "breakdown": {
            "GENERAL_POLITICS": {
                "name": "Lý luận chính trị - Pháp luật",
                "credits": 14,
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
                "note": "Chọn 1 trong 5 học phần",
                "courses": [
                    "BAA00005",
                    "BAA00006",
                    "BAA00007",
                    "BAA00015",
                    "BAA00016"
                ]
            },
            "GENERAL_MATH_SCIENCE": {
                "name": "Toán - Khoa học tự nhiên - Công nghệ - Môi trường",
                "credits": 34,
                "note": "Chọn 1 trong CHE00011 và CHE00012 (2 TC).",
                "courses": [
                    "MTH00001",
                    "MTH00002",
                    "MTH00040",
                    "CHE00001",
                    "CHE00002",
                    "CHE00081",
                    "PHY00001",
                    "PHY00002",
                    "PHY00081",
                    "CHT00005",
                    "BIO00001",
                    "ENV00001",
                    "CHE00011",
                    "CHE00012"
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
                "courses": [
                    "BAA00021",
                    "BAA00022"
                ]
            },
            "GENERAL_DEFENSE": {
                "name": "Giáo dục quốc phòng - An ninh",
                "credits": 4,
                "courses": [
                    "BAA00030"
                ]
            }
        }
    },
    "FOUNDATION": {
        "name": "Kiến thức cơ sở ngành",
        "total_credits_required": 38,
        "note": "38 TC cơ sở ngành; 8 TC Anh văn chuyên ngành được tách riêng và không tính trong 131 TC của cấu trúc chương trình.",
        "breakdown": {
            "SPECIALIZED_ENGLISH": {
                "credits_required": 0,
                "note": "4 học phần Anh văn chuyên ngành, tổng 8 TC; không tính trong 38 TC cơ sở ngành.",
                "courses": [
                    "CHT00001",
                    "CHT00002",
                    "CHT00003",
                    "CHT00004"
                ]
            },
            "CORE": {
                "credits": 38,
                "courses": [
                    "CHT10001",
                    "CHT10002",
                    "CHT10003",
                    "CHT10004",
                    "CHT10005",
                    "CHT10006",
                    "CHT10007",
                    "CHT10008",
                    "CHT10009",
                    "CHT10010",
                    "CHT10011",
                    "CHT10012",
                    "CHT10013",
                    "CHT10014",
                    "CHT10015"
                ]
            }
        }
    },
    "MAJOR_CHEMICAL_TECHNOLOGY": {
        "name": "Kiến thức chuyên ngành Công nghệ kỹ thuật hóa học",
        "total_credits_required": 33,
        "note": "Sinh viên chọn một trong 3 chuyên ngành. Học phần tự chọn có thể lấy từ Phụ lục 1 hoặc học phần bắt buộc của chuyên ngành khác.",
        "breakdown": {
            "ORGANIC_PHARMA": {
                "name": "Công nghệ Hóa hữu cơ và Hóa dược",
                "total_credits_required": 33,
                "breakdown": {
                    "mandatory": {
                        "courses": [
                            "CHT10016",
                            "CHT10017",
                            "CHT10018",
                            "CHT10101",
                            "CHT10102",
                            "CHT10103",
                            "CHT10107",
                            "CHT10109",
                            "CHT10108"
                        ],
                        "total_credits_required": 22
                    },
                    "elective": {
                        "courses": [
                            "CHT10203",
                            "CHT10030",
                            "CHT10031",
                            "CHT10032",
                            "CHT10033",
                            "CHT10034",
                            "CHT10035",
                            "CHT10036",
                            "CHT10037",
                            "CHT10038",
                            "CHT10039",
                            "CHT10040",
                            "CHT10041",
                            "CHT10042",
                            "CHT10043",
                            "CHE10227",
                            "CHT10044",
                            "CHT10045",
                            "CHT10046",
                            "CHT10047",
                            "CHT10050",
                            "CHT10051",
                            "CHT10052"
                        ],
                        "total_credits_required": 11
                    }
                }
            },
            "POLYMER": {
                "name": "Công nghệ Polyme",
                "total_credits_required": 33,
                "breakdown": {
                    "mandatory": {
                        "courses": [
                            "CHT10016",
                            "CHT10017",
                            "CHT10018",
                            "CHT10101",
                            "CHT10107",
                            "CHT10201",
                            "CHT10202",
                            "CHT10204",
                            "CHT10205"
                        ],
                        "total_credits_required": 22
                    },
                    "elective": {
                        "courses": [
                            "CHT10203",
                            "CHT10030",
                            "CHT10031",
                            "CHT10032",
                            "CHT10033",
                            "CHT10034",
                            "CHT10035",
                            "CHT10036",
                            "CHT10037",
                            "CHT10038",
                            "CHT10039",
                            "CHT10040",
                            "CHT10041",
                            "CHT10042",
                            "CHT10043",
                            "CHE10227",
                            "CHT10044",
                            "CHT10045",
                            "CHT10046",
                            "CHT10047",
                            "CHT10050",
                            "CHT10051",
                            "CHT10052"
                        ],
                        "total_credits_required": 11
                    }
                }
            },
            "INORGANIC_ENERGY": {
                "name": "Công nghệ Hóa vô cơ và Vật liệu chuyển hóa năng lượng",
                "total_credits_required": 33,
                "breakdown": {
                    "mandatory": {
                        "courses": [
                            "CHT10016",
                            "CHT10017",
                            "CHT10018",
                            "CHT10108",
                            "CHT10205",
                            "CHT10301",
                            "CHT10302",
                            "CHT10303",
                            "CHT10304"
                        ],
                        "total_credits_required": 23
                    },
                    "elective": {
                        "courses": [
                            "CHT10203",
                            "CHT10030",
                            "CHT10031",
                            "CHT10032",
                            "CHT10033",
                            "CHT10034",
                            "CHT10035",
                            "CHT10036",
                            "CHT10037",
                            "CHT10038",
                            "CHT10039",
                            "CHT10040",
                            "CHT10041",
                            "CHT10042",
                            "CHT10043",
                            "CHE10227",
                            "CHT10044",
                            "CHT10045",
                            "CHT10046",
                            "CHT10047",
                            "CHT10050",
                            "CHT10051",
                            "CHT10052"
                        ],
                        "total_credits_required": 10
                    }
                }
            }
        }
    },
    "GRADUATION": {
        "name": "Kiến thức tốt nghiệp",
        "total_credits_required": 10,
        "note": "Chọn 1 trong 3 phương án: Khóa luận 10 TC; Tiểu luận tốt nghiệp 6 TC + 4 TC tự chọn; hoặc Tiểu luận tốt nghiệp lý thuyết 4 TC + 6 TC tự chọn.",
        "options": [
            {
                "type": "THESIS",
                "credits": 10,
                "courses": [
                    "CHT10195"
                ]
            },
            {
                "type": "PROJECT_6_AND_ELECTIVE_4",
                "credits": 10,
                "courses": [
                    "CHT10190"
                ]
            },
            {
                "type": "THEORETICAL_4_AND_ELECTIVE_6",
                "credits": 10,
                "courses": [
                    "CHT10191"
                ]
            }
        ]
    }
}

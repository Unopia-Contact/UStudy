export const categories = {
    "GENERAL_EDUCATION": {
        "name": "Giáo dục đại cương",
        "total_credits_required": 56,
        "note": "Không kể Giáo dục thể chất và Giáo dục quốc phòng - An ninh.",
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
                "note": "Chọn 1 học phần",
                "courses": [
                    "BAA00005",
                    "BAA00006",
                    "BAA00007"
                ]
            },
            "GENERAL_MATH_SCIENCE": {
                "name": "Toán - Khoa học tự nhiên - Công nghệ - Môi trường",
                "credits_required": 36,
                "note": "Có 24 TC Toán bắt buộc, chọn thêm 4 TC Toán; chọn 8 TC trong nhóm KHTN/Môi trường.",
                "courses": [
                    "MTH00005",
                    "MTH00006",
                    "MTH00007",
                    "MTH00008",
                    "MTH00009",
                    "MTH00058",
                    "MTH00057",
                    "MTH00059",
                    "MTH00060",
                    "CHE00001",
                    "CHE00002",
                    "CHE00081",
                    "CHE00082",
                    "BIO00001",
                    "BIO00002",
                    "BIO00081",
                    "BIO00082",
                    "PHY00005",
                    "PHY00007",
                    "GEO00002",
                    "ENV00001",
                    "ENV00003"
                ]
            },
            "GENERAL_IT": {
                "name": "Tin học",
                "credits": 4,
                "mandatory": true,
                "courses": [
                    "CSC00004"
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
        "mandatory": true,
        "courses": [
            "CSC10012",
            "CSC10003",
            "CSC10004",
            "CSC10014",
            "CSC10006",
            "CSC10007",
            "CSC10008",
            "CSC10009",
            "CSC13002",
            "CSC14003"
        ]
    },
    "MAJOR_INFORMATION_TECHNOLOGY": {
        "name": "Kiến thức chuyên ngành Công nghệ thông tin",
        "total_credits_required": 34,
        "note": "Sinh viên chọn 1 trong 9 chuyên ngành. Mỗi chuyên ngành tích lũy tối thiểu 16 TC nhóm bắt buộc, 8 TC nhóm tự chọn chuyên ngành và phần còn lại là tự chọn tự do để đủ 34 TC.",
        "breakdown": {
            "NETWORK": {
                "name": "Mạng máy tính và Viễn thông",
                "breakdown": {
                    "mandatory": {
                        "courses": [
                            "CSC11002",
                            "CSC11003",
                            "CSC11004",
                            "CSC11006",
                            "CSC11007",
                            "CSC11115",
                            "CSC15001",
                            "CSC15005"
                        ],
                        "total_credits_required": 16
                    },
                    "elective": {
                        "courses": [
                            "CSC10107",
                            "CSC11106",
                            "CSC11116",
                            "CSC11117",
                            "CSC11118",
                            "CSC11120",
                            "CSC14005",
                            "CSC15002",
                            "CSC15003"
                        ],
                        "total_credits_required": 8
                    }
                },
                "total_credits_required": 34
            },
            "INFORMATION_SYSTEMS": {
                "name": "Hệ thống thông tin",
                "breakdown": {
                    "mandatory": {
                        "courses": [
                            "CSC12001",
                            "CSC12002",
                            "CSC12003",
                            "CSC12004",
                            "CSC12005"
                        ],
                        "total_credits_required": 16
                    },
                    "elective": {
                        "courses": [
                            "CSC10121",
                            "CSC10102",
                            "CSC10103",
                            "CSC10104",
                            "CSC10105",
                            "CSC10106",
                            "CSC10107",
                            "CSC10108",
                            "CSC12102",
                            "CSC12103",
                            "CSC12105",
                            "CSC12106",
                            "CSC12109",
                            "CSC12110",
                            "CSC17101",
                            "CSC17106"
                        ],
                        "total_credits_required": 8
                    }
                },
                "total_credits_required": 34
            },
            "SOFTWARE_ENGINEERING": {
                "name": "Kỹ thuật phần mềm",
                "breakdown": {
                    "mandatory": {
                        "courses": [
                            "CSC13003",
                            "CSC13005",
                            "CSC13006",
                            "CSC13007",
                            "CSC13008",
                            "CSC13009",
                            "CSC13010",
                            "CSC13106",
                            "CSC13112"
                        ],
                        "total_credits_required": 16
                    },
                    "elective": {
                        "courses": [
                            "CSC10121",
                            "CSC10102",
                            "CSC10103",
                            "CSC10105",
                            "CSC10107",
                            "CSC13001",
                            "CSC13101",
                            "CSC13102",
                            "CSC13103",
                            "CSC13107",
                            "CSC13117",
                            "CSC11007",
                            "CSC14005",
                            "CSC16106"
                        ],
                        "total_credits_required": 8
                    }
                },
                "total_credits_required": 34
            },
            "COMPUTER_SCIENCE": {
                "name": "Khoa học máy tính",
                "breakdown": {
                    "mandatory": {
                        "courses": [
                            "CSC14001",
                            "CSC14002",
                            "CSC14004",
                            "CSC14005",
                            "CSC14006",
                            "CSC14101",
                            "CSC14111",
                            "CSC14118",
                            "CSC14120",
                            "CSC15006",
                            "CSC16004",
                            "CSC18101",
                            "CSC18102",
                            "CSC18103",
                            "CSC18104"
                        ],
                        "total_credits_required": 16
                    },
                    "elective": {
                        "courses": [
                            "CSC10102",
                            "CSC10103",
                            "CSC10104",
                            "CSC10108",
                            "CSC14008",
                            "CSC14105",
                            "CSC14112",
                            "CSC14113",
                            "CSC14117",
                            "CSC14119",
                            "CSC16005",
                            "CSC17001",
                            "CSC17103",
                            "CSC18001"
                        ],
                        "total_credits_required": 8
                    }
                },
                "total_credits_required": 34
            },
            "KNOWLEDGE_TECHNOLOGY": {
                "name": "Công nghệ tri thức",
                "breakdown": {
                    "mandatory": {
                        "courses": [
                            "CSC14007",
                            "CSC15001",
                            "CSC15002",
                            "CSC15003",
                            "CSC15004",
                            "CSC15005",
                            "CSC15006",
                            "CSC15007",
                            "CSC15009",
                            "CSC15011",
                            "CSC15012",
                            "CSC15109"
                        ],
                        "total_credits_required": 16
                    },
                    "elective": {
                        "courses": [
                            "CSC10121",
                            "CSC10102",
                            "CSC10103",
                            "CSC10104",
                            "CSC10105",
                            "CSC10106",
                            "CSC10107",
                            "CSC14101",
                            "CSC14120",
                            "CSC15010",
                            "CSC15102",
                            "CSC15107",
                            "CSC15108",
                            "CSC16106"
                        ],
                        "total_credits_required": 8
                    }
                },
                "total_credits_required": 34
            },
            "COMPUTER_VISION": {
                "name": "Thị giác máy tính",
                "breakdown": {
                    "mandatory": {
                        "courses": [
                            "CSC16001",
                            "CSC16002",
                            "CSC16003",
                            "CSC16004",
                            "CSC16005"
                        ],
                        "total_credits_required": 16
                    },
                    "elective": {
                        "courses": [
                            "CSC16101",
                            "CSC16102",
                            "CSC16105",
                            "CSC16106",
                            "CSC16107",
                            "CSC16109",
                            "CSC16113",
                            "CSC16114"
                        ],
                        "total_credits_required": 8
                    }
                },
                "total_credits_required": 34
            },
            "INFORMATION_SECURITY": {
                "name": "An toàn thông tin",
                "breakdown": {
                    "mandatory": {
                        "courses": [
                            "CSC15001",
                            "CSC15002",
                            "CSC15003",
                            "CSC15005",
                            "CSC15010",
                            "CSC15109"
                        ],
                        "total_credits_required": 16
                    },
                    "elective": {
                        "courses": [
                            "CSC10104",
                            "CSC10107",
                            "CSC11004",
                            "CSC11120",
                            "CSC12001",
                            "CSC14005",
                            "CSC14007",
                            "CSC14117",
                            "CSC14120",
                            "CSC15004",
                            "CSC15107",
                            "CSC16106"
                        ],
                        "total_credits_required": 8
                    }
                },
                "total_credits_required": 34
            },
            "DATA_SCIENCE": {
                "name": "Khoa học dữ liệu",
                "breakdown": {
                    "mandatory": {
                        "courses": [
                            "CSC10108",
                            "CSC14004",
                            "CSC14005",
                            "CSC14119",
                            "CSC17001",
                            "CSC17104"
                        ],
                        "total_credits_required": 16
                    },
                    "elective": {
                        "courses": [
                            "CSC14117",
                            "CSC14118",
                            "CSC14120",
                            "CSC15004",
                            "CSC15007",
                            "CSC15102",
                            "CSC17102",
                            "CSC17103",
                            "CSC17106",
                            "CSC18001"
                        ],
                        "total_credits_required": 8
                    }
                },
                "total_credits_required": 34
            },
            "INFORMATION_TECHNOLOGY": {
                "name": "Công nghệ thông tin",
                "breakdown": {
                    "mandatory": {
                        "courses": [
                            "CSC11004",
                            "CSC15001",
                            "CSC12002",
                            "CSC12004",
                            "CSC13003",
                            "CSC13106",
                            "CSC14004",
                            "CSC14005",
                            "CSC14119",
                            "CSC15004",
                            "CSC15007",
                            "CSC15006",
                            "CSC15011",
                            "CSC15003",
                            "CSC15005",
                            "CSC16004",
                            "CSC16005"
                        ],
                        "total_credits_required": 16
                    },
                    "elective": {
                        "courses": [
                            "CSC11003",
                            "CSC11106",
                            "CSC11006",
                            "CSC11117",
                            "CSC10108",
                            "CSC12105",
                            "CSC12109",
                            "CSC12110",
                            "CSC13006",
                            "CSC13008",
                            "CSC13010",
                            "CSC13112",
                            "CSC14101",
                            "CSC14111",
                            "CSC14120",
                            "CSC14117",
                            "CSC14118",
                            "CSC17001",
                            "CSC17104",
                            "CSC15107",
                            "CSC15012",
                            "CSC15002",
                            "CSC15010",
                            "CSC12001",
                            "CSC16003",
                            "CSC16106",
                            "CSC16107",
                            "CSC16109"
                        ],
                        "total_credits_required": 8
                    },
                    "free_elective_named": {
                        "courses": [
                            "CSC11114",
                            "CSC12112",
                            "CSC12113",
                            "CSC13119",
                            "CSC13120",
                            "CSC13121",
                            "CSC13122",
                            "CSC00008"
                        ]
                    }
                },
                "total_credits_required": 34
            }
        }
    },
    "GRADUATION": {
        "name": "Kiến thức tốt nghiệp",
        "total_credits_required": 10,
        "note": "Tùy chuyên ngành: Khóa luận 10 TC; Thực tập tốt nghiệp 10 TC; hoặc đồ án/thực tập dự án 6 TC kết hợp học phần tốt nghiệp chuyên ngành để đủ tối thiểu 10 TC.",
        "courses": [
            "CSC10251",
            "CSC10252",
            "CSC10204",
            "CSC11111",
            "CSC11112",
            "CSC11119",
            "CSC15010",
            "CSC12107",
            "CSC12108",
            "CSC12111",
            "CSC13114",
            "CSC13115",
            "CSC13116",
            "CSC13118",
            "CSC14114",
            "CSC14115",
            "CSC14116",
            "CSC18105",
            "CSC16107",
            "CSC15201",
            "CSC15202",
            "CSC15104",
            "CSC15105",
            "CSC15106",
            "CSC16110",
            "CSC16111",
            "CSC16112",
            "CSC17107",
            "CSC10202",
            "CSC10203",
            "CSC13123"
        ]
    }
}

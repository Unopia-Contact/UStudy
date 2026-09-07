export const categories = {
    "GENERAL_EDUCATION": {
        "name": "Giáo dục đại cương",
        "total_credits_required": 50,
        "note": "Không kể GDQP-AN, GDTC và Tin học cơ sở.",
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
                "courses": [
                    "BIO00001",
                    "CHE00001",
                    "CHE00002",
                    "CHE00010",
                    "CHE00081",
                    "ENV00001",
                    "MTH00001",
                    "MTH00002",
                    "MTH00040",
                    "PHY00001",
                    "PHY00002",
                    "PHY00081",
                    "BIO00081",
                    "BIO00002",
                    "BIO00082",
                    "CHE00011",
                    "CHE00012"
                ]
            },
            "GENERAL_IT": {
                "name": "Tin học",
                "credits": 3,
                "note": "Không tính vào điểm trung bình, tính vào số tín chỉ tích lũy; ngoại trừ nhóm ngành Công nghệ thông tin.",
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
        "total_credits_required": 51,
        "note": "51 TC cơ sở ngành, không kể 8 TC Anh văn chuyên ngành.",
        "breakdown": {
            "SPECIALIZED_ENGLISH": {
                "credits_required": 0,
                "note": "Không tính vào điểm trung bình, không tính vào số tín chỉ tích lũy theo mục 7.2.1.a",
                "courses": [
                    "CHE10031",
                    "CHE10032",
                    "CHE10033",
                    "CHE10034"
                ]
            },
            "CORE": {
                "credits": 51,
                "courses": [
                    "CHE10004",
                    "CHE10009",
                    "CHE10010",
                    "CHE10017",
                    "CHE10018",
                    "CHE10002",
                    "CHE10003",
                    "CHE10011",
                    "CHE10012",
                    "CHE10007",
                    "CHE10008",
                    "CHE10015",
                    "CHE10016",
                    "CHE10029",
                    "CHE10030",
                    "CHE10006",
                    "CHE10013",
                    "CHE10014",
                    "CHE10026",
                    "CHE10027"
                ]
            }
        }
    },
    "MAJOR_CHEMISTRY": {
        "name": "Kiến thức chuyên ngành Hóa học — chương trình Tăng cường tiếng Anh",
        "total_credits_required": 23,
        "note": "Mỗi chuyên ngành: 4 TC bắt buộc chung + 10 TC tự chọn chuyên ngành (8 TC lý thuyết + 2 TC thực hành) + 9 TC tự chọn tự do từ Phụ lục 1–3.",
        "breakdown": {
            "ORGANIC": {
                "name": "Hóa Hữu cơ",
                "total_credits_required": 23,
                "note": "CTĐT công bố một khung học phần chuyên ngành dùng chung cho các lựa chọn chuyên ngành",                "breakdown": {
                    "mandatory_common": {
                        "courses": [
                            "CHE10023",
                            "CHE10786"
                        ],
                        "total_credits_required": 4
                    },
                    "theory_electives": {
                        "courses": [
                            "CHE10105",
                            "CHE10106",
                            "CHE10202",
                            "CHE10203",
                            "CHE10301",
                            "CHE10303",
                            "CHE10403",
                            "CHE10408",
                            "CHE10501",
                            "CHE10502",
                            "CHE10601",
                            "CHE10608"
                        ],
                        "total_credits_required": 8
                    },
                    "lab_electives": {
                        "courses": [
                            "CHE10104",
                            "CHE10204",
                            "CHE10205",
                            "CHE10305",
                            "CHE10306",
                            "CHE10404",
                            "CHE10504",
                            "CHE10506",
                            "CHE10606"
                        ],
                        "total_credits_required": 2
                    },
                    "free_electives": {
                        "courses": [
                            "CHE10019",
                            "CHE10022",
                            "CHE10028",
                            "CHE10101",
                            "CHE10102",
                            "CHE10103",
                            "CHE10602",
                            "CHE10124",
                            "CHE10133",
                            "CHE10134",
                            "CHE10201",
                            "CHE10206",
                            "CHE10222",
                            "CHE10223",
                            "CHE10226",
                            "CHE10227",
                            "CHE10228",
                            "CHE10229",
                            "CHE10230",
                            "CHE10231",
                            "CHE10232",
                            "CHE10302",
                            "CHE10304",
                            "CHE10320",
                            "CHE10321",
                            "CHE10322",
                            "CHE10323",
                            "CHE10324",
                            "CHE10328",
                            "CHE10401",
                            "CHE10402",
                            "CHE10405",
                            "CHE10420",
                            "CHE10421",
                            "CHE10422",
                            "CHE10423",
                            "CHE10425",
                            "CHE10426",
                            "CHE10427",
                            "CHE10428",
                            "CHE10503",
                            "CHE10505",
                            "CHE10520",
                            "CHE10521",
                            "CHE10522",
                            "CHE10523",
                            "CHE10524",
                            "CHE10525",
                            "CHE10526",
                            "CHE10527",
                            "CHE10528",
                            "CHE10603",
                            "CHE10621",
                            "CHE10622",
                            "CHE10624",
                            "CHE10625",
                            "CHE10627",
                            "CHE10630"
                        ],
                        "total_credits_required": 9
                    }
                }
            },
            "PHYSICAL": {
                "name": "Hóa Lý",
                "total_credits_required": 23,
                "note": "CTĐT công bố một khung học phần chuyên ngành dùng chung cho các lựa chọn chuyên ngành",                "breakdown": {
                    "mandatory_common": {
                        "courses": [
                            "CHE10023",
                            "CHE10786"
                        ],
                        "total_credits_required": 4
                    },
                    "theory_electives": {
                        "courses": [
                            "CHE10105",
                            "CHE10106",
                            "CHE10202",
                            "CHE10203",
                            "CHE10301",
                            "CHE10303",
                            "CHE10403",
                            "CHE10408",
                            "CHE10501",
                            "CHE10502",
                            "CHE10601",
                            "CHE10608"
                        ],
                        "total_credits_required": 8
                    },
                    "lab_electives": {
                        "courses": [
                            "CHE10104",
                            "CHE10204",
                            "CHE10205",
                            "CHE10305",
                            "CHE10306",
                            "CHE10404",
                            "CHE10504",
                            "CHE10506",
                            "CHE10606"
                        ],
                        "total_credits_required": 2
                    },
                    "free_electives": {
                        "courses": [
                            "CHE10019",
                            "CHE10022",
                            "CHE10028",
                            "CHE10101",
                            "CHE10102",
                            "CHE10103",
                            "CHE10602",
                            "CHE10124",
                            "CHE10133",
                            "CHE10134",
                            "CHE10201",
                            "CHE10206",
                            "CHE10222",
                            "CHE10223",
                            "CHE10226",
                            "CHE10227",
                            "CHE10228",
                            "CHE10229",
                            "CHE10230",
                            "CHE10231",
                            "CHE10232",
                            "CHE10302",
                            "CHE10304",
                            "CHE10320",
                            "CHE10321",
                            "CHE10322",
                            "CHE10323",
                            "CHE10324",
                            "CHE10328",
                            "CHE10401",
                            "CHE10402",
                            "CHE10405",
                            "CHE10420",
                            "CHE10421",
                            "CHE10422",
                            "CHE10423",
                            "CHE10425",
                            "CHE10426",
                            "CHE10427",
                            "CHE10428",
                            "CHE10503",
                            "CHE10505",
                            "CHE10520",
                            "CHE10521",
                            "CHE10522",
                            "CHE10523",
                            "CHE10524",
                            "CHE10525",
                            "CHE10526",
                            "CHE10527",
                            "CHE10528",
                            "CHE10603",
                            "CHE10621",
                            "CHE10622",
                            "CHE10624",
                            "CHE10625",
                            "CHE10627",
                            "CHE10630"
                        ],
                        "total_credits_required": 9
                    }
                }
            },
            "ANALYTICAL": {
                "name": "Hóa Phân tích",
                "total_credits_required": 23,
                "note": "CTĐT công bố một khung học phần chuyên ngành dùng chung cho các lựa chọn chuyên ngành",                "breakdown": {
                    "mandatory_common": {
                        "courses": [
                            "CHE10023",
                            "CHE10786"
                        ],
                        "total_credits_required": 4
                    },
                    "theory_electives": {
                        "courses": [
                            "CHE10105",
                            "CHE10106",
                            "CHE10202",
                            "CHE10203",
                            "CHE10301",
                            "CHE10303",
                            "CHE10403",
                            "CHE10408",
                            "CHE10501",
                            "CHE10502",
                            "CHE10601",
                            "CHE10608"
                        ],
                        "total_credits_required": 8
                    },
                    "lab_electives": {
                        "courses": [
                            "CHE10104",
                            "CHE10204",
                            "CHE10205",
                            "CHE10305",
                            "CHE10306",
                            "CHE10404",
                            "CHE10504",
                            "CHE10506",
                            "CHE10606"
                        ],
                        "total_credits_required": 2
                    },
                    "free_electives": {
                        "courses": [
                            "CHE10019",
                            "CHE10022",
                            "CHE10028",
                            "CHE10101",
                            "CHE10102",
                            "CHE10103",
                            "CHE10602",
                            "CHE10124",
                            "CHE10133",
                            "CHE10134",
                            "CHE10201",
                            "CHE10206",
                            "CHE10222",
                            "CHE10223",
                            "CHE10226",
                            "CHE10227",
                            "CHE10228",
                            "CHE10229",
                            "CHE10230",
                            "CHE10231",
                            "CHE10232",
                            "CHE10302",
                            "CHE10304",
                            "CHE10320",
                            "CHE10321",
                            "CHE10322",
                            "CHE10323",
                            "CHE10324",
                            "CHE10328",
                            "CHE10401",
                            "CHE10402",
                            "CHE10405",
                            "CHE10420",
                            "CHE10421",
                            "CHE10422",
                            "CHE10423",
                            "CHE10425",
                            "CHE10426",
                            "CHE10427",
                            "CHE10428",
                            "CHE10503",
                            "CHE10505",
                            "CHE10520",
                            "CHE10521",
                            "CHE10522",
                            "CHE10523",
                            "CHE10524",
                            "CHE10525",
                            "CHE10526",
                            "CHE10527",
                            "CHE10528",
                            "CHE10603",
                            "CHE10621",
                            "CHE10622",
                            "CHE10624",
                            "CHE10625",
                            "CHE10627",
                            "CHE10630"
                        ],
                        "total_credits_required": 9
                    }
                }
            },
            "INORGANIC": {
                "name": "Hóa Vô cơ và ứng dụng",
                "total_credits_required": 23,
                "note": "CTĐT công bố một khung học phần chuyên ngành dùng chung cho các lựa chọn chuyên ngành",                "breakdown": {
                    "mandatory_common": {
                        "courses": [
                            "CHE10023",
                            "CHE10786"
                        ],
                        "total_credits_required": 4
                    },
                    "theory_electives": {
                        "courses": [
                            "CHE10105",
                            "CHE10106",
                            "CHE10202",
                            "CHE10203",
                            "CHE10301",
                            "CHE10303",
                            "CHE10403",
                            "CHE10408",
                            "CHE10501",
                            "CHE10502",
                            "CHE10601",
                            "CHE10608"
                        ],
                        "total_credits_required": 8
                    },
                    "lab_electives": {
                        "courses": [
                            "CHE10104",
                            "CHE10204",
                            "CHE10205",
                            "CHE10305",
                            "CHE10306",
                            "CHE10404",
                            "CHE10504",
                            "CHE10506",
                            "CHE10606"
                        ],
                        "total_credits_required": 2
                    },
                    "free_electives": {
                        "courses": [
                            "CHE10019",
                            "CHE10022",
                            "CHE10028",
                            "CHE10101",
                            "CHE10102",
                            "CHE10103",
                            "CHE10602",
                            "CHE10124",
                            "CHE10133",
                            "CHE10134",
                            "CHE10201",
                            "CHE10206",
                            "CHE10222",
                            "CHE10223",
                            "CHE10226",
                            "CHE10227",
                            "CHE10228",
                            "CHE10229",
                            "CHE10230",
                            "CHE10231",
                            "CHE10232",
                            "CHE10302",
                            "CHE10304",
                            "CHE10320",
                            "CHE10321",
                            "CHE10322",
                            "CHE10323",
                            "CHE10324",
                            "CHE10328",
                            "CHE10401",
                            "CHE10402",
                            "CHE10405",
                            "CHE10420",
                            "CHE10421",
                            "CHE10422",
                            "CHE10423",
                            "CHE10425",
                            "CHE10426",
                            "CHE10427",
                            "CHE10428",
                            "CHE10503",
                            "CHE10505",
                            "CHE10520",
                            "CHE10521",
                            "CHE10522",
                            "CHE10523",
                            "CHE10524",
                            "CHE10525",
                            "CHE10526",
                            "CHE10527",
                            "CHE10528",
                            "CHE10603",
                            "CHE10621",
                            "CHE10622",
                            "CHE10624",
                            "CHE10625",
                            "CHE10627",
                            "CHE10630"
                        ],
                        "total_credits_required": 9
                    }
                }
            },
            "POLYMER": {
                "name": "Hóa Polyme",
                "total_credits_required": 23,
                "note": "CTĐT công bố một khung học phần chuyên ngành dùng chung cho các lựa chọn chuyên ngành",                "breakdown": {
                    "mandatory_common": {
                        "courses": [
                            "CHE10023",
                            "CHE10786"
                        ],
                        "total_credits_required": 4
                    },
                    "theory_electives": {
                        "courses": [
                            "CHE10105",
                            "CHE10106",
                            "CHE10202",
                            "CHE10203",
                            "CHE10301",
                            "CHE10303",
                            "CHE10403",
                            "CHE10408",
                            "CHE10501",
                            "CHE10502",
                            "CHE10601",
                            "CHE10608"
                        ],
                        "total_credits_required": 8
                    },
                    "lab_electives": {
                        "courses": [
                            "CHE10104",
                            "CHE10204",
                            "CHE10205",
                            "CHE10305",
                            "CHE10306",
                            "CHE10404",
                            "CHE10504",
                            "CHE10506",
                            "CHE10606"
                        ],
                        "total_credits_required": 2
                    },
                    "free_electives": {
                        "courses": [
                            "CHE10019",
                            "CHE10022",
                            "CHE10028",
                            "CHE10101",
                            "CHE10102",
                            "CHE10103",
                            "CHE10602",
                            "CHE10124",
                            "CHE10133",
                            "CHE10134",
                            "CHE10201",
                            "CHE10206",
                            "CHE10222",
                            "CHE10223",
                            "CHE10226",
                            "CHE10227",
                            "CHE10228",
                            "CHE10229",
                            "CHE10230",
                            "CHE10231",
                            "CHE10232",
                            "CHE10302",
                            "CHE10304",
                            "CHE10320",
                            "CHE10321",
                            "CHE10322",
                            "CHE10323",
                            "CHE10324",
                            "CHE10328",
                            "CHE10401",
                            "CHE10402",
                            "CHE10405",
                            "CHE10420",
                            "CHE10421",
                            "CHE10422",
                            "CHE10423",
                            "CHE10425",
                            "CHE10426",
                            "CHE10427",
                            "CHE10428",
                            "CHE10503",
                            "CHE10505",
                            "CHE10520",
                            "CHE10521",
                            "CHE10522",
                            "CHE10523",
                            "CHE10524",
                            "CHE10525",
                            "CHE10526",
                            "CHE10527",
                            "CHE10528",
                            "CHE10603",
                            "CHE10621",
                            "CHE10622",
                            "CHE10624",
                            "CHE10625",
                            "CHE10627",
                            "CHE10630"
                        ],
                        "total_credits_required": 9
                    }
                }
            },
            "MEDICINAL": {
                "name": "Hóa Dược",
                "total_credits_required": 23,
                "note": "CTĐT công bố một khung học phần chuyên ngành dùng chung cho các lựa chọn chuyên ngành",                "breakdown": {
                    "mandatory_common": {
                        "courses": [
                            "CHE10023",
                            "CHE10786"
                        ],
                        "total_credits_required": 4
                    },
                    "theory_electives": {
                        "courses": [
                            "CHE10105",
                            "CHE10106",
                            "CHE10202",
                            "CHE10203",
                            "CHE10301",
                            "CHE10303",
                            "CHE10403",
                            "CHE10408",
                            "CHE10501",
                            "CHE10502",
                            "CHE10601",
                            "CHE10608"
                        ],
                        "total_credits_required": 8
                    },
                    "lab_electives": {
                        "courses": [
                            "CHE10104",
                            "CHE10204",
                            "CHE10205",
                            "CHE10305",
                            "CHE10306",
                            "CHE10404",
                            "CHE10504",
                            "CHE10506",
                            "CHE10606"
                        ],
                        "total_credits_required": 2
                    },
                    "free_electives": {
                        "courses": [
                            "CHE10019",
                            "CHE10022",
                            "CHE10028",
                            "CHE10101",
                            "CHE10102",
                            "CHE10103",
                            "CHE10602",
                            "CHE10124",
                            "CHE10133",
                            "CHE10134",
                            "CHE10201",
                            "CHE10206",
                            "CHE10222",
                            "CHE10223",
                            "CHE10226",
                            "CHE10227",
                            "CHE10228",
                            "CHE10229",
                            "CHE10230",
                            "CHE10231",
                            "CHE10232",
                            "CHE10302",
                            "CHE10304",
                            "CHE10320",
                            "CHE10321",
                            "CHE10322",
                            "CHE10323",
                            "CHE10324",
                            "CHE10328",
                            "CHE10401",
                            "CHE10402",
                            "CHE10405",
                            "CHE10420",
                            "CHE10421",
                            "CHE10422",
                            "CHE10423",
                            "CHE10425",
                            "CHE10426",
                            "CHE10427",
                            "CHE10428",
                            "CHE10503",
                            "CHE10505",
                            "CHE10520",
                            "CHE10521",
                            "CHE10522",
                            "CHE10523",
                            "CHE10524",
                            "CHE10525",
                            "CHE10526",
                            "CHE10527",
                            "CHE10528",
                            "CHE10603",
                            "CHE10621",
                            "CHE10622",
                            "CHE10624",
                            "CHE10625",
                            "CHE10627",
                            "CHE10630"
                        ],
                        "total_credits_required": 9
                    }
                }
            }
        }
    },
    "GRADUATION": {
        "name": "Kiến thức tốt nghiệp",
        "total_credits_required": 10,
        "note": "Sinh viên chọn 1 trong 3 phương án: khóa luận 10 TC; tiểu luận thực nghiệm 6 TC + 4 TC tự chọn; hoặc tiểu luận lý thuyết 4 TC + 6 TC tự chọn.",
        "breakdown": {
            "THESIS_10": {
                "courses": [
                    "CHE10195",
                    "CHE10295",
                    "CHE10395",
                    "CHE10495",
                    "CHE10595",
                    "CHE10695"
                ]
            },
            "EXPERIMENTAL_6": {
                "courses": [
                    "CHE10191",
                    "CHE10291",
                    "CHE10391",
                    "CHE10491",
                    "CHE10591",
                    "CHE10691"
                ]
            },
            "THEORETICAL_4": {
                "courses": [
                    "CHE10190",
                    "CHE10290",
                    "CHE10390",
                    "CHE10490",
                    "CHE10590",
                    "CHE10690"
                ]
            }
        }
    }
}

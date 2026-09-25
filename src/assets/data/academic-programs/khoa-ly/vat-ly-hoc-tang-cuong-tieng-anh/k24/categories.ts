export const categories = {
    "GENERAL_EDUCATION": {
        "name": "Giáo dục đại cương",
        "total_credits_required": 51,
        "note": "51 tín chỉ không kể Tin học cơ sở, Ngoại ngữ, GDTC và GDQP-AN. Khung học phần theo CTĐT Vật lý học K2024 do Khoa Vật lý - Vật lý kỹ thuật công bố.",
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
                "credits": 2,
                "mandatory": false,
                "note": "Chọn 1 trong 3 học phần.",
                "courses": [
                    "BAA00005",
                    "BAA00006",
                    "BAA00007"
                ]
            },
            "GENERAL_MATH_SCIENCE": {
                "name": "Toán - Khoa học tự nhiên - Công nghệ - Môi trường",
                "credits_required": 35,
                "mandatory": false,
                "note": "Các học phần trong danh sách là bắt buộc, trừ nhóm Môi trường/Trái đất chọn 1 trong GEO00002 và ENV00001.",
                "courses": [
                    "MTH00003",
                    "MTH00081",
                    "PHY00001",
                    "PHY00010",
                    "CHE00001",
                    "MTH00004",
                    "MTH00030",
                    "PHY00002",
                    "PHY00003",
                    "PHY00081",
                    "MTH00040",
                    "PHY00004",
                    "GEO00002",
                    "ENV00001"
                ]
            },
            "GENERAL_IT": {
                "name": "Tin học",
                "credits": 3,
                "mandatory": true,
                "note": "Không tính vào 51 tín chỉ giáo dục đại cương nêu trên.",
                "courses": [
                    "CSC00003"
                ]
            },
            "GENERAL_ENGLISH": {
                "name": "Ngoại ngữ",
                "credits": 12,
                "mandatory": false,
                "note": "Không tính vào 51 tín chỉ giáo dục đại cương nêu trên.",
                "courses": [
                    "ADD00031",
                    "ADD00032",
                    "ADD00033",
                    "ADD00034"
                ]
            },
            "GENERAL_PE": {
                "name": "Giáo dục thể chất",
                "credits": 4,
                "mandatory": true,
                "note": "Không tính vào 51 tín chỉ giáo dục đại cương nêu trên.",
                "courses": [
                    "BAA00021",
                    "BAA00022"
                ]
            },
            "GENERAL_DEFENSE": {
                "name": "Giáo dục quốc phòng - An ninh",
                "credits": 4,
                "mandatory": true,
                "note": "Không tính vào 51 tín chỉ giáo dục đại cương nêu trên.",
                "courses": [
                    "BAA00030"
                ]
            }
        }
    },
    "FOUNDATION": {
        "name": "Kiến thức cơ sở ngành",
        "total_credits_required": 25,
        "mandatory": true,
        "courses": [
            "PHY10005",
            "PHY10009",
            "PHY10001",
            "PHY10002",
            "PHY10004",
            "PHY10006",
            "PHY10007",
            "PHY10011",
            "PHY10016"
        ]
    },
    "MAJOR_PHYSICS": {
        "name": "Kiến thức chuyên ngành Vật lý học",
        "total_credits_required": 48,
        "note": "Chọn 1 trong 7 chuyên ngành.",
        "breakdown": {
            "NUCLEAR_PHYSICS": {
                "name": "Chuyên ngành Vật lý hạt nhân",
                "total_credits_required": 48,
                "breakdown": {
                    "mandatory": {
                        "total_credits_required": 33,
                        "courses": [
                            "PHY10625",
                            "PHY10331",
                            "PHY10517",
                            "PHY10802",
                            "PHY10433",
                            "PHY10529",
                            "PHY10532",
                            "PHY10801",
                            "PHY10302",
                            "PHY10325",
                            "PHY10326",
                            "PHY10327",
                            "PHY10328"
                        ]
                    },
                    "elective": {
                        "total_credits_required": 15,
                        "note": "Tích lũy đủ số tín chỉ tự chọn để tổng khối chuyên ngành đạt 48 tín chỉ theo bảng CTĐT K2024 của Khoa Vật lý - Vật lý kỹ thuật.",
                        "courses": [
                            "PHY10438",
                            "PHY10530",
                            "PHY10426",
                            "PHY10432",
                            "PHY10524",
                            "PHY10531",
                            "PHY10609",
                            "PHY10316",
                            "PHY10322",
                            "PHY10323",
                            "PHY10324",
                            "PHY10434",
                            "PHY10628",
                            "PHY10536",
                            "PHY10439",
                            "PHY10307",
                            "PHY10308",
                            "PHY10310",
                            "PHY10315",
                            "PHY10329",
                            "PHY10330"
                        ]
                    }
                }
            },
            "GEOPHYSICS": {
                "name": "Chuyên ngành Vật lý địa cầu",
                "total_credits_required": 48,
                "breakdown": {
                    "mandatory": {
                        "total_credits_required": 36,
                        "courses": [
                            "PHY10625",
                            "PHY10331",
                            "PHY10517",
                            "PHY10802",
                            "PHY10433",
                            "PHY10529",
                            "PHY10532",
                            "PHY10801",
                            "PHY10413",
                            "PHY10423",
                            "PHY10431",
                            "PHY10435",
                            "PHY10436"
                        ]
                    },
                    "elective": {
                        "total_credits_required": 12,
                        "note": "Tích lũy đủ số tín chỉ tự chọn để tổng khối chuyên ngành đạt 48 tín chỉ theo bảng CTĐT K2024 của Khoa Vật lý - Vật lý kỹ thuật.",
                        "courses": [
                            "PHY10438",
                            "PHY10530",
                            "PHY10426",
                            "PHY10432",
                            "PHY10524",
                            "PHY10531",
                            "PHY10609",
                            "PHY10316",
                            "PHY10322",
                            "PHY10323",
                            "PHY10324",
                            "PHY10434",
                            "PHY10628",
                            "PHY10536",
                            "PHY10439",
                            "PHY10425",
                            "PHY10437"
                        ]
                    }
                }
            },
            "THEORETICAL_PHYSICS": {
                "name": "Chuyên ngành Vật lý lý thuyết",
                "total_credits_required": 48,
                "breakdown": {
                    "mandatory": {
                        "total_credits_required": 33,
                        "courses": [
                            "PHY10625",
                            "PHY10331",
                            "PHY10517",
                            "PHY10802",
                            "PHY10433",
                            "PHY10529",
                            "PHY10532",
                            "PHY10801",
                            "PHY10533",
                            "PHY10534",
                            "PHY10535"
                        ]
                    },
                    "elective": {
                        "total_credits_required": 15,
                        "note": "Tích lũy đủ số tín chỉ tự chọn để tổng khối chuyên ngành đạt 48 tín chỉ theo bảng CTĐT K2024 của Khoa Vật lý - Vật lý kỹ thuật.",
                        "courses": [
                            "PHY10438",
                            "PHY10530",
                            "PHY10426",
                            "PHY10432",
                            "PHY10524",
                            "PHY10531",
                            "PHY10609",
                            "PHY10316",
                            "PHY10322",
                            "PHY10323",
                            "PHY10324",
                            "PHY10434",
                            "PHY10628",
                            "PHY10536",
                            "PHY10439",
                            "PHY10507",
                            "PHY10512",
                            "PHY10527",
                            "PHY10528"
                        ]
                    }
                }
            },
            "ELECTRONIC_PHYSICS": {
                "name": "Chuyên ngành Vật lý điện tử",
                "total_credits_required": 48,
                "breakdown": {
                    "mandatory": {
                        "total_credits_required": 39,
                        "courses": [
                            "PHY10609",
                            "PHY10626",
                            "PHY10628",
                            "PHY10802",
                            "PHY10625",
                            "PHY10228",
                            "PHY10627",
                            "PHY10724",
                            "PHY10801",
                            "PHY10102",
                            "PHY10128",
                            "PHY10134",
                            "PHY10622"
                        ]
                    },
                    "elective": {
                        "total_credits_required": 9,
                        "note": "Tích lũy đủ số tín chỉ tự chọn để tổng khối chuyên ngành đạt 48 tín chỉ theo bảng CTĐT K2024 của Khoa Vật lý - Vật lý kỹ thuật.",
                        "courses": [
                            "PHY10237",
                            "PHY10530",
                            "PHY10124",
                            "PHY10618",
                            "PHY10103",
                            "PHY10229",
                            "PHY10611",
                            "PHY10620",
                            "PHY10630",
                            "PHY10634",
                            "PHY10635",
                            "PHY10636",
                            "PHY10725",
                            "PHY10726",
                            "PHY10105",
                            "PHY10111",
                            "PHY10131",
                            "PHY10126",
                            "PHY10115",
                            "PHY10127",
                            "PHY10130",
                            "PHY10122",
                            "PHY10614"
                        ]
                    }
                }
            },
            "SOLID_STATE_PHYSICS": {
                "name": "Chuyên ngành Vật lý chất rắn",
                "total_credits_required": 48,
                "breakdown": {
                    "mandatory": {
                        "total_credits_required": 37,
                        "courses": [
                            "PHY10609",
                            "PHY10626",
                            "PHY10628",
                            "PHY10802",
                            "PHY10228",
                            "PHY10627",
                            "PHY10724",
                            "PHY10801",
                            "PHY10229",
                            "PHY10230",
                            "PHY10231",
                            "PHY10232"
                        ]
                    },
                    "elective": {
                        "total_credits_required": 11,
                        "note": "Tích lũy đủ số tín chỉ tự chọn để tổng khối chuyên ngành đạt 48 tín chỉ theo bảng CTĐT K2024 của Khoa Vật lý - Vật lý kỹ thuật.",
                        "courses": [
                            "PHY10625",
                            "PHY10237",
                            "PHY10530",
                            "PHY10124",
                            "PHY10618",
                            "PHY10103",
                            "PHY10611",
                            "PHY10620",
                            "PHY10630",
                            "PHY10634",
                            "PHY10635",
                            "PHY10636",
                            "PHY10725",
                            "PHY10726",
                            "PHY10205",
                            "PHY10207",
                            "PHY10227",
                            "PHY10233",
                            "PHY10234",
                            "PHY10235",
                            "PHY10236",
                            "PHY10614"
                        ]
                    }
                }
            },
            "COMPUTATIONAL_PHYSICS": {
                "name": "Chuyên ngành Vật lý tin học",
                "total_credits_required": 48,
                "breakdown": {
                    "mandatory": {
                        "total_credits_required": 28,
                        "courses": [
                            "PHY10609",
                            "PHY10626",
                            "PHY10628",
                            "PHY10802",
                            "PHY10228",
                            "PHY10627",
                            "PHY10724",
                            "PHY10801",
                            "PHY10631"
                        ]
                    },
                    "elective": {
                        "total_credits_required": 20,
                        "note": "Tích lũy đủ số tín chỉ tự chọn để tổng khối chuyên ngành đạt 48 tín chỉ theo bảng CTĐT K2024 của Khoa Vật lý - Vật lý kỹ thuật.",
                        "courses": [
                            "PHY10625",
                            "PHY10237",
                            "PHY10530",
                            "PHY10124",
                            "PHY10618",
                            "PHY10103",
                            "PHY10229",
                            "PHY10611",
                            "PHY10620",
                            "PHY10630",
                            "PHY10634",
                            "PHY10635",
                            "PHY10636",
                            "PHY10725",
                            "PHY10726",
                            "PHY10115",
                            "PHY10610",
                            "PHY10612",
                            "PHY10613",
                            "PHY10615",
                            "PHY10616",
                            "PHY10621",
                            "PHY10623",
                            "PHY10629",
                            "PHY10632",
                            "PHY10633",
                            "PHY10614"
                        ]
                    }
                }
            },
            "APPLIED_PHYSICS": {
                "name": "Chuyên ngành Vật lý ứng dụng",
                "total_credits_required": 48,
                "breakdown": {
                    "mandatory": {
                        "total_credits_required": 41,
                        "courses": [
                            "PHY10609",
                            "PHY10626",
                            "PHY10628",
                            "PHY10802",
                            "PHY10228",
                            "PHY10627",
                            "PHY10724",
                            "PHY10801",
                            "PHY10703",
                            "PHY10705",
                            "PHY10715",
                            "PHY10719",
                            "PHY10720",
                            "PHY10723",
                            "PHY10727"
                        ]
                    },
                    "elective": {
                        "total_credits_required": 7,
                        "note": "Tích lũy đủ số tín chỉ tự chọn để tổng khối chuyên ngành đạt 48 tín chỉ theo bảng CTĐT K2024 của Khoa Vật lý - Vật lý kỹ thuật.",
                        "courses": [
                            "PHY10625",
                            "PHY10237",
                            "PHY10530",
                            "PHY10124",
                            "PHY10618",
                            "PHY10103",
                            "PHY10229",
                            "PHY10611",
                            "PHY10620",
                            "PHY10630",
                            "PHY10634",
                            "PHY10635",
                            "PHY10636",
                            "PHY10725",
                            "PHY10726",
                            "PHY10614"
                        ]
                    }
                }
            }
        }
    },
    "GRADUATION": {
        "name": "Kiến thức tốt nghiệp",
        "total_credits_required": 10,
        "options": [
            {
                "type": "THESIS",
                "credits": 10,
                "courses": [
                    "PHY10995"
                ]
            },
            {
                "type": "PROJECT_AND_SEMINAR",
                "credits": 10,
                "note": "Đồ án tốt nghiệp 6 tín chỉ + Seminar chuyên ngành 4 tín chỉ.",
                "courses": [
                    "PHY10991",
                    "PHY10992"
                ]
            }
        ]
    }
};

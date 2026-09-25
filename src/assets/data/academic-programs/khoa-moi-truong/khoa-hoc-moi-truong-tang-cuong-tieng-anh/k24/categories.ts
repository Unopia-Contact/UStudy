export const categories = {
    "GENERAL_EDUCATION": {
        "name": "Giáo dục đại cương",
        "total_credits_required": 53,
        "note": "48 TC bắt buộc + 5 TC tự chọn; không kể GDQP, GDTC, Tin học cơ sở và ngoại ngữ.",
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
                "note": "Chọn 1 trong 3 học phần",
                "courses": [
                    "BAA00005",
                    "BAA00006",
                    "BAA00007"
                ]
            },
            "GENERAL_MATH_SCIENCE": {
                "name": "Toán - Khoa học tự nhiên - Công nghệ - Môi trường",
                "credits": 37,
                "note": "Chọn 1 trong MTH00040 (Xác suất thống kê) và ENV00004 (Thống kê trong môi trường).",
                "courses": [
                    "ENV00010",
                    "MTH00001",
                    "BIO00001",
                    "PHY00001",
                    "CHE00001",
                    "ENV00002",
                    "MTH00002",
                    "PHY00002",
                    "GEO00002",
                    "CHE00003",
                    "CHE00082",
                    "CHE00007",
                    "CHE00083",
                    "MTH00040",
                    "ENV00004"
                ]
            },
            "GENERAL_IT": {
                "name": "Tin học",
                "credits": 3,
                "note": "Không tính vào điểm trung bình.",
                "courses": [
                    "CSC00003"
                ]
            },
            "GENERAL_PE": {
                "name": "Giáo dục thể chất",
                "credits": 4,
                "note": "Không tính vào điểm trung bình.",
                "courses": [
                    "BAA00021",
                    "BAA00022"
                ]
            },
            "GENERAL_DEFENSE": {
                "name": "Giáo dục quốc phòng - An ninh",
                "credits": 4,
                "note": "Không tính vào điểm trung bình.",
                "courses": [
                    "BAA00030"
                ]
            }
        }
    },
    "FOUNDATION": {
        "name": "Kiến thức cơ sở ngành",
        "total_credits_required": 51,
        "note": "47 TC bắt buộc + tối thiểu 4 TC trong nhóm tự chọn. 12 TC Anh văn chuyên ngành không tính vào điểm trung bình.",
        "breakdown": {
            "SPECIALIZED_ENGLISH": {
                "credits_required": 0,
                "note": "Không tính vào điểm trung bình; 4 học phần, tổng 12 TC.",
                "courses": [
                    "ENV10071",
                    "ENV10072",
                    "ENV10073",
                    "ENV10074"
                ]
            },
            "MANDATORY": {
                "credits": 47,
                "courses": [
                    "ENV10001",
                    "ENV10002",
                    "ENV10003",
                    "ENV10004",
                    "ENV10005",
                    "ENV10006",
                    "ENV10007",
                    "ENV10008",
                    "ENV10030",
                    "ENV10012",
                    "ENV10013",
                    "ENV10014",
                    "ENV10015",
                    "ENV10016",
                    "ENV10017",
                    "ENV10018",
                    "ENV10019",
                    "ENV10020",
                    "ENV10021",
                    "ENV10025",
                    "ENV10149"
                ]
            },
            "ELECTIVE": {
                "credits_required": 4,
                "note": "Tích lũy ít nhất 4 TC. PDF nguồn ghi ENV10022 và ENV10026 là loại BB dù đặt trong mục học phần tự chọn; file giữ nguyên ký hiệu nguồn.",
                "courses": [
                    "ENV10023",
                    "ENV10027",
                    "ENV10022",
                    "ENV10026"
                ]
            }
        }
    },
    "MAJOR_ENVIRONMENTAL_SCIENCE": {
        "name": "Kiến thức chuyên ngành Khoa học môi trường",
        "total_credits_required": 19,
        "breakdown": {
            "mandatory": {
                "courses": [
                    "ENV10105",
                    "ENV10162"
                ],
                "total_credits_required": 4
            },
            "elective": {
                "courses": [
                    "ENV10102",
                    "ENV10103",
                    "ENV10104",
                    "ENV10114",
                    "ENV10117",
                    "ENV10128",
                    "ENV10130",
                    "ENV10132",
                    "ENV10163",
                    "ENV10164",
                    "ENV10165",
                    "ENV10166",
                    "ENV10167",
                    "ENV10168",
                    "ENV10169"
                ],
                "total_credits_required": 15
            }
        }
    },
    "GRADUATION": {
        "name": "Kiến thức tốt nghiệp",
        "total_credits_required": 10,
        "courses": [
            "ENV10195"
        ]
    }
}

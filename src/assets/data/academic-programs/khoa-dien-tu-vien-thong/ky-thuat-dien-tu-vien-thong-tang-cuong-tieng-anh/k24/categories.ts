export const categories = {
    "GENERAL_EDUCATION": {
        "name": "Giáo dục đại cương",
        "total_credits_required": 51,
        "note": "Không kể GDQP-AN, GDTC, Tin học cơ sở.",
        "breakdown": {
            "GENERAL_POLITICS": {
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
                "credits_required": 2,
                "note": "Chọn 1 trong 3 học phần",
                "courses": [
                    "BAA00005",
                    "BAA00006",
                    "BAA00007"
                ]
            },
            "GENERAL_MATH_SCIENCE": {
                "credits_required": 35,
                "courses": [
                    "MTH00003",
                    "MTH00004",
                    "MTH00030",
                    "MTH00040",
                    "ETC00001",
                    "ETC00002",
                    "ETC00006",
                    "ETC00013",
                    "ETC00015",
                    "ETC00081",
                    "ETC00083",
                    "ETC00084",
                    "PHY00001",
                    "PHY00002",
                    "PHY00004",
                    "GEO00002",
                    "ENV00001"
                ]
            },
            "GENERAL_IT": {
                "credits": 3,
                "courses": [
                    "CSC00003"
                ]
            },
            "GENERAL_PE": {
                "credits": 4,
                "courses": [
                    "BAA00021",
                    "BAA00022"
                ]
            },
            "GENERAL_DEFENSE": {
                "credits": 4,
                "courses": [
                    "BAA00030"
                ]
            }
        }
    },
    "FOUNDATION": {
        "name": "Kiến thức cơ sở ngành",
        "total_credits_required": 36,
        "mandatory": true,
        "courses": [
            "ETC00020",
            "ETC00021",
            "ETC00085",
            "ETC10005",
            "ETC10006",
            "ETC10007",
            "ETC10008",
            "ETC10009",
            "ETC10010",
            "ETC10020",
            "ETC10021",
            "ETC10013",
            "ETC10014",
            "ETC10015",
            "ETC10016",
            "ETC10017",
            "ETC10018",
            "ETC10191",
            "ETC10234",
            "ETC10235"
        ]
    },
    "MAJOR_ECE": {
        "name": "Kiến thức chuyên ngành",
        "total_credits_required": 38,
        "breakdown": {
            "mandatory": {
                "courses": [
                    "ETC10122",
                    "ETC10123",
                    "ETC10124",
                    "ETC10125",
                    "ETC10126",
                    "ETC10127",
                    "ETC10128",
                    "ETC10129",
                    "ETC10130",
                    "ETC10131",
                    "ETC10206",
                    "ETC10207",
                    "ETC10214",
                    "ETC10215",
                    "ETC10301",
                    "ETC10307",
                    "ETC10308",
                    "ETC10309",
                    "ETC10329"
                ],
                "total_credits_required": 32
            },
            "elective": {
                "note": "Hướng 1: tích lũy 3 tín chỉ đối với học phần ETC10136, Hướng 2: tích lũy 3 tín chỉ trong đó học phần ETC10321 là bắt buộc, 2 tín chỉ còn lại chọn trong nhóm TC4",
                "courses": [
                    "ETC10136",
                    "ETC10321",
                    "ETC10310",
                    "ETC10232",
                    "ETC10315",
                    "ETC10112",
                    "ETC10132",
                    "ETC10133",
                    "ETC10134",
                    "ETC10227",
                    "ETC10322",
                    "ETC10323",
                    "ETC10117",
                    "ETC10219",
                    "ETC10220",
                    "ETC10236"
                ],
                "total_credits_required": 6
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
                    "ETC10295"
                ]
            },
            {
                "type": "PROJECT_AND_ELECTIVES",
                "credits": 10,
                "courses": [
                    "ETC10190",
                    "ETC10132",
                    "ETC10133",
                    "ETC10134",
                    "ETC10227",
                    "ETC10322",
                    "ETC10323",
                    "ETC10117",
                    "ETC10219",
                    "ETC10220",
                    "ETC10236"
                ]
            }
        ]
    }
}

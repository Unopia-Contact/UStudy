import { useState, useEffect, useMemo } from 'react';
import { readFromStorage } from '../../../helpers/localStorage/save';
import { hasImportedData } from '../../../helpers/localStorage/data-import-status';
import { STORAGE_KEYS } from '../../../config';
import { getProgramRequiredCredits } from '../../../assets/data/academic-programs/category-credits';
import { AcademicRulesEngine } from '../services/academic-rules-engine';
import { FinancialLogic } from '../../tuition';
import { useDepartmentData } from '../../../context/DepartmentContext';
import {
    buildCreditDistribution,
    getDistributionTotal,
} from '../../../features/dashboard/services/dashboard-insights';

export function useStudentGradeData() {
    const {
        data: {
            tuitionRates,
            courses: allCoursesMeta,
            categories,
        },
        academicYear,
        semesterNumber,
    } = useDepartmentData();

    const totalProgramCredits = useMemo(
        () => getProgramRequiredCredits(categories),
        [categories],
    );

    const [stamp, setStamp] = useState(Date.now());
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    useEffect(() => {
        const handleMessage = (event: MessageEvent) => {
            if (
                event.data &&
                (
                    event.data.type === 'IMPORT_FULL_DATA' ||
                    event.data.type === 'CACHE_POPULATED'
                )
            ) {
                setStamp(Date.now());
            }
        };

        window.addEventListener('message', handleMessage);

        return () => {
            window.removeEventListener('message', handleMessage);
        };
    }, []);

    /**
     * Ví dụ:
     *
     * academicYear = "2024-2025"
     * semesterNumber = 2
     *
     * => "24-25/2"
     */
    const selectedSemesterKey = useMemo(() => {
        const year = String(academicYear);

        if (year.length === 9) {
            return `${year.substring(2, 4)}-${year.substring(7, 9)}/${semesterNumber}`;
        }

        return `${year}/${semesterNumber}`;
    }, [academicYear, semesterNumber]);

    const gradeData = useMemo(() => {
        const studentDb = readFromStorage<any>(
            STORAGE_KEYS.STUDENT_DB,
            null,
        );

        const imported = hasImportedData();

        /**
         * Chưa có database sinh viên.
         */
        if (!studentDb) {
            return {
                gradesHistory: [],
                currentGPA: 0,
                currentGPA4: 0,

                accumulatedCredits: 0,
                totalCredits: totalProgramCredits,

                estimatedTuition: 0,
                tuitionSource: 'none' as const,

                gpaPerSemester: [],

                majorGPA: 0,

                foundationGPA: 0,
                foundationGPA4: 0,

                majorSpecializedGPA: 0,
                majorSpecializedGPA4: 0,

                hasData: imported,
            };
        }

        const grades = Array.isArray(studentDb.grades)
            ? studentDb.grades
            : [];

        const hasBLMExemption =
            AcademicRulesEngine.checkBLMExemption(grades);

        const effectiveGrades =
            AcademicRulesEngine.resolveEffectiveGrades(grades);

        /**
         * ============================================================
         * GPA
         * ============================================================
         *
         * AcademicRulesEngine vẫn chịu trách nhiệm:
         *
         * - GPA hệ 10
         * - GPA hệ 4
         * - GPA từng học kỳ
         * - GPA cơ sở ngành
         * - GPA chuyên ngành
         *
         * NHƯNG:
         *
         * accumulatedCredits trả về từ đây KHÔNG còn được dùng.
         */
        const gpaSummary =
            AcademicRulesEngine.calculateGPASummary(
                grades,
                effectiveGrades,
                hasBLMExemption,
                allCoursesMeta,
                selectedSemesterKey,
            );

        const {
            gradesHistory,
            currentGPA,
            currentGPA4,
            gpaPerSemester,
            majorGPA,
            foundationGPA,
            foundationGPA4,
            majorSpecializedGPA,
            majorSpecializedGPA4,
        } = gpaSummary;

        /**
         * BLM exemption ghost courses
         */
        const ghostCourses =
            AcademicRulesEngine.buildExemptedGhostCourses(
                effectiveGrades,
                hasBLMExemption,
            );

        gradesHistory.push(...ghostCourses);

        /**
         * ============================================================
         * TÍN CHỈ TÍCH LŨY
         * ============================================================
         *
         * KHÔNG dùng:
         *
         * gpaSummary.accumulatedCredits
         *
         * nữa.
         *
         * Thay vào đó sử dụng cùng rule với
         * CreditDistributionWidget.
         *
         * buildCreditDistribution hiện chỉ giữ:
         *
         * status === "passed"
         *
         * => môn studying / chưa có điểm
         *    KHÔNG được tính.
         *
         * Đồng thời rule bên trong xử lý:
         *
         * - môn trùng category
         * - breakdown
         * - options
         * - specialization
         * - selection_mode = one
         * - include_in_parent_total
         * - excluded courses
         * - excluded categories
         * - giới hạn tín chỉ
         */
        const creditDistribution =
            buildCreditDistribution(
                categories,
                allCoursesMeta,
            );

        const accumulatedCredits =
            getDistributionTotal(
                creditDistribution,
            );

        const totalCredits =
            totalProgramCredits;

        /**
         * ============================================================
         * HỌC PHÍ
         * ============================================================
         */
        const importMeta = readFromStorage<any>(
            STORAGE_KEYS.IMPORT_META,
            null,
        );

        const tuitionData =
            FinancialLogic.calculateTuitionData(
                selectedSemesterKey,
                undefined,
                studentDb,
                importMeta,
                tuitionRates,
                allCoursesMeta,
            );

        const estimatedTuition =
            tuitionData.summary.totalFee;

        const tuitionSource =
            tuitionData.source;

        return {
            gradesHistory,

            currentGPA,
            currentGPA4,

            accumulatedCredits,
            totalCredits,

            estimatedTuition,
            tuitionSource,

            gpaPerSemester,

            majorGPA,

            foundationGPA,
            foundationGPA4,

            majorSpecializedGPA,
            majorSpecializedGPA4,

            hasData: true,
        };
    }, [
        stamp,
        tuitionRates,
        allCoursesMeta,
        categories,
        selectedSemesterKey,
        totalProgramCredits,
    ]);

    return {
        ...gradeData,

        /**
         * Tất cả phép tính phía trên đều synchronous,
         * nên không cần setState từ bên trong useMemo.
         */
        isReady: isMounted,
    };
}

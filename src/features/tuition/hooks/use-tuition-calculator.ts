import { useMemo } from 'react';
import { useStudentDb } from '../../../hooks/useStudentDb';
import { useDepartmentData } from '../../../context/DepartmentContext';
import { readFromStorage } from '../../../helpers/localStorage/save';
import { STORAGE_KEYS } from '../../../config';
import { FinancialLogic } from '../services/financial-logic';
import { useCampus } from '../../../context/CampusContext';

export function useTuitionCalculator(selectedSemesterName: string) {
    const { defaultCampusId } = useCampus();
    const { registrations } = useStudentDb();
    const { data: { tuitionRates, courses: allCoursesMeta } } = useDepartmentData();

    return useMemo(() => {
        const targetSemester = FinancialLogic.parseSemesterName(selectedSemesterName);
        const studentDb = readFromStorage<any>(STORAGE_KEYS.STUDENT_DB, null);
        const importMeta = readFromStorage<any>(STORAGE_KEYS.IMPORT_META, null);

        const result = FinancialLogic.calculateTuitionData(
            targetSemester,
            selectedSemesterName,
            studentDb,
            importMeta,
            tuitionRates,
            allCoursesMeta,
            defaultCampusId,
        );

        return result;
    }, [selectedSemesterName, registrations, tuitionRates, allCoursesMeta, defaultCampusId]);
}

export type TuitionProfileId = 'tuition-cs1' | 'tuition-cs2';

export interface TuitionProgramRef {
    facultyId: string;
    majorId: string;
}

export interface TuitionRateTable {
    default_price: number;
    shared: Record<string, number>;
    majors: Record<string, Record<string, number>>;
}

export interface TuitionProfileDefinition {
    id: TuitionProfileId;
    name: string;
}

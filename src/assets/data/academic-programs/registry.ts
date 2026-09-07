/**
 * Nguon du lieu chuong trinh dao tao.
 * Cau truc goc: Khoa tuyen -> Khoa -> Nganh.
 *
 * Khi them khoa moi, them mot entry vao ACADEMIC_YEAR_MAJOR_CATALOGS. Neu
 * chuong trinh cua khoa do dung lai khoa cu, khai bao defaultProgramDataSource.
 */

import type { CampusId } from '../../../domain/campus';
import { DEFAULT_TUITION_PROFILE_ID, type TuitionProfileId } from '../tuition';

export interface CohortInfo {
    id: string;
    name: string;
}

export interface CohortMajorInfo {
    id: string;
    name: string;
    campusIds: CampusId[];
    tuitionProfileId: TuitionProfileId;
    /** Nguồn chương trình riêng, dùng để ghi đè nguồn mặc định của khóa. */
    dataSourceCohort?: string;
}

type CohortMajorDefinition = CohortMajorInfo;

export interface CohortFacultyInfo {
    id: string;
    name: string;
    majors: CohortMajorInfo[];
}

interface CohortFacultyDefinition extends Omit<CohortFacultyInfo, 'majors'> {
    majors: CohortMajorDefinition[];
}

export interface AcademicYearMajorCatalog {
    cohortId: string;
    label: string;
    defaultProgramDataSource?: string;
    faculties: CohortFacultyInfo[];
}

interface AcademicYearMajorCatalogDefinition extends Omit<AcademicYearMajorCatalog, 'faculties'> {
    faculties: CohortFacultyDefinition[];
}

export interface MajorInfo {
    id: string;
    name: string;
    cohorts: CohortInfo[];
    dataSource?: Record<string, string>;
    campusIdsByCohort: Record<string, CampusId[]>;
    tuitionProfileId: TuitionProfileId;
}

export interface FacultyInfo {
    id: string;
    name: string;
    majors: MajorInfo[];
}

const ACADEMIC_YEAR_MAJOR_CATALOG_DEFINITIONS: AcademicYearMajorCatalogDefinition[] = [
    {
        cohortId: 'k24',
        label: 'Khóa tuyển 2024',
        faculties: [
            {
                id: 'khoa-cntt',
                name: 'Khoa Công nghệ Thông tin',
                majors: [
                    { id: 'nhom-nganh', name: 'Nhóm ngành máy tính và công nghệ thông tin', campusIds: ['dong-hoa'], tuitionProfileId: 'tuition-cs2' },
                    { id: 'cong-nghe-thong-tin', name: 'Công nghệ Thông tin', campusIds: ['dong-hoa'], tuitionProfileId: 'tuition-cs2' },
                    { id: 'he-thong-thong-tin', name: 'Hệ thống thông tin', campusIds: ['dong-hoa'], tuitionProfileId: 'tuition-cs2' },
                    { id: 'ky-thuat-phan-mem', name: 'Kỹ thuật phần mềm', campusIds: ['dong-hoa'], tuitionProfileId: 'tuition-cs2' },
                    { id: 'khoa-hoc-may-tinh', name: 'Khoa học máy tính', campusIds: ['dong-hoa'], tuitionProfileId: 'tuition-cs2' },
                    { id: 'khoa-hoc-may-tinh-tien-tien', name: 'Khoa học máy tính - Tiên tiến', campusIds: ['cho-quan'], tuitionProfileId: 'tuition-cs1' },
                    { id: 'cong-nghe-thong-tin-tang-cuong-tieng-anh', name: 'Công nghệ thông tin - Tăng cường tiếng Anh', campusIds: ['cho-quan'], tuitionProfileId: 'tuition-cs1' },
                    { id: 'tri-tue-nhan-tao', name: 'Trí tuệ nhân tạo', campusIds: ['dong-hoa'], tuitionProfileId: 'tuition-cs2' },
                    { id: 'cu-nhan-tai-nang', name: 'Cử nhân tài năng', campusIds: ['cho-quan', 'dong-hoa'], tuitionProfileId: 'tuition-cs2' },
                ],
            },
            {
                id: 'khoa-khoa-hoc-va-cong-nghe-vat-lieu',
                name: 'Khoa Khoa học và Công nghệ Vật liệu',
                majors: [
                    { id: 'khoa-hoc-vat-lieu', name: 'Khoa học vật liệu', campusIds: ['dong-hoa'], tuitionProfileId: 'tuition-cs2' },
                    { id: 'khoa-hoc-vat-lieu-tang-cuong-tieng-anh', name: 'Khoa học vật liệu - Tăng cường tiếng Anh', campusIds: ['cho-quan'], tuitionProfileId: 'tuition-cs1' },
                    { id: 'cong-nghe-vat-lieu', name: 'Công nghệ vật liệu', campusIds: ['dong-hoa'], tuitionProfileId: 'tuition-cs2' },
                ],
            },
            {
                id: 'khoa-toan',
                name: 'Khoa Toán - Tin học',
                majors: [
                    { id: 'toan-hoc', name: 'Toán học', campusIds: ['dong-hoa'], tuitionProfileId: 'tuition-cs2' },
                    { id: 'toan-tin', name: 'Toán - Tin', campusIds: ['dong-hoa'], tuitionProfileId: 'tuition-cs2' },
                    { id: 'toan-ung-dung', name: 'Toán ứng dụng', campusIds: ['dong-hoa'], tuitionProfileId: 'tuition-cs2' },
                    { id: 'khoa-hoc-du-lieu', name: 'Khoa học dữ liệu', campusIds: ['dong-hoa'], tuitionProfileId: 'tuition-cs2' },
                    { id: 'cu-nhan-tai-nang', name: 'Cử nhân tài năng', campusIds: ['cho-quan', 'dong-hoa'], tuitionProfileId: 'tuition-cs2' },
                ],
            },
            {
                id: 'khoa-dia-chat',
                name: 'Khoa Địa chất',
                majors: [
                    { id: 'dia-chat-hoc', name: 'Địa chất học', campusIds: ['dong-hoa'], tuitionProfileId: 'tuition-cs2' },
                    { id: 'ky-thuat-dia-chat', name: 'Kỹ thuật địa chất', campusIds: ['dong-hoa'], tuitionProfileId: 'tuition-cs2' },
                ],
            },
            {
                id: 'khoa-ly',
                name: 'Khoa Vật lý - Vật lý Kỹ thuật',
                majors: [
                    { id: 'vat-ly-hoc', name: 'Vật lý học', campusIds: ['dong-hoa'], tuitionProfileId: 'tuition-cs2' },
                    { id: 'vat-ly-hoc-tang-cuong-tieng-anh', name: 'Vật lý học - Tăng cường tiếng Anh', campusIds: ['cho-quan'], tuitionProfileId: 'tuition-cs1' },
                    { id: 'vat-ly-y-khoa', name: 'Vật lý y khoa', campusIds: ['dong-hoa'], tuitionProfileId: 'tuition-cs2' },
                    { id: 'hai-duong-hoc', name: 'Hải dương học', campusIds: ['dong-hoa'], tuitionProfileId: 'tuition-cs2' },
                    { id: 'ky-thuat-hat-nhan', name: 'Kỹ thuật hạt nhân', campusIds: ['dong-hoa'], tuitionProfileId: 'tuition-cs2' },
                    { id: 'cong-nghe-vat-ly-dien-tu-va-tin-hoc', name: 'CN Vật lý điện tử và tin học', campusIds: ['dong-hoa'], tuitionProfileId: 'tuition-cs2' },
                    { id: 'cong-nghe-ban-dan', name: 'CN Bán dẫn', campusIds: ['dong-hoa'], tuitionProfileId: 'tuition-cs2' },
                ],
            },
            {
                id: 'khoa-hoa',
                name: 'Khoa Hóa học',
                majors: [
                    { id: 'hoa-hoc', name: 'Hóa học', campusIds: ['dong-hoa'], tuitionProfileId: 'tuition-cs2' },
                    { id: 'hoa-hoc-tang-cuong-tieng-anh', name: 'Hóa học - Tăng cường tiếng Anh', campusIds: ['cho-quan'], tuitionProfileId: 'tuition-cs1' },
                    { id: 'cong-nghe-ky-thuat-hoa-hoc-tang-cuong-tieng-anh', name: 'Công nghệ kỹ thuật hóa học - Tăng cường tiếng Anh', campusIds: ['cho-quan'], tuitionProfileId: 'tuition-cs1' },
                    { id: 'cu-nhan-tai-nang', name: 'Cử nhân tài năng ngành hóa học', campusIds: ['cho-quan', 'dong-hoa'], tuitionProfileId: 'tuition-cs2' },
                ],
            },
            {
                id: 'khoa-sinh',
                name: 'Khoa Sinh học - Công nghệ sinh học',
                majors: [
                    { id: 'sinh-hoc', name: 'Sinh học', campusIds: ['dong-hoa'], tuitionProfileId: 'tuition-cs2' },
                    { id: 'sinh-hoc-tang-cuong-tieng-anh', name: 'Sinh học - Tăng cường tiếng Anh', campusIds: ['cho-quan'], tuitionProfileId: 'tuition-cs1' },
                    { id: 'cong-nghe-sinh-hoc', name: 'Công nghệ sinh học', campusIds: ['dong-hoa'], tuitionProfileId: 'tuition-cs2' },
                    { id: 'cong-nghe-sinh-hoc-tang-cuong-tieng-anh', name: 'Công nghệ sinh học - Tăng cường tiếng Anh', campusIds: ['cho-quan'], tuitionProfileId: 'tuition-cs1' },
                ],
            },
            {
                id: 'khoa-moi-truong',
                name: 'Khoa Môi trường',
                majors: [
                    { id: 'cong-nghe-ky-thuat-moi-truong', name: 'Công nghệ kỹ thuật môi trường', campusIds: ['dong-hoa'], tuitionProfileId: 'tuition-cs2' },
                    { id: 'khoa-hoc-moi-truong', name: 'Khoa học môi trường', campusIds: ['dong-hoa'], tuitionProfileId: 'tuition-cs2' },
                    { id: 'khoa-hoc-moi-truong-tang-cuong-tieng-anh', name: 'Khoa học môi trường - Tăng cường tiếng Anh', campusIds: ['cho-quan'], tuitionProfileId: 'tuition-cs1' },
                    { id: 'quan-ly-tai-nguyen-va-moi-truong', name: 'Quản lý tài nguyên và môi trường', campusIds: ['dong-hoa'], tuitionProfileId: 'tuition-cs2' },
                ],
            },
            {
                id: 'khoa-dien-tu-vien-thong',
                name: 'Khoa Điện tử - Viễn thông',
                majors: [
                    { id: 'ky-thuat-dien-tu-vien-thong', name: 'Kỹ thuật Điện tử - Viễn thông', campusIds: ['dong-hoa'], tuitionProfileId: 'tuition-cs2' },
                    { id: 'ky-thuat-dien-tu-vien-thong-tang-cuong-tieng-anh', name: 'Kỹ thuật Điện tử - Viễn thông - Tăng cường tiếng Anh', campusIds: ['cho-quan'], tuitionProfileId: 'tuition-cs1' },
                    { id: 'thiet-ke-vi-mach', name: 'Thiết kế vi mạch', campusIds: ['dong-hoa'], tuitionProfileId: 'tuition-cs2' },
                ],
            },
        ],
    }, {
        cohortId: 'k25',
        label: 'Khóa tuyển 2025',
        defaultProgramDataSource: 'k25',
        faculties: [
            {
                id: 'khoa-cntt',
                name: 'Khoa Công nghệ Thông tin',
                majors: [
                    { id: 'cong-nghe-thong-tin', name: 'Công nghệ Thông tin', campusIds: ['dong-hoa'], tuitionProfileId: 'tuition-cs2' },
                    { id: 'he-thong-thong-tin', name: 'Hệ thống thông tin', campusIds: ['dong-hoa'], tuitionProfileId: 'tuition-cs2' },
                    { id: 'ky-thuat-phan-mem', name: 'Kỹ thuật phần mềm', campusIds: ['dong-hoa'], tuitionProfileId: 'tuition-cs2' },
                    { id: 'khoa-hoc-may-tinh', name: 'Khoa học máy tính', campusIds: ['dong-hoa'], tuitionProfileId: 'tuition-cs2' },
                    { id: 'khoa-hoc-may-tinh-tien-tien', name: 'Khoa học máy tính - Tiên tiến', campusIds: ['cho-quan'], tuitionProfileId: 'tuition-cs1', dataSourceCohort: 'k24' },
                    { id: 'cong-nghe-thong-tin-tang-cuong-tieng-anh', name: 'Công nghệ thông tin - Tăng cường tiếng Anh', campusIds: ['cho-quan'], tuitionProfileId: 'tuition-cs1', dataSourceCohort: 'k24' },
                    { id: 'tri-tue-nhan-tao', name: 'Trí tuệ nhân tạo', campusIds: ['dong-hoa'], tuitionProfileId: 'tuition-cs2' },
                    { id: 'cu-nhan-tai-nang', name: 'Cử nhân tài năng', campusIds: ['cho-quan', 'dong-hoa'], tuitionProfileId: 'tuition-cs2' },
                ],
            },
            {
                id: 'khoa-khoa-hoc-va-cong-nghe-vat-lieu',
                name: 'Khoa Khoa học và Công nghệ Vật liệu',
                majors: [
                    { id: 'khoa-hoc-vat-lieu', name: 'Khoa học vật liệu', dataSourceCohort: 'k24', campusIds: ['dong-hoa'], tuitionProfileId: 'tuition-cs2' },
                    { id: 'khoa-hoc-vat-lieu-tang-cuong-tieng-anh', name: 'Khoa học vật liệu - Tăng cường tiếng Anh', campusIds: ['cho-quan'], tuitionProfileId: 'tuition-cs1', dataSourceCohort: 'k24' },
                    { id: 'cong-nghe-vat-lieu', name: 'Công nghệ vật liệu', dataSourceCohort: 'k24', campusIds: ['dong-hoa'], tuitionProfileId: 'tuition-cs2' },
                ],
            },
            {
                id: 'khoa-toan',
                name: 'Khoa Toán - Tin học',
                majors: [
                    { id: 'toan-hoc', name: 'Toán học', campusIds: ['dong-hoa'], tuitionProfileId: 'tuition-cs2' },
                    { id: 'toan-tin', name: 'Toán - Tin', campusIds: ['dong-hoa'], tuitionProfileId: 'tuition-cs2' },
                    { id: 'toan-ung-dung', name: 'Toán ứng dụng', campusIds: ['dong-hoa'], tuitionProfileId: 'tuition-cs2' },
                    { id: 'khoa-hoc-du-lieu', name: 'Khoa học dữ liệu', campusIds: ['dong-hoa'], tuitionProfileId: 'tuition-cs2' },
                    { id: 'cu-nhan-tai-nang', name: 'Cử nhân tài năng', campusIds: ['cho-quan', 'dong-hoa'], tuitionProfileId: 'tuition-cs2' },
                    { id: 'thong-ke', name: 'Thống kê', campusIds: ['dong-hoa'], tuitionProfileId: 'tuition-cs2' },
                ],
            },
            {
                id: 'khoa-dia-chat',
                name: 'Khoa Địa chất',
                majors: [
                    { id: 'dia-chat-hoc', name: 'Địa chất học', campusIds: ['dong-hoa'], tuitionProfileId: 'tuition-cs2' },
                    { id: 'ky-thuat-dia-chat', name: 'Kỹ thuật địa chất', campusIds: ['dong-hoa'], tuitionProfileId: 'tuition-cs2' },
                    { id: 'kinh-te-dat-dai', name: 'Kinh tế đất đai', campusIds: ['dong-hoa'], tuitionProfileId: 'tuition-cs2' },
                ],
            },
            {
                id: 'khoa-ly',
                name: 'Khoa Vật lý - Vật lý Kỹ thuật',
                majors: [
                    { id: 'vat-ly-hoc', name: 'Vật lý học', campusIds: ['dong-hoa'], tuitionProfileId: 'tuition-cs2' },
                    { id: 'vat-ly-hoc-tang-cuong-tieng-anh', name: 'Vật lý học - Tăng cường tiếng Anh', campusIds: ['cho-quan'], tuitionProfileId: 'tuition-cs1', dataSourceCohort: 'k24' },
                    { id: 'cu-nhan-tai-nang-vat-ly-hoc', name: 'cử nhân tài năng vật lý học', campusIds: ['cho-quan', 'dong-hoa'], tuitionProfileId: 'tuition-cs2' },
                    { id: 'vat-ly-y-khoa', name: 'Vật lý y khoa', campusIds: ['dong-hoa'], tuitionProfileId: 'tuition-cs2' },
                    { id: 'hai-duong-hoc', name: 'Hải dương học', campusIds: ['dong-hoa'], tuitionProfileId: 'tuition-cs2' },
                    { id: 'ky-thuat-hat-nhan', name: 'Kỹ thuật hạt nhân', campusIds: ['dong-hoa'], tuitionProfileId: 'tuition-cs2' },
                    { id: 'cong-nghe-vat-ly-dien-tu-va-tin-hoc', name: 'CN Vật lý điện tử và tin học', campusIds: ['dong-hoa'], tuitionProfileId: 'tuition-cs2' },
                    { id: 'cong-nghe-ban-dan', name: 'CN Bán dẫn', campusIds: ['dong-hoa'], tuitionProfileId: 'tuition-cs2' },
                ],
            },
            {
                id: 'khoa-hoa',
                name: 'Khoa Hóa học',
                majors: [
                    { id: 'hoa-hoc', name: 'Hóa học', dataSourceCohort: 'k24', campusIds: ['dong-hoa'], tuitionProfileId: 'tuition-cs2' },
                    { id: 'hoa-hoc-tang-cuong-tieng-anh', name: 'Hóa học - Tăng cường tiếng Anh', campusIds: ['cho-quan'], tuitionProfileId: 'tuition-cs1', dataSourceCohort: 'k24' },
                    { id: 'cong-nghe-ky-thuat-hoa-hoc-tang-cuong-tieng-anh', name: 'Công nghệ kỹ thuật hóa học - Tăng cường tiếng Anh', campusIds: ['cho-quan'], tuitionProfileId: 'tuition-cs1', dataSourceCohort: 'k24' },
                    { id: 'cu-nhan-tai-nang', name: 'Cử nhân tài năng ngành hóa học', campusIds: ['cho-quan', 'dong-hoa'], tuitionProfileId: 'tuition-cs2' },
                ],
            },
            {
                id: 'khoa-sinh',
                name: 'Khoa Sinh học - Công nghệ sinh học',
                majors: [
                    { id: 'sinh-hoc', name: 'Sinh học', campusIds: ['dong-hoa'], tuitionProfileId: 'tuition-cs2' },
                    { id: 'sinh-hoc-tang-cuong-tieng-anh', name: 'Sinh học - Tăng cường tiếng Anh', campusIds: ['cho-quan'], tuitionProfileId: 'tuition-cs1', dataSourceCohort: 'k24' },
                    { id: 'cong-nghe-sinh-hoc', name: 'Công nghệ sinh học', campusIds: ['dong-hoa'], tuitionProfileId: 'tuition-cs2' },
                    { id: 'cong-nghe-sinh-hoc-tang-cuong-tieng-anh', name: 'Công nghệ sinh học - Tăng cường tiếng Anh', campusIds: ['cho-quan'], tuitionProfileId: 'tuition-cs1', dataSourceCohort: 'k24' },
                ],
            },
            {
                id: 'khoa-moi-truong',
                name: 'Khoa Môi trường',
                majors: [
                    { id: 'cong-nghe-ky-thuat-moi-truong', name: 'Công nghệ kỹ thuật môi trường', campusIds: ['dong-hoa'], tuitionProfileId: 'tuition-cs2' },
                    { id: 'khoa-hoc-moi-truong', name: 'Khoa học môi trường', campusIds: ['dong-hoa'], tuitionProfileId: 'tuition-cs2' },
                    { id: 'khoa-hoc-moi-truong-tang-cuong-tieng-anh', name: 'Khoa học môi trường - Tăng cường tiếng Anh', campusIds: ['cho-quan'], tuitionProfileId: 'tuition-cs1', dataSourceCohort: 'k24' },
                    { id: 'quan-ly-tai-nguyen-va-moi-truong', name: 'Quản lý tài nguyên và môi trường', campusIds: ['dong-hoa'], tuitionProfileId: 'tuition-cs2' },
                ],
            },
            {
                id: 'khoa-dien-tu-vien-thong',
                name: 'Khoa Điện tử - Viễn thông',
                majors: [
                    { id: 'ky-thuat-dien-tu-vien-thong', name: 'Kỹ thuật Điện tử - Viễn thông', campusIds: ['dong-hoa'], tuitionProfileId: 'tuition-cs2' },
                    { id: 'ky-thuat-dien-tu-vien-thong-tang-cuong-tieng-anh', name: 'Kỹ thuật Điện tử - Viễn thông - Tăng cường tiếng Anh', campusIds: ['cho-quan'], tuitionProfileId: 'tuition-cs1', dataSourceCohort: 'k24' },
                    { id: 'thiet-ke-vi-mach', name: 'Thiết kế vi mạch', campusIds: ['dong-hoa'], tuitionProfileId: 'tuition-cs2' },
                ],
            },
            {
                id: 'khoa-lien-nganh',
                name: 'Khoa Liên ngành',
                majors: [{ id: 'cong-nghe-giao-duc', name: 'Công nghệ giáo dục', campusIds: ['dong-hoa'], tuitionProfileId: 'tuition-cs2' }],
            },
        ],
    }, {
        cohortId: 'k26',
        label: 'Khóa tuyển 2026',
        defaultProgramDataSource: 'k25',
        faculties: [
            {
                id: 'khoa-cntt',
                name: 'Khoa Công nghệ Thông tin',
                majors: [
                    { id: 'cong-nghe-thong-tin', name: 'Công nghệ Thông tin', campusIds: ['dong-hoa'], tuitionProfileId: 'tuition-cs2' },
                    { id: 'he-thong-thong-tin', name: 'Hệ thống thông tin', campusIds: ['dong-hoa'], tuitionProfileId: 'tuition-cs2' },
                    { id: 'ky-thuat-phan-mem', name: 'Kỹ thuật phần mềm', campusIds: ['dong-hoa'], tuitionProfileId: 'tuition-cs2' },
                    { id: 'khoa-hoc-may-tinh', name: 'Khoa học máy tính', campusIds: ['dong-hoa'], tuitionProfileId: 'tuition-cs2' },
                    { id: 'khoa-hoc-may-tinh-tien-tien', name: 'Khoa học máy tính - Tiên tiến', campusIds: ['cho-quan'], tuitionProfileId: 'tuition-cs1', dataSourceCohort: 'k24' },
                    { id: 'cong-nghe-thong-tin-tang-cuong-tieng-anh', name: 'Công nghệ thông tin - Tăng cường tiếng Anh', campusIds: ['cho-quan'], tuitionProfileId: 'tuition-cs1', dataSourceCohort: 'k24' },
                    { id: 'tri-tue-nhan-tao', name: 'Trí tuệ nhân tạo', campusIds: ['dong-hoa'], tuitionProfileId: 'tuition-cs2' },
                    { id: 'cu-nhan-tai-nang', name: 'Cử nhân tài năng', campusIds: ['cho-quan', 'dong-hoa'], tuitionProfileId: 'tuition-cs2' },
                ],
            },
            {
                id: 'khoa-khoa-hoc-va-cong-nghe-vat-lieu',
                name: 'Khoa Khoa học và Công nghệ Vật liệu',
                majors: [
                    { id: 'khoa-hoc-vat-lieu', name: 'Khoa học vật liệu', dataSourceCohort: 'k24', campusIds: ['dong-hoa'], tuitionProfileId: 'tuition-cs2' },
                    { id: 'khoa-hoc-vat-lieu-tang-cuong-tieng-anh', name: 'Khoa học vật liệu - Tăng cường tiếng Anh', campusIds: ['cho-quan'], tuitionProfileId: 'tuition-cs1', dataSourceCohort: 'k24' },
                    { id: 'cong-nghe-vat-lieu', name: 'Công nghệ vật liệu', dataSourceCohort: 'k24', campusIds: ['dong-hoa'], tuitionProfileId: 'tuition-cs2' },
                ],
            },
            {
                id: 'khoa-toan',
                name: 'Khoa Toán - Tin học',
                majors: [
                    { id: 'toan-hoc', name: 'Toán học', campusIds: ['dong-hoa'], tuitionProfileId: 'tuition-cs2' }, // dataSourceCohort: 'k26' },
                    { id: 'toan-tin', name: 'Toán - Tin', campusIds: ['dong-hoa'], tuitionProfileId: 'tuition-cs2' }, // dataSourceCohort: 'k26' },
                    { id: 'toan-ung-dung', name: 'Toán ứng dụng', campusIds: ['dong-hoa'], tuitionProfileId: 'tuition-cs2' }, // dataSourceCohort: 'k26' },
                    { id: 'khoa-hoc-du-lieu', name: 'Khoa học dữ liệu', campusIds: ['dong-hoa'], tuitionProfileId: 'tuition-cs2' }, // dataSourceCohort: 'k26' },
                    { id: 'cu-nhan-tai-nang', name: 'Cử nhân tài năng', campusIds: ['cho-quan', 'dong-hoa'], tuitionProfileId: 'tuition-cs2' },
                    { id: 'thong-ke', name: 'Thống kê', campusIds: ['dong-hoa'], tuitionProfileId: 'tuition-cs2' }, // dataSourceCohort: 'k26' },
                ],
            },
            {
                id: 'khoa-dia-chat',
                name: 'Khoa Địa chất',
                majors: [
                    { id: 'dia-chat-hoc', name: 'Địa chất học', campusIds: ['dong-hoa'], tuitionProfileId: 'tuition-cs2' },
                    { id: 'ky-thuat-dia-chat', name: 'Kỹ thuật địa chất', campusIds: ['dong-hoa'], tuitionProfileId: 'tuition-cs2' },
                    { id: 'kinh-te-dat-dai', name: 'Kinh tế đất đai', campusIds: ['dong-hoa'], tuitionProfileId: 'tuition-cs2' },
                ],
            },
            {
                id: 'khoa-ly',
                name: 'Khoa Vật lý - Vật lý Kỹ thuật',
                majors: [
                    { id: 'vat-ly-hoc', name: 'Vật lý học', campusIds: ['dong-hoa'], tuitionProfileId: 'tuition-cs2' },
                    { id: 'vat-ly-hoc-tang-cuong-tieng-anh', name: 'Vật lý học - Tăng cường tiếng Anh', campusIds: ['cho-quan'], tuitionProfileId: 'tuition-cs1', dataSourceCohort: 'k24' },
                    { id: 'vat-ly-y-khoa', name: 'Vật lý y khoa', campusIds: ['dong-hoa'], tuitionProfileId: 'tuition-cs2' },
                    { id: 'hai-duong-hoc', name: 'Hải dương học', campusIds: ['dong-hoa'], tuitionProfileId: 'tuition-cs2' },
                    { id: 'ky-thuat-hat-nhan', name: 'Kỹ thuật hạt nhân', campusIds: ['dong-hoa'], tuitionProfileId: 'tuition-cs2' },
                    { id: 'cong-nghe-vat-ly-dien-tu-va-tin-hoc', name: 'CN Vật lý điện tử và tin học', campusIds: ['dong-hoa'], tuitionProfileId: 'tuition-cs2' },
                    { id: 'cong-nghe-ban-dan', name: 'CN Bán dẫn', campusIds: ['dong-hoa'], tuitionProfileId: 'tuition-cs2' },
                ],
            },
            {
                id: 'khoa-hoa',
                name: 'Khoa Hóa học',
                majors: [
                    { id: 'hoa-hoc', name: 'Hóa học', dataSourceCohort: 'k24', campusIds: ['dong-hoa'], tuitionProfileId: 'tuition-cs2' },
                    { id: 'hoa-hoc-tang-cuong-tieng-anh', name: 'Hóa học - Tăng cường tiếng Anh', campusIds: ['cho-quan'], tuitionProfileId: 'tuition-cs1', dataSourceCohort: 'k24' },
                    { id: 'cong-nghe-ky-thuat-hoa-hoc-tang-cuong-tieng-anh', name: 'Công nghệ kỹ thuật hóa học - Tăng cường tiếng Anh', campusIds: ['cho-quan'], tuitionProfileId: 'tuition-cs1', dataSourceCohort: 'k24' },
                    { id: 'cu-nhan-tai-nang', name: 'Cử nhân tài năng ngành hóa học', campusIds: ['cho-quan', 'dong-hoa'], tuitionProfileId: 'tuition-cs2' },
                ],
            },
            {
                id: 'khoa-sinh',
                name: 'Khoa Sinh học - Công nghệ sinh học',
                majors: [
                    { id: 'sinh-hoc', name: 'Sinh học', campusIds: ['dong-hoa'], tuitionProfileId: 'tuition-cs2' },
                    { id: 'sinh-hoc-tang-cuong-tieng-anh', name: 'Sinh học - Tăng cường tiếng Anh', campusIds: ['cho-quan'], tuitionProfileId: 'tuition-cs1', dataSourceCohort: 'k24' },
                    { id: 'cong-nghe-sinh-hoc', name: 'Công nghệ sinh học', campusIds: ['dong-hoa'], tuitionProfileId: 'tuition-cs2' },
                    { id: 'cong-nghe-sinh-hoc-tang-cuong-tieng-anh', name: 'Công nghệ sinh học - Tăng cường tiếng Anh', campusIds: ['cho-quan'], tuitionProfileId: 'tuition-cs1', dataSourceCohort: 'k24' },
                ],
            },
            {
                id: 'khoa-moi-truong',
                name: 'Khoa Môi trường',
                majors: [
                    { id: 'cong-nghe-ky-thuat-moi-truong', name: 'Công nghệ kỹ thuật môi trường', campusIds: ['dong-hoa'], tuitionProfileId: 'tuition-cs2' },
                    { id: 'khoa-hoc-moi-truong', name: 'Khoa học môi trường', campusIds: ['dong-hoa'], tuitionProfileId: 'tuition-cs2' },
                    { id: 'khoa-hoc-moi-truong-tang-cuong-tieng-anh', name: 'Khoa học môi trường - Tăng cường tiếng Anh', campusIds: ['cho-quan'], tuitionProfileId: 'tuition-cs1', dataSourceCohort: 'k24' },
                    { id: 'quan-ly-tai-nguyen-va-moi-truong', name: 'Quản lý tài nguyên và môi trường', campusIds: ['dong-hoa'], tuitionProfileId: 'tuition-cs2' },
                ],
            },
            {
                id: 'khoa-dien-tu-vien-thong',
                name: 'Khoa Điện tử - Viễn thông',
                majors: [
                    { id: 'ky-thuat-dien-tu-vien-thong', name: 'Kỹ thuật Điện tử - Viễn thông', campusIds: ['dong-hoa'], tuitionProfileId: 'tuition-cs2' },
                    { id: 'ky-thuat-dien-tu-vien-thong-tang-cuong-tieng-anh', name: 'Kỹ thuật Điện tử - Viễn thông - Tăng cường tiếng Anh', campusIds: ['cho-quan'], tuitionProfileId: 'tuition-cs1', dataSourceCohort: 'k24' },
                    { id: 'thiet-ke-vi-mach', name: 'Thiết kế vi mạch', campusIds: ['dong-hoa'], tuitionProfileId: 'tuition-cs2' },
                ],
            },
            {
                id: 'khoa-lien-nganh',
                name: 'Khoa Liên ngành',
                majors: [{ id: 'cong-nghe-giao-duc', name: 'Công nghệ giáo dục', campusIds: ['dong-hoa'], tuitionProfileId: 'tuition-cs2' }],
            },
        ],
    },
];

function normalizeMajorDefinition(major: CohortMajorDefinition): CohortMajorInfo {
    return {
        ...major,
        campusIds: [...major.campusIds],
    };
}

export const ACADEMIC_YEAR_MAJOR_CATALOGS: AcademicYearMajorCatalog[] =
    ACADEMIC_YEAR_MAJOR_CATALOG_DEFINITIONS.map((catalog) => ({
        ...catalog,
        faculties: catalog.faculties.map((faculty) => ({
            ...faculty,
            majors: faculty.majors.map(normalizeMajorDefinition),
        })),
    }));

export const COHORTS: CohortInfo[] = ACADEMIC_YEAR_MAJOR_CATALOGS.map(({ cohortId, label }) => ({
    id: cohortId,
    name: label,
}));

/** Lop tuong thich cho cac tab cu dang can tra nguoc theo khoa/nganh. */
export const FACULTIES: FacultyInfo[] = (() => {
    const facultyMap = new Map<string, FacultyInfo>();

    ACADEMIC_YEAR_MAJOR_CATALOGS.forEach((catalog) => {
        catalog.faculties.forEach((catalogFaculty) => {
            let faculty = facultyMap.get(catalogFaculty.id);
            if (!faculty) {
                faculty = { id: catalogFaculty.id, name: catalogFaculty.name, majors: [] };
                facultyMap.set(catalogFaculty.id, faculty);
            }

            catalogFaculty.majors.forEach((catalogMajor) => {
                let major = faculty.majors.find((item) => item.id === catalogMajor.id);
                if (!major) {
                    major = {
                        id: catalogMajor.id,
                        name: catalogMajor.name,
                        cohorts: [],
                        campusIdsByCohort: {},
                        tuitionProfileId: catalogMajor.tuitionProfileId,
                    };
                    faculty.majors.push(major);
                }

                if (major.tuitionProfileId !== catalogMajor.tuitionProfileId) {
                    throw new Error(`Ngành ${catalogFaculty.id}/${catalogMajor.id} có nhiều nhóm học phí khác nhau giữa các khóa.`);
                }

                major.cohorts.push({ id: catalog.cohortId, name: catalog.label });
                major.campusIdsByCohort[catalog.cohortId] = [...catalogMajor.campusIds];
                const sourceCohort = catalogMajor.dataSourceCohort ?? catalog.defaultProgramDataSource;
                if (sourceCohort && sourceCohort !== catalog.cohortId) {
                    major.dataSource = { ...major.dataSource, [catalog.cohortId]: sourceCohort };
                }
            });
        });
    });

    return [...facultyMap.values()];
})();

export function getAcademicYearMajorCatalog(cohortId: string) {
    return ACADEMIC_YEAR_MAJOR_CATALOGS.find((catalog) => catalog.cohortId === cohortId);
}

export function getProgramDataSourceCohort(cohortId: string, facultyId?: string, majorId?: string) {
    if (facultyId && majorId) return resolveDataCohort(facultyId, majorId, cohortId);
    return getAcademicYearMajorCatalog(cohortId)?.defaultProgramDataSource;
}

export function getFacultiesForCohort(cohortId: string, campusId?: CampusId): CohortFacultyInfo[] {
    const faculties = getAcademicYearMajorCatalog(cohortId)?.faculties ?? [];
    if (!campusId) return faculties;

    return faculties.flatMap((faculty) => {
        const majors = faculty.majors.filter((major) => major.campusIds.includes(campusId));
        return majors.length > 0 ? [{ ...faculty, majors }] : [];
    });
}

export function getMajorsForCohort(facultyId: string, cohortId: string, campusId?: CampusId): CohortMajorInfo[] {
    return getFacultiesForCohort(cohortId, campusId).find((faculty) => faculty.id === facultyId)?.majors ?? [];
}

export function getProgramOffering(facultyId: string, majorId: string, cohortId: string): CohortMajorInfo | null {
    return getMajorsForCohort(facultyId, cohortId).find((major) => major.id === majorId) ?? null;
}

export function isProgramAvailableAtCampus(
    facultyId: string,
    majorId: string,
    cohortId: string,
    campusId: CampusId,
): boolean {
    return getProgramOffering(facultyId, majorId, cohortId)?.campusIds.includes(campusId) ?? false;
}

export function getProgramTuitionProfileId(
    facultyId: string,
    majorId: string,
    cohortId: string,
): TuitionProfileId {
    return getProgramOffering(facultyId, majorId, cohortId)?.tuitionProfileId ?? DEFAULT_TUITION_PROFILE_ID;
}

export const DEFAULT_FACULTY_ID = 'khoa-cntt';
export const DEFAULT_MAJOR_ID = 'cong-nghe-thong-tin';
export const DEFAULT_COHORT_ID = 'k24';

export function resolveDataCohort(facultyId: string, majorId: string, cohortId: string): string {
    const faculty = FACULTIES.find((item) => item.id === facultyId);
    const major = faculty?.majors.find((item) => item.id === majorId);
    return major?.dataSource?.[cohortId] ?? cohortId;
}

/** Tuition duoc load rieng theo nam hoc trong assets/data/tuition. */
export async function loadCohortData(facultyId: string, majorId: string, cohortId: string) {
    const sourceCohort = resolveDataCohort(facultyId, majorId, cohortId);

    const [coursesModule, prerequisitesModule, categoriesModule] = await Promise.all([
        import(`./${facultyId}/${majorId}/${sourceCohort}/courses.ts`),
        import(`./${facultyId}/${majorId}/${sourceCohort}/prerequisites.ts`)
            .catch(() => ({ prerequisites: [] })),
        import(`./${facultyId}/${majorId}/${sourceCohort}/categories.ts`),
    ]);

    return {
        courses: coursesModule.courses,
        prerequisites: prerequisitesModule.prerequisites,
        categories: categoriesModule.categories,
    };
}

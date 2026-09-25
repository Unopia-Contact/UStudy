import { STORAGE_KEYS } from '../../../config';
import { readFromStorage } from '../../../helpers/localStorage/save';
import { AcademicRulesEngine } from '../../grades';
import type { ScheduleSession } from '../../visual-schedule';
import {
  getProgramCategoryCreditProgress,
  getRequiredCredits,
} from '../../../features/study-plan/credit-progress.ts';


export interface CreditDistributionItem {
  key: string;
  name: string;
  credits: number;
  requiredCredits: number;
  color: string;
}

export interface CreditDistributionItem {
  key: string;
  name: string;
  credits: number;
  requiredCredits: number;
  color: string;
}

type CategoryNode = {
  name?: string;

  courses?: string[];

  // dữ liệu mà rule engine sử dụng
  coursesData?: any[];
  allCoursesData?: any[];

  breakdown?: Record<string, CategoryNode>;
  options?: CategoryNode[];

  total_credits_required?: number;
  credits?: number;
  credits_required?: number;

  selection_mode?: string;
  selectionMode?: string;

  category_role?: string;
  categoryRole?: string;

  include_in_parent_total?: boolean;
  includeInParentTotal?: boolean;
};

const CHART_COLORS = [
  '#004A98',
  '#16A34A',
  '#F59E0B',
  '#7C3AED',
  '#DC2626',
  '#0891B2',
];

function normalizeCourseId(value: unknown): string {
  return String(value || '')
    .trim()
    .toUpperCase();
}

/**
 * Tạo danh sách các môn THỰC SỰ được tính.
 *
 * Chỉ lấy:
 * - có trong bảng điểm
 * - effective grade
 * - status === passed
 * - có số tín chỉ > 0
 *
 * Không lấy:
 * - studying
 * - planned
 * - chưa có điểm
 * - failed
 */
function buildPassedCourseMap(
  rawGrades: any[],
  allCoursesMeta: any[],
): Map<string, any> {
  const result = new Map<string, any>();

  const hasBLMExemption =
    AcademicRulesEngine.checkBLMExemption(rawGrades);

  const effectiveGrades =
    AcademicRulesEngine.resolveEffectiveGrades(rawGrades);

  effectiveGrades.forEach((grade: any) => {
    const courseId = normalizeCourseId(grade.id);

    if (!courseId) {
      return;
    }

    const status = AcademicRulesEngine.getCourseStatus(
      courseId,
      rawGrades,
      hasBLMExemption,
    );

    const meta = allCoursesMeta.find(
      (course: any) =>
        normalizeCourseId(course.course_id) === courseId,
    );

    const credits =
      Number.parseInt(
        String(grade.credits || meta?.credits || 0),
        10,
      ) || 0;

    /*
     * QUAN TRỌNG:
     *
     * studying = chưa có điểm
     * failed   = có điểm nhưng không đạt
     *
     * Distribution này chỉ tính tín chỉ ĐÃ ĐẠT.
     */
    if (status !== 'passed') {
      return;
    }

    if (credits <= 0) {
      return;
    }

    /*
     * Ép status = passed.
     *
     * Như vậy khi đưa vào credit-rule:
     * getCoursePlanCredits() chỉ sinh earnedCredits,
     * tuyệt đối không sinh plannedCredits.
     */
    result.set(courseId, {
      ...meta,

      course_id: courseId,

      credits,

      status: 'passed',
    });

  });

  return result;
}

/**
 * Lấy danh sách course id vốn thuộc node.
 *
 * Giữ đúng priority của rule:
 *
 * allCoursesData
 * ↓
 * coursesData
 * ↓
 * courses
 */
function getNodeCourseIds(node: CategoryNode): string[] {
  if (Array.isArray(node.allCoursesData)) {
    return node.allCoursesData
      .map((course: any) =>
        normalizeCourseId(course.course_id),
      )
      .filter(Boolean);
  }

  if (Array.isArray(node.coursesData)) {
    return node.coursesData
      .map((course: any) =>
        normalizeCourseId(course.course_id),
      )
      .filter(Boolean);
  }

  return (node.courses || [])
    .map(normalizeCourseId)
    .filter(Boolean);
}

/**
 * Clone cây CTĐT nhưng chỉ giữ những môn ĐÃ PASS.
 *
 * Đây là bước khiến các môn:
 *
 * studying
 * planned
 * chưa có điểm
 *
 * hoàn toàn biến mất trước khi credit-rule chạy.
 */
function buildPassedOnlyCategoryTree(
  node: CategoryNode,
  passedCourseMap: Map<string, any>,
): CategoryNode {
  const courseIds = getNodeCourseIds(node);

  const passedCourses = courseIds
    .map((courseId) => passedCourseMap.get(courseId))
    .filter(Boolean);

  const breakdown = node.breakdown
    ? Object.fromEntries(
        Object.entries(node.breakdown).map(
          ([key, child]) => [
            key,
            buildPassedOnlyCategoryTree(
              child,
              passedCourseMap,
            ),
          ],
        ),
      )
    : undefined;

  const options = Array.isArray(node.options)
    ? node.options.map((option) =>
        buildPassedOnlyCategoryTree(
          option,
          passedCourseMap,
        ),
      )
    : undefined;

  /*
   * Rule ưu tiên:
   *
   * allCoursesData || coursesData
   *
   * nên phải lọc cả hai nếu chúng tồn tại.
   */
  return {
    ...node,

    ...(Array.isArray(node.allCoursesData)
      ? {
          allCoursesData: passedCourses,
        }
      : {
          coursesData: passedCourses,
        }),

    ...(Array.isArray(node.coursesData)
      ? {
          coursesData: passedCourses,
        }
      : {}),

    breakdown,
    options,
  };
}

export function buildCreditDistribution(
  categories: Record<string, CategoryNode>,
  allCoursesMeta: any[],
): CreditDistributionItem[] {
  const studentDb = readFromStorage<any>(
    STORAGE_KEYS.STUDENT_DB,
    null,
  );

  const rawGrades = Array.isArray(studentDb?.grades)
    ? studentDb.grades
    : [];

  if (rawGrades.length === 0) {
    return [];
  }

  /*
   * 1. Chỉ lấy môn đã pass.
   *
   * => studying / chưa điểm không vào đây.
   */
  const passedCourseMap = buildPassedCourseMap(
    rawGrades,
    allCoursesMeta,
  );

  /*
   * 2. Tạo lại cây CTĐT chỉ với các môn đã pass.
   */
  const passedOnlyCategories =
    Object.fromEntries(
      Object.entries(categories || {}).map(
        ([key, category]) => [
          key,
          buildPassedOnlyCategoryTree(
            category,
            passedCourseMap,
          ),
        ],
      ),
    );

  /*
   * 3. Không có manually planned course.
   *
   * Rule gốc hỗ trợ plannedCredits,
   * nhưng chart này chỉ quan tâm tín chỉ đã đạt.
   */
  const manuallyPlannedCourseIds =
    new Set<string>();

  /*
   * 4. Cho RULE ENGINE thật sự tính.
   *
   * Nó sẽ tự xử lý:
   *
   * - duplicate course
   * - breakdown
   * - specialization
   * - selection_mode = one
   * - options
   * - include_in_parent_total
   * - course excluded
   * - category excluded
   * - cap GENERAL_EDUCATION
   */
  const progressByCategory =
    getProgramCategoryCreditProgress(
      passedOnlyCategories,
      manuallyPlannedCourseIds,
    );

  /*
   * 5. Chuyển kết quả rule → dữ liệu chart.
   */
  const result = Object.entries(
    passedOnlyCategories,
  )
    .filter(
      ([key]) =>
        key !== 'MASTER_TRANSITION',
    )
    .map(([key, category], index) => {
      const progress =
        progressByCategory[key];

      /*
       * Dùng contribution, KHÔNG dùng display.
       *
       * Vì contribution đã loại:
       * - course excluded from accumulation
       * - category excluded from accumulation
       *
       * đúng rule.
       */
      const credits =
        progress?.contribution
          .earnedCredits || 0;

      return {
        key,

        name:
          category.name || key,

        credits,

        requiredCredits:
          getRequiredCredits(category),

        color:
          CHART_COLORS[
            index %
              CHART_COLORS.length
          ],
      };
    });

  return result;
}

export function getTodayScheduleSessions(sessions: ScheduleSession[], now = new Date()) {
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  const jsDay = today.getDay();
  const portalDay = (jsDay === 0 ? 8 : jsDay + 1) as ScheduleSession['dayOfWeek'];

  return sessions
    .filter((session) => session.dayOfWeek === portalDay)
    .filter((session) => {
      if (!session.startDateParsed || !session.endDateParsed) return true;

      const start = new Date(session.startDateParsed);
      const end = new Date(session.endDateParsed);
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      return today >= start && today <= end;
    })
    .sort((a, b) => a.startPeriod - b.startPeriod);
}

export function summarizeTodaySessions(sessions: ScheduleSession[]) {
  return {
    totalSessions: sessions.length,
    totalPeriods: sessions.reduce((sum, session) => sum + session.duration, 0),
    nextSession: sessions.find((session) => {
      const [hour, minute] = session.startTime.split(':').map(Number);
      const start = new Date();
      start.setHours(hour || 0, minute || 0, 0, 0);
      return start.getTime() >= Date.now();
    }) || null,
  };
}

export function getDistributionTotal(items: CreditDistributionItem[]) {
  return items.reduce((sum, item) => sum + item.credits, 0);
}

export function getDistributionCompletionPercent(items: CreditDistributionItem[], totalRequiredCredits: number) {
    const total = getDistributionTotal(items);
    return totalRequiredCredits > 0
        ? Math.min(100, Math.round((total / totalRequiredCredits) * 100))
        : 0;
}

// CourseDetailCard.tsx
import { type ScheduleSession } from '../types';
import type { OpenClassDetailTarget } from '../../../components/course';
import { RoomMapLink } from './RoomMapLink';

const colorClasses = {
    blue: 'border-l-blue-600',
    green: 'border-l-green-600',
    yellow: 'border-l-yellow-600',
    purple: 'border-l-purple-600',
};

const typeLabels = { LT: 'Lý thuyết', TH: 'Thực hành', BT: 'Bài tập' };

export function CourseDetailCard({ session, onOpenClassDetails }: { session: ScheduleSession; onOpenClassDetails?: (target: OpenClassDetailTarget) => void }) {
    return (
        <div className={`mb-3 w-full rounded-lg border border-gray-200 border-l-4 ${colorClasses[session.color as keyof typeof colorClasses]} bg-white p-4 text-left`}>
            <div className="flex items-start gap-3">
                <div className="flex-1">
                    <h4 className="text-sm font-semibold text-gray-900 mb-2">
                        {onOpenClassDetails ? <button type="button" className="text-left hover:text-blue-700 hover:underline"
                            onClick={() => onOpenClassDetails({ courseCode: session.courseCode, courseName: session.courseName, classId: session.classCode })}>
                            {session.courseCode} - {session.courseName}
                        </button> : <>{session.courseCode} - {session.courseName}</>}
                    </h4>
                    <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                        <div>
                            • {session.credits} TC | {typeLabels[session.type]}
                        </div>

                        <RoomMapLink session={session} variant="campus" />

                        {session.totalWeeks > 0 && (
                            <div>
                                • Học từ: {session.startDate} - {session.endDate} ({session.totalWeeks} tuần)
                            </div>
                        )}

                        <div>
                            • Lớp: {session.classCode}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

import { useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { AppSelect } from '../../../components/ui/form';
import { RoadmapDialog } from '../../study-roadmap/components/RoadmapDialog';
import { CourseSharingEditor } from './CourseSharingEditor';
import type { ClassPreferenceLevel, ClassPreferenceSelection, CourseSharingRule, GroupMemberToken } from '../types';

interface Props {
    courseId: string;
    courseName: string;
    subscribers: number[];
    members: GroupMemberToken[];
    classes: Array<{ id: string; schedule: string[] }>;
    selection?: ClassPreferenceSelection;
    target: string;
    targets: Array<{ id: string; name: string }>;
    onTargetChange: (target: string) => void;
    getLevel: (classId: string) => ClassPreferenceLevel | null;
    onLevelChange: (classId: string, level: ClassPreferenceLevel | null) => void;
    onClear: () => void;
    sharing?: CourseSharingRule;
    onSharingChange: (rule: CourseSharingRule) => void;
}

function preferenceSummary(selection?: ClassPreferenceSelection) {
    return [
        selection?.excluded?.length ? `${selection.excluded.length} cấm` : '',
        selection?.preferred?.length ? `${selection.preferred.length} ưu tiên` : '',
        selection?.required?.length ? `${selection.required.length} bắt buộc` : '',
    ].filter(Boolean).join(' · ');
}

export function GroupCoursePreferences(props: Props) {
    const { courseId, courseName, subscribers, members, classes, selection, target, targets, onTargetChange, getLevel, onLevelChange, onClear, sharing, onSharingChange } = props;
    const [editor, setEditor] = useState<'classes' | 'groups' | null>(null);
    const summary = preferenceSummary(selection);
    const groups = sharing?.groups?.filter((group) => group.some((id) => subscribers.includes(id)));
    const soloCount = groups ? subscribers.filter((id) => !groups.some((group) => group.includes(id))).length : 0;
    const groupSummary = sharing?.mode === 'independent' ? 'Mỗi người học riêng' : groups
        ? [groups.length ? `${groups.length} nhóm` : '', soloCount ? `${soloCount} học riêng` : ''].filter(Boolean).join(' · ')
        : 'Tất cả học chung';

    return (
        <section className="min-w-0 border-t border-gray-200 py-4">
            <header className="mb-2">
                <h4 className="text-sm font-semibold text-gray-900">{courseName}</h4>
                <p className="mt-1 text-xs text-gray-500">{courseId} · {subscribers.length} người</p>
            </header>
            <button type="button" onClick={() => setEditor('classes')} className="flex min-h-11 w-full items-center justify-between gap-3 rounded-lg px-2 text-left text-sm hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300">
                <span className="min-w-0"><span className="text-gray-700">Lớp được xét</span>{summary && <span className="ml-2 text-xs text-gray-500">{summary}</span>}</span>
                <span className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-[#004A98]">Chỉnh lớp<ChevronRight className="h-4 w-4" aria-hidden="true" /></span>
            </button>
            {subscribers.length >= 2 && <>
                <div className="flex min-h-11 flex-wrap items-center justify-between gap-2 px-2">
                    <span className="text-sm text-gray-700">Học cùng nhau</span>
                    <AppSelect value={sharing?.mode ?? 'required'} options={[
                        { id: 'required', name: 'Bắt buộc cùng lớp' },
                        { id: 'preferred', name: 'Ưu tiên cùng lớp' },
                        { id: 'independent', name: 'Học độc lập' },
                    ]} ariaLabel={`Quy tắc học cùng cho ${courseName}`} className="w-full sm:w-52" triggerClassName="min-h-11 text-sm" onChange={(mode) => {
                        if (mode !== 'required' && mode !== 'preferred' && mode !== 'independent') return;
                        onSharingChange({ ...sharing, mode, groups: mode === 'independent' || sharing?.mode === 'independent' ? undefined : sharing?.groups, ...(mode !== (sharing?.mode ?? 'required') ? { groupClassPreferences: {} } : {}) });
                    }} />
                </div>
                <button type="button" onClick={() => setEditor('groups')} className="flex min-h-11 w-full items-center justify-between gap-3 rounded-lg px-2 text-left hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300">
                    <span className="text-xs text-gray-500">{groupSummary}</span>
                    <span className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-[#004A98]">Chỉnh nhóm<ChevronRight className="h-4 w-4" aria-hidden="true" /></span>
                </button>
            </>}
            {editor && <RoadmapDialog title={editor === 'classes' ? 'Chỉnh lớp' : 'Chỉnh nhóm'} description={`${courseId} · ${courseName}`} onClose={() => setEditor(null)} footer={<button type="button" onClick={() => setEditor(null)} className="ustudy-button-primary min-h-11 w-full justify-center">Xong</button>}>
                {editor === 'classes' ? <div className="space-y-4">
                    <AppSelect label="Áp dụng cho" value={targets.some((item) => item.id === target) ? target : 'global'} options={targets} onChange={onTargetChange} ariaLabel={`Nhóm áp dụng cho ${courseId}`} triggerClassName="min-h-11" />
                    {!classes.length ? <p className="py-4 text-sm text-gray-500">Chưa có dữ liệu lớp cho môn này.</p> : <div className="divide-y divide-gray-200">
                        {classes.map((item) => <div key={item.id} className="flex min-w-0 items-center justify-between gap-3 py-3">
                            <div className="min-w-0 flex-1"><p className="text-sm font-semibold text-gray-900">{item.id.replace(/_/g, ' ')}</p><p className="mt-1 break-words text-xs text-gray-500">{item.schedule.join(', ') || 'Chưa có lịch học'}</p></div>
                            <AppSelect value={getLevel(item.id) ?? 'allowed'} options={[
                                { id: 'excluded', name: 'Cấm' }, { id: 'allowed', name: 'Cho phép' }, { id: 'preferred', name: 'Ưu tiên' }, { id: 'required', name: 'Bắt buộc' },
                            ]} ariaLabel={`Lựa chọn lớp ${item.id}`} className="w-32 shrink-0" triggerClassName="min-h-11 text-sm" onChange={(level) => {
                                if (level === 'allowed') onLevelChange(item.id, null);
                                else if (level === 'excluded' || level === 'preferred' || level === 'required') onLevelChange(item.id, level);
                            }} />
                        </div>)}
                    </div>}
                    {summary && <button type="button" onClick={onClear} className="min-h-11 text-sm text-[#004A98] hover:underline">Bỏ ưu tiên lớp</button>}
                </div> : <CourseSharingEditor courseId={courseId} subscribers={subscribers} members={members} value={sharing} onChange={onSharingChange} minimal />}
            </RoadmapDialog>}
        </section>
    );
}

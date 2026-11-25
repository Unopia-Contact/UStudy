import { analyzeGroupScheduleTradeoff, runGroupScheduleSolver, validateGroupScheduleConfiguration } from './group-scheduler';
import type { CampusId } from '../../../domain/campus';
import type { GroupConfigurationIssue, GroupFitnessConfig, GroupMemberToken, GroupScheduleRunResult, GroupScheduleTradeoff } from '../types';

export interface GroupWorkerRequest {
  db: unknown[];
  members: GroupMemberToken[];
  config: Partial<GroupFitnessConfig>;
  campus: CampusId;
  tradeoff?: GroupScheduleTradeoff;
}

export type GroupWorkerReply =
  | { kind: 'invalid'; issues: GroupConfigurationIssue[] }
  | { kind: 'result'; result: GroupScheduleRunResult; issues: GroupConfigurationIssue[] }
  | { kind: 'analysis'; tradeoff: GroupScheduleTradeoff }
  | { kind: 'error'; message: string };

self.onmessage = ({ data }: MessageEvent<GroupWorkerRequest>) => {
  const { db, members, config, campus, tradeoff } = data;
  let reply: GroupWorkerReply;
  try {
    if (tradeoff) {
      reply = { kind: 'analysis', tradeoff: analyzeGroupScheduleTradeoff(db, members, config, tradeoff, campus) };
    } else {
      const issues = validateGroupScheduleConfiguration(db, members, config, campus);
      reply = issues.some(issue => issue.severity === 'error') ? { kind: 'invalid', issues }
        : { kind: 'result', issues, result: runGroupScheduleSolver(db, members, config, undefined, campus) };
    }
  } catch (error) {
    reply = { kind: 'error', message: error instanceof Error ? error.message : 'Có lỗi khi xếp lịch nhóm.' };
  }
  self.postMessage(reply);
};

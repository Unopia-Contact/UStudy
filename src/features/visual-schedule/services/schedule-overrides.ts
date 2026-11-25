import type { ScheduleOverrides } from '../types';

function group(id: string) {
    return id.split('|').slice(0, 3).join('|').trim().toUpperCase();
}

function slot(id: string) {
    return id.split('|')[3]?.match(/T(?:[2-7]|CN)\s*\([\d.]+\s*-\s*[\d.]+\)/i)?.[0].replace(/\s/g, '').toUpperCase();
}

export function moveSessionEdits(overrides: ScheduleOverrides, from: string, to: string): ScheduleOverrides {
    const sessionOverrides = { ...overrides.sessionOverrides };
    if (sessionOverrides[from]) {
        sessionOverrides[to] = sessionOverrides[from];
        delete sessionOverrides[from];
    }
    const weekOverrides = { ...overrides.weekOverrides };
    for (const key of Object.keys(weekOverrides)) {
        const separator = key.indexOf('_');
        if (key.slice(separator + 1) !== from) continue;
        weekOverrides[key.slice(0, separator + 1) + to] = weekOverrides[key];
        delete weekOverrides[key];
    }
    return { ...overrides, sessionOverrides, weekOverrides };
}

export function reconcileSessionEdits(overrides: ScheduleOverrides, sessionIds: Set<string>) {
    const edited = new Set([...Object.keys(overrides.sessionOverrides),
        ...Object.keys(overrides.weekOverrides).map(key => key.slice(key.indexOf('_') + 1))]);
    const missing = [...edited].filter(id => !sessionIds.has(id));
    const available = [...sessionIds].filter(id => !edited.has(id));
    let result = overrides;
    const unassigned: { from: string; candidates: string[] }[] = [];
    for (const from of missing) {
        const candidates = available.filter(id => group(id) === group(from));
        const matches = candidates.filter(id => slot(from) && slot(id) === slot(from));
        const old = missing.filter(id => group(id) === group(from));
        const target = matches.length === 1 && old.filter(id => slot(id) === slot(from)).length === 1
            ? matches[0] : undefined;
        if (target) {
            result = moveSessionEdits(result, from, target);
            available.splice(available.indexOf(target), 1);
        } else unassigned.push({ from, candidates });
    }
    return { overrides: result, unassigned: unassigned.map(item => ({
        ...item, candidates: item.candidates.filter(id => available.includes(id)),
    })) };
}

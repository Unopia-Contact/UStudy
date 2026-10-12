import { describe, expect, it } from 'vitest';
import { APP_ROUTES, getPageIdFromPath, getPathForPage } from '../../../src/app/routes';

describe('public guide routes', () => {
    it.each([
        APP_ROUTES.guide,
        `${APP_ROUTES.guide}/`,
        APP_ROUTES.guideGpa,
        APP_ROUTES.guideStudyRoadmap,
        APP_ROUTES.guideSchedule,
    ])('maps %s to the public guide page', (path) => {
        expect(getPageIdFromPath(path)).toBe('guide');
    });

    it('uses the guide index as the canonical path', () => {
        expect(getPathForPage('guide')).toBe(APP_ROUTES.guide);
    });
});

import { describe, expect, it } from 'vitest';

import { getRandomPortalLoginUrl } from '../../../src/portal-sync/portal-url';

describe('getRandomPortalLoginUrl', () => {
  it('maps the lower random boundary to new-portal1', () => {
    expect(getRandomPortalLoginUrl(() => 0)).toBe(
      'https://new-portal1.hcmus.edu.vn/Login.aspx',
    );
  });

  it('maps the upper random boundary to new-portal18', () => {
    expect(getRandomPortalLoginUrl(() => 1)).toBe(
      'https://new-portal18.hcmus.edu.vn/Login.aspx',
    );
  });

  it('always returns a configured numbered Portal domain', () => {
    for (let index = 0; index < 180; index += 1) {
      const url = getRandomPortalLoginUrl(() => index / 180);
      expect(url).toMatch(/^https:\/\/new-portal(?:[1-9]|1[0-8])\.hcmus\.edu\.vn\/Login\.aspx$/);
    }
  });
});

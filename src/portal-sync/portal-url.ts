import portalSyncConfig from './config.json';

const RANDOM_UPPER_BOUND = 1 - Number.EPSILON;

export function getRandomPortalLoginUrl(random: () => number = Math.random): string {
  const { urlTemplate, shardMin, shardMax } = portalSyncConfig.portalLogin;
  const min = Math.ceil(shardMin);
  const max = Math.floor(shardMax);

  if (!urlTemplate.includes('{shard}') || !Number.isInteger(min) || !Number.isInteger(max) || min > max) {
    throw new Error('Cấu hình domain đăng nhập Portal không hợp lệ.');
  }

  const sample = random();
  const normalizedSample = Number.isFinite(sample)
    ? Math.min(Math.max(sample, 0), RANDOM_UPPER_BOUND)
    : 0;
  const shard = min + Math.floor(normalizedSample * (max - min + 1));

  return urlTemplate.replace('{shard}', String(shard));
}

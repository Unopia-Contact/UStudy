SELECT
  i.origin,
  a.active_day,
  COUNT(*) AS dau
FROM installation_activity_days AS a
JOIN anonymous_installations AS i
  ON i.installation_hash = a.installation_hash
GROUP BY i.origin, a.active_day
ORDER BY a.active_day DESC, i.origin;

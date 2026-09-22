SELECT
  origin,
  COUNT(*) AS total_installations,
  SUM(last_seen_day = DATE('now', '+7 hours')) AS dau,
  SUM(last_seen_day >= DATE('now', '+7 hours', '-6 days')) AS wau,
  SUM(last_seen_day >= DATE('now', '+7 hours', '-29 days')) AS mau,
  SUM(first_seen_day = DATE('now', '+7 hours')) AS new_today,
  SUM(first_seen_day < last_seen_day) AS returning_installations
FROM anonymous_installations
GROUP BY origin
ORDER BY origin;


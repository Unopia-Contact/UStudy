WITH
  params AS (
    SELECT DATE('now', '+7 hours') AS today
  ),
  installation_summary AS (
    SELECT
      origin,
      COUNT(*) AS total_installations,
      SUM(deleted_day IS NULL) AS active_installations,
      SUM(deleted_day IS NOT NULL) AS deactivated_installations,
      SUM(first_seen_day = (SELECT today FROM params)) AS new_today
    FROM anonymous_installations
    GROUP BY origin
  ),
  activity_summary AS (
    SELECT
      i.origin,
      COUNT(DISTINCT CASE WHEN a.active_day = (SELECT today FROM params) THEN a.installation_hash END) AS dau,
      COUNT(DISTINCT CASE WHEN a.active_day >= DATE((SELECT today FROM params), '-6 days') THEN a.installation_hash END) AS wau,
      COUNT(DISTINCT CASE WHEN a.active_day >= DATE((SELECT today FROM params), '-29 days') THEN a.installation_hash END) AS mau
    FROM anonymous_installations AS i
    LEFT JOIN installation_activity_days AS a
      ON a.installation_hash = i.installation_hash
    GROUP BY i.origin
  ),
  returning_summary AS (
    SELECT origin, COUNT(*) AS returning_installations
    FROM (
      SELECT i.origin, a.installation_hash
      FROM installation_activity_days AS a
      JOIN anonymous_installations AS i
        ON i.installation_hash = a.installation_hash
      GROUP BY i.origin, a.installation_hash
      HAVING COUNT(*) >= 2
    )
    GROUP BY origin
  )
SELECT
  i.origin,
  i.total_installations,
  i.active_installations,
  i.deactivated_installations,
  COALESCE(a.dau, 0) AS dau,
  COALESCE(a.wau, 0) AS wau,
  COALESCE(a.mau, 0) AS mau,
  i.new_today,
  COALESCE(r.returning_installations, 0) AS returning_installations
FROM installation_summary AS i
LEFT JOIN activity_summary AS a ON a.origin = i.origin
LEFT JOIN returning_summary AS r ON r.origin = i.origin
ORDER BY i.origin;

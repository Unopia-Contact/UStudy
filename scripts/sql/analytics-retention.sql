WITH
  params AS (
    SELECT DATE('now', '+7 hours') AS today
  ),
  cohorts AS (
    SELECT
      i.origin,
      i.first_seen_day AS cohort_day,
      COUNT(*) AS cohort_size,
      SUM(EXISTS (
        SELECT 1 FROM installation_activity_days AS a
        WHERE a.installation_hash = i.installation_hash
          AND a.active_day = DATE(i.first_seen_day, '+1 day')
      )) AS retained_d1,
      SUM(EXISTS (
        SELECT 1 FROM installation_activity_days AS a
        WHERE a.installation_hash = i.installation_hash
          AND a.active_day = DATE(i.first_seen_day, '+7 days')
      )) AS retained_d7,
      SUM(EXISTS (
        SELECT 1 FROM installation_activity_days AS a
        WHERE a.installation_hash = i.installation_hash
          AND a.active_day = DATE(i.first_seen_day, '+30 days')
      )) AS retained_d30
    FROM anonymous_installations AS i
    WHERE i.first_seen_day >= DATE((SELECT today FROM params), '-120 days')
    GROUP BY i.origin, i.first_seen_day
  )
SELECT
  origin,
  cohort_day,
  cohort_size,
  CASE WHEN cohort_day <= DATE((SELECT today FROM params), '-1 day') THEN retained_d1 END AS retained_d1,
  CASE WHEN cohort_day <= DATE((SELECT today FROM params), '-1 day') THEN ROUND(100.0 * retained_d1 / cohort_size, 1) END AS retention_d1_percent,
  CASE WHEN cohort_day <= DATE((SELECT today FROM params), '-7 days') THEN retained_d7 END AS retained_d7,
  CASE WHEN cohort_day <= DATE((SELECT today FROM params), '-7 days') THEN ROUND(100.0 * retained_d7 / cohort_size, 1) END AS retention_d7_percent,
  CASE WHEN cohort_day <= DATE((SELECT today FROM params), '-30 days') THEN retained_d30 END AS retained_d30,
  CASE WHEN cohort_day <= DATE((SELECT today FROM params), '-30 days') THEN ROUND(100.0 * retained_d30 / cohort_size, 1) END AS retention_d30_percent
FROM cohorts
ORDER BY cohort_day DESC, origin;

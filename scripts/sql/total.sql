SELECT
    (
        SELECT COUNT(*)
        FROM anonymous_installations
    ) AS total_installations,

    (
        SELECT COUNT(*)
        FROM anonymous_installations
        WHERE deleted_day IS NULL
    ) AS active_installations,

    (
        SELECT COUNT(*)
        FROM anonymous_installations
        WHERE first_seen_day = :day
    ) AS new_today,

    (
        SELECT COUNT(*)
        FROM installation_activity_days
        WHERE active_day = :day
    ) AS dau,

    (
        SELECT COUNT(*)
        FROM installation_activity_days a
        JOIN anonymous_installations i
          ON i.installation_hash = a.installation_hash
        WHERE a.active_day = :day
          AND i.first_seen_day < :day
    ) AS returning_today;



SELECT
    a.active_day AS day,
    COUNT(*) AS dau,

    SUM(
        CASE
            WHEN i.first_seen_day = a.active_day THEN 1
            ELSE 0
        END
    ) AS new_installations,

    SUM(
        CASE
            WHEN i.first_seen_day < a.active_day THEN 1
            ELSE 0
        END
    ) AS returning_installations

FROM installation_activity_days a
JOIN anonymous_installations i
  ON i.installation_hash = a.installation_hash

GROUP BY a.active_day
ORDER BY a.active_day;
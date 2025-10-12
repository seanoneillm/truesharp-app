-- Check which leagues have games with 0 odds
SELECT 
    g.league,
    COUNT(*) as total_games,
    SUM(CASE WHEN o.odds_count = 0 THEN 1 ELSE 0 END) as games_with_zero_odds,
    SUM(CASE WHEN o.odds_count > 0 THEN 1 ELSE 0 END) as games_with_odds,
    ROUND(
        (SUM(CASE WHEN o.odds_count = 0 THEN 1 ELSE 0 END) * 100.0 / COUNT(*)), 
        2
    ) as zero_odds_percentage
FROM games g
LEFT JOIN (
    SELECT eventid, COUNT(*) as odds_count
    FROM odds
    GROUP BY eventid
) o ON g.id = o.eventid
WHERE g.game_time >= CURRENT_DATE 
  AND g.game_time < CURRENT_DATE + INTERVAL '1 day'
GROUP BY g.league
ORDER BY zero_odds_percentage DESC;

-- Also check specific MLB games with 0 odds
SELECT 
    g.id,
    g.home_team,
    g.away_team,
    g.league,
    g.game_time,
    COALESCE(o.odds_count, 0) as odds_count
FROM games g
LEFT JOIN (
    SELECT eventid, COUNT(*) as odds_count
    FROM odds
    GROUP BY eventid
) o ON g.id = o.eventid
WHERE g.league = 'MLB'
  AND g.game_time >= CURRENT_DATE 
  AND g.game_time < CURRENT_DATE + INTERVAL '1 day'
  AND COALESCE(o.odds_count, 0) = 0
ORDER BY g.game_time;
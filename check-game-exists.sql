-- Quick check to see if game ouW6XII0uKqRsJazjYBr exists and get its details
SELECT 
    id,
    home_team,
    away_team,
    status,
    game_time,
    league,
    CASE 
        WHEN game_time < NOW() THEN 'Game has started'
        ELSE 'Game has not started'
    END as game_status_check,
    EXTRACT(EPOCH FROM (game_time - NOW()))/3600 as hours_until_game
FROM games 
WHERE id = 'ouW6XII0uKqRsJazjYBr';

-- Also check if there are any other games we could test with
SELECT 
    id,
    home_team,
    away_team,
    status,
    game_time,
    league,
    CASE 
        WHEN game_time < NOW() THEN 'Game has started'
        ELSE 'Game has not started'
    END as game_status_check
FROM games 
WHERE game_time > NOW() 
    AND status != 'final'
ORDER BY game_time ASC
LIMIT 5;

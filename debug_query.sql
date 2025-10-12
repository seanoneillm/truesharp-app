-- EXACT query to find all rows with this specific combination
SELECT 
  id,
  eventid, 
  oddid, 
  line, 
  bookodds,
  fanduelodds, 
  fanduellink,
  draftkingsodds, 
  draftkingslink,
  ceasarsodds,
  ceasarslink,
  mgmodds,
  mgmlink,
  espnbetodds,
  espnbetlink,
  updated_at,
  created_at
FROM odds 
WHERE eventid = '97f97ZKMqCcpK2LvvLnL' 
  AND oddid = 'points-home-game-sp-home' 
  AND line = '+3.5'
ORDER BY updated_at DESC;

-- Check if there are any duplicate rows (should be 0 due to unique constraint)
SELECT 
  eventid, 
  oddid, 
  line, 
  COUNT(*) as row_count,
  array_agg(id) as record_ids,
  array_agg(updated_at) as update_times
FROM odds 
WHERE eventid = '97f97ZKMqCcpK2LvvLnL' 
  AND oddid = 'points-home-game-sp-home' 
  AND line = '+3.5'
GROUP BY eventid, oddid, line
HAVING COUNT(*) > 1;
-- Clean up test notifications
-- This will remove notifications that appear to be from testing

-- First, let's see what notifications exist
SELECT 
  id,
  title,
  message,
  sender_type,
  notification_type,
  created_at
FROM notifications 
ORDER BY created_at DESC;

-- Remove notifications that are clearly test notifications
-- (Adjust the WHERE clause based on what you see above)

-- Option 1: Remove all notifications older than the last hour (if that's when testing started)
-- DELETE FROM notifications WHERE created_at < NOW() - INTERVAL '1 hour';

-- Option 2: Remove specific test notifications by title pattern
-- DELETE FROM notifications WHERE title LIKE '%test%' OR title LIKE '%Test%';

-- Option 3: Remove all notifications (nuclear option - use carefully!)
-- DELETE FROM notifications;

-- Option 4: Remove notifications from a specific date range
-- DELETE FROM notifications WHERE created_at BETWEEN '2025-12-16' AND '2025-12-17 02:00:00';

-- Option 5: Remove strategy bet notifications from testing (most likely what you want)
-- DELETE FROM notifications WHERE title LIKE '%New Bets Added%' OR title LIKE '%The Herd%';

-- Uncomment the DELETE statement you want to use after reviewing the SELECT results
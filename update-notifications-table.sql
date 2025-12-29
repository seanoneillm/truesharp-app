-- Update notifications table to add notification type and sender information
-- Note: The table already has 'type' column, so we'll rename it to notification_type for clarity
ALTER TABLE public.notifications 
RENAME COLUMN type TO notification_type;

-- Add new columns for sender information
ALTER TABLE public.notifications 
ADD COLUMN IF NOT EXISTS sender_type VARCHAR(20) DEFAULT 'truesharp', -- 'truesharp', 'user', 'system', 'wagerwave'
ADD COLUMN IF NOT EXISTS sender_id UUID REFERENCES auth.users(id) ON DELETE SET NULL; -- For user-to-user notifications

-- Update the existing type index to use the new column name
DROP INDEX IF EXISTS idx_notifications_type;
CREATE INDEX IF NOT EXISTS idx_notifications_notification_type ON public.notifications(notification_type);

-- Create indexes for new columns
CREATE INDEX IF NOT EXISTS idx_notifications_sender_type ON public.notifications(sender_type);
CREATE INDEX IF NOT EXISTS idx_notifications_sender_id ON public.notifications(sender_id) WHERE sender_id IS NOT NULL;

-- Enable RLS if not already enabled
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (drop existing ones first to avoid conflicts)
DROP POLICY IF EXISTS "Users can view their own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON notifications;
DROP POLICY IF EXISTS "System can insert notifications" ON notifications;
DROP POLICY IF EXISTS "Admins can view all notifications for management" ON notifications;

-- Users can view their own notifications
CREATE POLICY "Users can view their own notifications" ON notifications
    FOR SELECT USING (auth.uid() = user_id);

-- Users can update their own notifications (for marking as read)
CREATE POLICY "Users can update their own notifications" ON notifications
    FOR UPDATE USING (auth.uid() = user_id);

-- Allow system to insert notifications (for admin sending)
CREATE POLICY "System can insert notifications" ON notifications
    FOR INSERT WITH CHECK (true);

-- Admins can view all notifications for management (using hardcoded admin user IDs)
CREATE POLICY "Admins can view all notifications for management" ON notifications
    FOR SELECT USING (
        auth.uid() IN (
            '28991397-dae7-42e8-a822-0dffc6ff49b7'::uuid,
            '0e16e4f5-f206-4e62-8282-4188ff8af48a'::uuid,
            'dfd44121-8e88-4c83-ad95-9fb8a4224908'::uuid
        )
    );
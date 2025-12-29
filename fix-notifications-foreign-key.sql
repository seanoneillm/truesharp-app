-- Add foreign key constraint to notifications table
ALTER TABLE public.notifications 
ADD CONSTRAINT notifications_sender_id_fkey 
FOREIGN KEY (sender_id) REFERENCES auth.users(id) ON DELETE SET NULL;
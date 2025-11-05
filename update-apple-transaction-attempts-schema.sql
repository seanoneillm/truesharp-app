-- Add missing column to apple_transaction_attempts table
-- This column is needed for tracking original transaction IDs

DO $$ 
BEGIN
    -- Add missing original_transaction_id column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'apple_transaction_attempts' 
        AND column_name = 'original_transaction_id'
    ) THEN
        ALTER TABLE apple_transaction_attempts 
        ADD COLUMN original_transaction_id TEXT;
    END IF;

    -- Add index for original_transaction_id
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = 'idx_apple_transaction_attempts_original_transaction_id'
    ) THEN
        CREATE INDEX idx_apple_transaction_attempts_original_transaction_id 
        ON apple_transaction_attempts(original_transaction_id);
    END IF;
END $$;
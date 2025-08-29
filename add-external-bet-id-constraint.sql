-- Add unique constraint on external_bet_id to enable upserts
-- This allows SharpSports integration to update existing bets when status changes

-- First, ensure external_bet_id is not null and has sensible defaults
UPDATE bets 
SET external_bet_id = id::text 
WHERE external_bet_id IS NULL;

-- Make external_bet_id NOT NULL
ALTER TABLE bets ALTER COLUMN external_bet_id SET NOT NULL;

-- Add unique constraint for external_bet_id (this enables ON CONFLICT in upserts)
CREATE UNIQUE INDEX IF NOT EXISTS idx_bets_external_bet_id_unique 
ON public.bets USING btree (external_bet_id) TABLESPACE pg_default;

-- Add index for faster lookups by external_bet_id
CREATE INDEX IF NOT EXISTS idx_bets_external_bet_id 
ON public.bets USING btree (external_bet_id) TABLESPACE pg_default;
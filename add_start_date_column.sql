-- Add start_date column to the strategies table
ALTER TABLE public.strategies 
ADD COLUMN start_date DATE;

-- Add index for performance on start_date queries
CREATE INDEX IF NOT EXISTS idx_strategies_start_date 
ON public.strategies USING btree (start_date) 
TABLESPACE pg_default;

-- Add comment explaining the column
COMMENT ON COLUMN public.strategies.start_date IS 'The start date for filtering bets that should be included in this strategy. Only bets placed on or after this date will be considered for strategy performance calculations.';
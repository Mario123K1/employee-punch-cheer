-- Add break tracking column to time_entries
ALTER TABLE public.time_entries 
ADD COLUMN break_taken boolean NOT NULL DEFAULT false;

-- Comment for documentation
COMMENT ON COLUMN public.time_entries.break_taken IS 'Whether employee took the mandatory 30-minute break (deducted from work hours)';
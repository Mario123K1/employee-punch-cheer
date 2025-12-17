-- Enable realtime for time_entries table
ALTER PUBLICATION supabase_realtime ADD TABLE public.time_entries;

-- Enable realtime for vacation_days table  
ALTER PUBLICATION supabase_realtime ADD TABLE public.vacation_days;

-- Enable realtime for employees table
ALTER PUBLICATION supabase_realtime ADD TABLE public.employees;
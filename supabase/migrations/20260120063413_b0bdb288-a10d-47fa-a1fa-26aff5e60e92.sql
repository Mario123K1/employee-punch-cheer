-- Add unique constraint to prevent duplicate time entries for same employee on same day
ALTER TABLE time_entries 
ADD CONSTRAINT unique_employee_date UNIQUE (employee_id, date);
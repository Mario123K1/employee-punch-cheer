import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface TimeEntry {
  id: string;
  employee_id: string;
  date: string;
  clock_in: string | null;
  clock_out: string | null;
  break_taken: boolean;
  created_at: string;
}

export function useTimeEntries() {
  return useQuery({
    queryKey: ['time_entries'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('time_entries')
        .select('*')
        .order('date', { ascending: false });
      
      if (error) throw error;
      return data as TimeEntry[];
    },
  });
}

export function useClockIn() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ employeeId, date, time }: { employeeId: string; date: string; time: string }) => {
      const { data, error } = await supabase
        .from('time_entries')
        .insert({
          employee_id: employeeId,
          date,
          clock_in: time,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['time_entries'] });
    },
  });
}

export function useClockOut() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ entryId, time }: { entryId: string; time: string }) => {
      const { data, error } = await supabase
        .from('time_entries')
        .update({ clock_out: time })
        .eq('id', entryId)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['time_entries'] });
    },
  });
}

export function getUnclosedPreviousEntry(
  timeEntries: TimeEntry[],
  employeeId: string,
  today: string
): TimeEntry | undefined {
  return timeEntries.find(
    (e) =>
      e.employee_id === employeeId &&
      e.date < today &&
      e.clock_in &&
      !e.clock_out
  );
}

export function useToggleBreak() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ entryId, breakTaken }: { entryId: string; breakTaken: boolean }) => {
      const { data, error } = await supabase
        .from('time_entries')
        .update({ break_taken: breakTaken })
        .eq('id', entryId)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['time_entries'] });
    },
  });
}

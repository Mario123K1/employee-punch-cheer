import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface VacationDay {
  id: string;
  employee_id: string;
  date: string;
  type: 'vacation' | 'sick' | 'personal';
  created_at: string;
}

export function useVacationDays() {
  return useQuery({
    queryKey: ['vacation_days'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vacation_days')
        .select('*')
        .order('date', { ascending: false });
      
      if (error) throw error;
      return data as VacationDay[];
    },
  });
}

export function useAddVacation() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ employeeId, date, type }: { employeeId: string; date: string; type: VacationDay['type'] }) => {
      const { data, error } = await supabase
        .from('vacation_days')
        .insert({
          employee_id: employeeId,
          date,
          type,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vacation_days'] });
    },
  });
}

export function useRemoveVacation() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (vacationId: string) => {
      const { error } = await supabase
        .from('vacation_days')
        .delete()
        .eq('id', vacationId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vacation_days'] });
    },
  });
}

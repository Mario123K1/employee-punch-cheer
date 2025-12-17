import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Holiday {
  id: string;
  date: string;
  name: string;
}

export function useHolidays() {
  return useQuery({
    queryKey: ['holidays'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('holidays')
        .select('*')
        .order('date');
      
      if (error) throw error;
      return data as Holiday[];
    },
  });
}

export function isHoliday(date: string, holidays: Holiday[]): Holiday | undefined {
  return holidays.find(h => h.date === date);
}

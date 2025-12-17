import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const PENDING_ACTIONS_KEY = 'pendingOfflineActions';

interface PendingAction {
  id: string;
  type: 'clock_in' | 'clock_out';
  employeeId: string;
  date: string;
  time: string;
  entryId?: string;
  createdAt: string;
}

export function useOfflineSync() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingCount, setPendingCount] = useState(0);
  const queryClient = useQueryClient();

  // Load pending count on mount
  useEffect(() => {
    const pending = getPendingActions();
    setPendingCount(pending.length);
  }, []);

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => {
      console.log('Back online - syncing pending actions...');
      setIsOnline(true);
      toast.success('Pripojenie obnovené - synchronizujem dáta...');
      syncPendingActions();
    };

    const handleOffline = () => {
      console.log('Gone offline');
      setIsOnline(false);
      toast.warning('Offline režim - dáta sa uložia lokálne');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Try to sync on mount if online
    if (navigator.onLine) {
      syncPendingActions();
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const getPendingActions = (): PendingAction[] => {
    try {
      const stored = localStorage.getItem(PENDING_ACTIONS_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  };

  const savePendingAction = (action: Omit<PendingAction, 'id' | 'createdAt'>) => {
    const pending = getPendingActions();
    const newAction: PendingAction = {
      ...action,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    pending.push(newAction);
    localStorage.setItem(PENDING_ACTIONS_KEY, JSON.stringify(pending));
    setPendingCount(pending.length);
    console.log('Saved pending action:', newAction);
  };

  const removePendingAction = (id: string) => {
    const pending = getPendingActions().filter(a => a.id !== id);
    localStorage.setItem(PENDING_ACTIONS_KEY, JSON.stringify(pending));
    setPendingCount(pending.length);
  };

  const syncPendingActions = async () => {
    const pending = getPendingActions();
    if (pending.length === 0) return;

    console.log(`Syncing ${pending.length} pending actions...`);
    let successCount = 0;

    for (const action of pending) {
      try {
        if (action.type === 'clock_in') {
          const { error } = await supabase
            .from('time_entries')
            .insert({
              employee_id: action.employeeId,
              date: action.date,
              clock_in: action.time,
            });

          if (!error) {
            removePendingAction(action.id);
            successCount++;
          } else {
            console.error('Failed to sync clock_in:', error);
          }
        } else if (action.type === 'clock_out' && action.entryId) {
          const { error } = await supabase
            .from('time_entries')
            .update({ clock_out: action.time })
            .eq('id', action.entryId);

          if (!error) {
            removePendingAction(action.id);
            successCount++;
          } else {
            console.error('Failed to sync clock_out:', error);
          }
        }
      } catch (error) {
        console.error('Sync error:', error);
      }
    }

    if (successCount > 0) {
      toast.success(`Synchronizovaných ${successCount} záznamov`);
      queryClient.invalidateQueries({ queryKey: ['time_entries'] });
    }
  };

  const addOfflineClockIn = (employeeId: string, date: string, time: string) => {
    savePendingAction({
      type: 'clock_in',
      employeeId,
      date,
      time,
    });
  };

  const addOfflineClockOut = (employeeId: string, date: string, time: string, entryId: string) => {
    savePendingAction({
      type: 'clock_out',
      employeeId,
      date,
      time,
      entryId,
    });
  };

  return {
    isOnline,
    pendingCount,
    addOfflineClockIn,
    addOfflineClockOut,
    syncPendingActions,
  };
}

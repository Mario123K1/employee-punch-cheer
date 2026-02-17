import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { format } from 'date-fns';
import { sk } from 'date-fns/locale';
import { Clock, LogIn, LogOut, Star, Pencil, Check, X, Plus, Trash2 } from 'lucide-react';
import { useHolidays, isHoliday } from '@/hooks/useHolidays';
import { calculateWorkedHours } from '@/lib/timeUtils';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

interface TimeEntry {
  id: string;
  employeeId: string;
  date: string;
  clockIn: string | null;
  clockOut: string | null;
  breakTaken: boolean;
}

interface EmployeeDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  employeeName: string;
  employeeId: string;
  timeEntries: TimeEntry[];
}

export const EmployeeDetailModal = ({
  isOpen,
  onClose,
  employeeName,
  employeeId,
  timeEntries,
}: EmployeeDetailModalProps) => {
  const { data: holidays = [] } = useHolidays();
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState({ clockIn: '', clockOut: '', breakTaken: false });
  const [addingNew, setAddingNew] = useState(false);
  const [newEntry, setNewEntry] = useState({ date: '', clockIn: '', clockOut: '', breakTaken: false });
  const [saving, setSaving] = useState(false);

  const calculateHours = calculateWorkedHours;

  const sortedEntries = [...timeEntries].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const totalHours = sortedEntries.reduce((sum, entry) => {
    if (entry.clockIn && entry.clockOut) {
      return sum + calculateHours(entry.clockIn, entry.clockOut, entry.breakTaken);
    }
    return sum;
  }, 0);

  const startEdit = (entry: TimeEntry) => {
    setEditingId(entry.id);
    setEditValues({
      clockIn: entry.clockIn || '',
      clockOut: entry.clockOut || '',
      breakTaken: entry.breakTaken,
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  const saveEdit = async (entryId: string) => {
    setSaving(true);
    const { error } = await supabase
      .from('time_entries')
      .update({
        clock_in: editValues.clockIn || null,
        clock_out: editValues.clockOut || null,
        break_taken: editValues.breakTaken,
      })
      .eq('id', entryId);

    setSaving(false);
    if (error) {
      toast.error('Chyba pri ukladaní: ' + error.message);
    } else {
      toast.success('Záznam aktualizovaný');
      setEditingId(null);
      queryClient.invalidateQueries({ queryKey: ['time_entries'] });
    }
  };

  const deleteEntry = async (entryId: string) => {
    setSaving(true);
    const { error } = await supabase
      .from('time_entries')
      .delete()
      .eq('id', entryId);

    setSaving(false);
    if (error) {
      toast.error('Chyba pri mazaní: ' + error.message);
    } else {
      toast.success('Záznam vymazaný');
      queryClient.invalidateQueries({ queryKey: ['time_entries'] });
    }
  };

  const saveNewEntry = async () => {
    if (!newEntry.date || !newEntry.clockIn) {
      toast.error('Vyplň aspoň dátum a príchod');
      return;
    }
    setSaving(true);
    const { error } = await supabase
      .from('time_entries')
      .insert({
        employee_id: employeeId,
        date: newEntry.date,
        clock_in: newEntry.clockIn || null,
        clock_out: newEntry.clockOut || null,
        break_taken: newEntry.breakTaken,
      });

    setSaving(false);
    if (error) {
      toast.error('Chyba pri pridávaní: ' + error.message);
    } else {
      toast.success('Záznam pridaný');
      setAddingNew(false);
      setNewEntry({ date: '', clockIn: '', clockOut: '', breakTaken: false });
      queryClient.invalidateQueries({ queryKey: ['time_entries'] });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            {employeeName} - Dochádzka
          </DialogTitle>
        </DialogHeader>

        <div className="flex justify-end">
          <Button
            size="sm"
            variant="outline"
            className="gap-1"
            onClick={() => { setAddingNew(true); setEditingId(null); }}
            disabled={addingNew}
          >
            <Plus className="w-4 h-4" /> Pridať záznam
          </Button>
        </div>

        {addingNew && (
          <div className="p-3 border rounded-lg bg-primary/5 space-y-2">
            <p className="text-sm font-medium">Nový záznam</p>
            <div className="flex flex-wrap gap-2 items-center">
              <Input
                type="date"
                value={newEntry.date}
                onChange={e => setNewEntry(p => ({ ...p, date: e.target.value }))}
                className="w-40"
              />
              <Input
                type="time"
                value={newEntry.clockIn}
                onChange={e => setNewEntry(p => ({ ...p, clockIn: e.target.value }))}
                className="w-28"
                placeholder="Príchod"
              />
              <Input
                type="time"
                value={newEntry.clockOut}
                onChange={e => setNewEntry(p => ({ ...p, clockOut: e.target.value }))}
                className="w-28"
                placeholder="Odchod"
              />
              <div className="flex items-center gap-1.5">
                <Checkbox
                  checked={newEntry.breakTaken}
                  onCheckedChange={v => setNewEntry(p => ({ ...p, breakTaken: !!v }))}
                />
                <span className="text-xs">Prestávka</span>
              </div>
              <Button size="sm" onClick={saveNewEntry} disabled={saving} className="gap-1">
                <Check className="w-4 h-4" /> Uložiť
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setAddingNew(false)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
        
        <div className="flex-1 overflow-y-auto">
          {sortedEntries.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              Žiadne záznamy dochádzky
            </p>
          ) : (
            <div className="space-y-2">
              {sortedEntries.map(entry => {
                const isEditing = editingId === entry.id;
                const hours = entry.clockIn && entry.clockOut 
                  ? Math.round(calculateHours(entry.clockIn, entry.clockOut, entry.breakTaken) * 100) / 100
                  : 0;
                const holiday = isHoliday(entry.date, holidays);

                if (isEditing) {
                  return (
                    <div key={entry.id} className="p-3 border-2 border-primary rounded-lg bg-primary/5 space-y-2">
                      <span className="font-medium text-sm">
                        {format(new Date(entry.date), 'd.M.yyyy (EEEE)', { locale: sk })}
                      </span>
                      <div className="flex flex-wrap gap-2 items-center">
                        <div className="flex items-center gap-1">
                          <LogIn className="w-4 h-4 text-green-600" />
                          <Input
                            type="time"
                            value={editValues.clockIn}
                            onChange={e => setEditValues(p => ({ ...p, clockIn: e.target.value }))}
                            className="w-28"
                          />
                        </div>
                        <div className="flex items-center gap-1">
                          <LogOut className="w-4 h-4 text-red-600" />
                          <Input
                            type="time"
                            value={editValues.clockOut}
                            onChange={e => setEditValues(p => ({ ...p, clockOut: e.target.value }))}
                            className="w-28"
                          />
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Checkbox
                            checked={editValues.breakTaken}
                            onCheckedChange={v => setEditValues(p => ({ ...p, breakTaken: !!v }))}
                          />
                          <span className="text-xs">Prestávka</span>
                        </div>
                        <Button size="sm" onClick={() => saveEdit(entry.id)} disabled={saving} className="gap-1">
                          <Check className="w-4 h-4" /> Uložiť
                        </Button>
                        <Button size="sm" variant="ghost" onClick={cancelEdit}>
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  );
                }

                return (
                  <div
                    key={entry.id}
                    className={`flex items-center justify-between p-3 border rounded-lg group ${
                      holiday ? 'bg-amber-500/10 border-amber-500/30' : 'bg-muted/30'
                    }`}
                  >
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium">
                        {format(new Date(entry.date), 'd.M.yyyy (EEEE)', { locale: sk })}
                      </span>
                      {holiday && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-amber-500/20 text-amber-600">
                          <Star className="w-3 h-3" />
                          {holiday.name}
                        </span>
                      )}
                      {entry.breakTaken && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-orange-500/20 text-orange-600">
                          ☕ -30min
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <div className="flex items-center gap-1 text-green-600">
                        <LogIn className="w-4 h-4" />
                        {entry.clockIn || '-'}
                      </div>
                      <div className="flex items-center gap-1 text-red-600">
                        <LogOut className="w-4 h-4" />
                        {entry.clockOut || '-'}
                      </div>
                      <div className="font-semibold min-w-[60px] text-right">
                        {hours}h
                        {holiday && hours > 0 && (
                          <span className="text-amber-600 text-xs ml-1">(2x)</span>
                        )}
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => startEdit(entry)}>
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => deleteEntry(entry.id)}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="border-t pt-4 mt-4">
          <div className="flex justify-between items-center font-bold text-lg">
            <span>Celkom hodín:</span>
            <span className="text-primary">{Math.round(totalHours * 100) / 100}h</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

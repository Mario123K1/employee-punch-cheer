import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { format } from 'date-fns';
import { sk } from 'date-fns/locale';
import { Clock, LogIn, LogOut } from 'lucide-react';

interface TimeEntry {
  id: string;
  employeeId: string;
  date: string;
  clockIn: string | null;
  clockOut: string | null;
}

interface EmployeeDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  employeeName: string;
  timeEntries: TimeEntry[];
}

export const EmployeeDetailModal = ({
  isOpen,
  onClose,
  employeeName,
  timeEntries,
}: EmployeeDetailModalProps) => {
  const calculateHours = (clockIn: string, clockOut: string): number => {
    const [inH, inM] = clockIn.split(':').map(Number);
    const [outH, outM] = clockOut.split(':').map(Number);
    const totalMinutes = (outH * 60 + outM) - (inH * 60 + inM);
    return Math.max(0, totalMinutes / 60);
  };

  const sortedEntries = [...timeEntries].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const totalHours = sortedEntries.reduce((sum, entry) => {
    if (entry.clockIn && entry.clockOut) {
      return sum + calculateHours(entry.clockIn, entry.clockOut);
    }
    return sum;
  }, 0);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            {employeeName} - Dochádzka
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto">
          {sortedEntries.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              Žiadne záznamy dochádzky
            </p>
          ) : (
            <div className="space-y-2">
              {sortedEntries.map(entry => {
                const hours = entry.clockIn && entry.clockOut 
                  ? Math.round(calculateHours(entry.clockIn, entry.clockOut) * 100) / 100
                  : 0;
                return (
                  <div
                    key={entry.id}
                    className="flex items-center justify-between p-3 border rounded-lg bg-muted/30"
                  >
                    <div className="font-medium">
                      {format(new Date(entry.date), 'd.M.yyyy (EEEE)', { locale: sk })}
                    </div>
                    <div className="flex items-center gap-4 text-sm">
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

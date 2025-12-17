import { useState } from 'react';
import { Employee, TimeEntry } from '@/types/employee';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Clock, LogIn, LogOut, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TimeEntryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employee: Employee | null;
  todayEntry?: TimeEntry;
  onClockIn: (employeeId: string, time: string) => void;
  onClockOut: (employeeId: string, time: string) => void;
}

export function TimeEntryModal({
  open,
  onOpenChange,
  employee,
  todayEntry,
  onClockIn,
  onClockOut,
}: TimeEntryModalProps) {
  const [clockInTime, setClockInTime] = useState('');
  const [clockOutTime, setClockOutTime] = useState('');

  const isClockedIn = todayEntry?.clockIn && !todayEntry?.clockOut;
  const hasCompleted = todayEntry?.clockIn && todayEntry?.clockOut;

  const getCurrentTime = () => {
    const now = new Date();
    return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
  };

  const handleClockIn = () => {
    if (employee) {
      const time = clockInTime || getCurrentTime();
      onClockIn(employee.id, time);
      setClockInTime('');
      onOpenChange(false);
    }
  };

  const handleClockOut = () => {
    if (employee) {
      const time = clockOutTime || getCurrentTime();
      onClockOut(employee.id, time);
      setClockOutTime('');
      onOpenChange(false);
    }
  };

  if (!employee) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center font-semibold",
              isClockedIn 
                ? "bg-clockIn/20 text-clockIn" 
                : "bg-secondary text-secondary-foreground"
            )}>
              {employee.name.split(' ').map(n => n[0]).join('')}
            </div>
            <div>
              <span>{employee.name}</span>
              <p className="text-sm font-normal text-muted-foreground">{employee.role || employee.department}</p>
            </div>
          </DialogTitle>
          <DialogDescription>
            {hasCompleted 
              ? `Already completed today (${todayEntry?.clockIn} - ${todayEntry?.clockOut})`
              : isClockedIn 
                ? `Currently working since ${todayEntry?.clockIn}`
                : 'Record your time entry for today'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Clock In Section */}
          {!isClockedIn && !hasCompleted && (
            <div className="space-y-3">
              <Label htmlFor="clockIn" className="text-sm font-medium">
                Clock In Time
              </Label>
              <div className="flex gap-2">
                <Input
                  id="clockIn"
                  type="time"
                  value={clockInTime}
                  onChange={(e) => setClockInTime(e.target.value)}
                  placeholder="HH:MM"
                  className="flex-1"
                />
                <Button
                  variant="clockIn"
                  size="lg"
                  onClick={handleClockIn}
                  className="gap-2"
                >
                  <LogIn className="w-4 h-4" />
                  Clock In
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Leave empty to use current time ({getCurrentTime()})
              </p>
            </div>
          )}

          {/* Clock Out Section */}
          {isClockedIn && (
            <div className="space-y-3">
              <div className="p-3 rounded-lg bg-clockIn/10 border border-clockIn/20">
                <p className="text-sm font-medium text-clockIn">
                  <Clock className="w-4 h-4 inline mr-2" />
                  Clocked in at {todayEntry?.clockIn}
                </p>
              </div>
              
              <Label htmlFor="clockOut" className="text-sm font-medium">
                Clock Out Time
              </Label>
              <div className="flex gap-2">
                <Input
                  id="clockOut"
                  type="time"
                  value={clockOutTime}
                  onChange={(e) => setClockOutTime(e.target.value)}
                  placeholder="HH:MM"
                  className="flex-1"
                />
                <Button
                  variant="clockOut"
                  size="lg"
                  onClick={handleClockOut}
                  className="gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  Clock Out
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Leave empty to use current time ({getCurrentTime()})
              </p>
            </div>
          )}

          {/* Completed Status */}
          {hasCompleted && (
            <div className="p-4 rounded-lg bg-muted text-center">
              <p className="text-sm text-muted-foreground">
                Time entry completed for today
              </p>
              <p className="font-semibold mt-1">
                {todayEntry?.clockIn} → {todayEntry?.clockOut}
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

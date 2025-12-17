import { Employee, TimeEntry } from '@/types/employee';
import { User, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EmployeeCardProps {
  employee: Employee;
  todayEntry?: TimeEntry;
  onClick: () => void;
}

export function EmployeeCard({ employee, todayEntry, onClick }: EmployeeCardProps) {
  const isClockedIn = todayEntry?.clockIn && !todayEntry?.clockOut;
  const hasCompleted = todayEntry?.clockIn && todayEntry?.clockOut;

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full p-4 rounded-xl border transition-all duration-200 text-left",
        "hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]",
        "bg-card border-border",
        isClockedIn && "ring-2 ring-clockIn border-clockIn/30",
        hasCompleted && "border-muted"
      )}
    >
      <div className="flex items-center gap-4">
        {/* Avatar */}
        <div className={cn(
          "w-12 h-12 rounded-full flex items-center justify-center text-lg font-semibold",
          isClockedIn 
            ? "bg-clockIn/20 text-clockIn" 
            : "bg-secondary text-secondary-foreground"
        )}>
          {employee.name.split(' ').map(n => n[0]).join('')}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-foreground truncate">{employee.name}</h3>
          <p className="text-sm text-muted-foreground">{employee.role || employee.department}</p>
        </div>

        {/* Status */}
        <div className="flex flex-col items-end gap-1">
          {isClockedIn ? (
            <>
              <span className="status-badge bg-clockIn/20 text-clockIn">
                <span className="w-1.5 h-1.5 rounded-full bg-clockIn animate-pulse-soft" />
                Working
              </span>
              <span className="text-xs text-muted-foreground">
                Since {todayEntry.clockIn}
              </span>
            </>
          ) : hasCompleted ? (
            <>
              <span className="status-badge bg-muted text-muted-foreground">
                Completed
              </span>
              <span className="text-xs text-muted-foreground">
                {todayEntry.clockIn} - {todayEntry.clockOut}
              </span>
            </>
          ) : (
            <span className="status-badge bg-secondary text-secondary-foreground">
              Not clocked in
            </span>
          )}
        </div>
      </div>
    </button>
  );
}

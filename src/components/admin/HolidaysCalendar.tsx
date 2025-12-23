import { useHolidays } from '@/hooks/useHolidays';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CalendarDays, Sparkles } from 'lucide-react';
import { format, parseISO, getMonth, getYear } from 'date-fns';
import { sk } from 'date-fns/locale';

export function HolidaysCalendar() {
  const { data: holidays = [], isLoading } = useHolidays();

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Načítavam sviatky...</p>
      </div>
    );
  }

  // Group holidays by year and month
  const groupedByYear = holidays.reduce((acc, holiday) => {
    const date = parseISO(holiday.date);
    const year = getYear(date);
    const month = getMonth(date);
    
    if (!acc[year]) {
      acc[year] = {};
    }
    if (!acc[year][month]) {
      acc[year][month] = [];
    }
    acc[year][month].push(holiday);
    return acc;
  }, {} as Record<number, Record<number, typeof holidays>>);

  const monthNames = [
    'Január', 'Február', 'Marec', 'Apríl', 'Máj', 'Jún',
    'Júl', 'August', 'September', 'Október', 'November', 'December'
  ];

  const years = Object.keys(groupedByYear).map(Number).sort((a, b) => a - b);

  if (holidays.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <CalendarDays className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Žiadne sviatky nie sú nastavené</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-primary/10">
          <Sparkles className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h2 className="text-lg font-semibold">Štátne sviatky</h2>
          <p className="text-sm text-muted-foreground">
            Celkom {holidays.length} sviatkov
          </p>
        </div>
      </div>

      {years.map(year => (
        <div key={year} className="space-y-4">
          <h3 className="text-xl font-bold text-primary">{year}</h3>
          
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Object.entries(groupedByYear[year])
              .sort(([a], [b]) => Number(a) - Number(b))
              .map(([month, monthHolidays]) => (
                <Card key={month} className="overflow-hidden">
                  <CardHeader className="py-3 bg-muted/50">
                    <CardTitle className="text-sm font-medium">
                      {monthNames[Number(month)]}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <ul className="divide-y divide-border">
                      {monthHolidays.map(holiday => {
                        const date = parseISO(holiday.date);
                        const dayName = format(date, 'EEEE', { locale: sk });
                        const dayNumber = format(date, 'd');
                        
                        return (
                          <li 
                            key={holiday.id} 
                            className="flex items-center gap-3 p-3 hover:bg-muted/30 transition-colors"
                          >
                            <div className="flex flex-col items-center justify-center w-10 h-10 rounded-lg bg-primary/10 text-primary font-bold">
                              <span className="text-lg leading-none">{dayNumber}</span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm truncate">
                                {holiday.name}
                              </p>
                              <p className="text-xs text-muted-foreground capitalize">
                                {dayName}
                              </p>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  </CardContent>
                </Card>
              ))}
          </div>
        </div>
      ))}
    </div>
  );
}

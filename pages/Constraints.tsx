import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Constraint, ConstraintType, ScheduleStatus } from '../types';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isWeekend, addMonths } from 'date-fns';
import { Button } from '../components/ui/Button';
import { Check, X, Sun, Moon, Coffee, ChevronLeft, ChevronRight } from 'lucide-react';

export const Constraints: React.FC = () => {
  const { user } = useAuth();
  const [constraints, setConstraints] = useState<Constraint[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [scheduleStatus, setScheduleStatus] = useState<ScheduleStatus>(ScheduleStatus.DRAFT);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      const [myConstraints, schedule] = await Promise.all([
        api.getConstraints(user.id),
        api.getSchedule()
      ]);
      setConstraints(myConstraints);
      setScheduleStatus(schedule.status);
      setLoading(false);
    };
    fetchData();
  }, [user]);

  const handleSetConstraint = async (date: Date, type: ConstraintType) => {
    if (scheduleStatus !== ScheduleStatus.DRAFT || !user) return; // Read-only logic

    const dateStr = format(date, 'yyyy-MM-dd');
    const newConstraint: Constraint = {
      id: Math.random().toString(),
      userId: user.id,
      date: dateStr,
      type: type,
    };

    // Optimistic update
    const existingIdx = constraints.findIndex(c => c.date === dateStr);
    const newConstraints = [...constraints];
    if (existingIdx >= 0) {
        if (type === ConstraintType.NONE) {
            newConstraints.splice(existingIdx, 1);
        } else {
            newConstraints[existingIdx] = newConstraint;
        }
    } else if (type !== ConstraintType.NONE) {
        newConstraints.push(newConstraint);
    }
    setConstraints(newConstraints);

    await api.upsertConstraint(newConstraint);
  };

  if (loading) return <div>Loading...</div>;

  const isReadOnly = scheduleStatus !== ScheduleStatus.DRAFT;
  const monthStart = startOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: endOfMonth(currentMonth) });

  const getTypeIcon = (type: ConstraintType) => {
      switch(type) {
          case ConstraintType.ALL_DAY: return <X className="w-4 h-4" />;
          case ConstraintType.MORNING_ONLY: return <Coffee className="w-4 h-4" />;
          case ConstraintType.EVENING_ONLY: return <Moon className="w-4 h-4" />;
          default: return null;
      }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
            <h1 className="text-2xl font-bold text-slate-900">Availability</h1>
            <p className="text-slate-500">
                {isReadOnly 
                    ? "Schedule is locked. You cannot modify availability." 
                    : "Submit your unavailability for the upcoming cycle."}
            </p>
        </div>
        <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" onClick={() => setCurrentMonth(m => addMonths(m, -1))}><ChevronLeft className="w-4 h-4"/></Button>
            <span className="font-medium min-w-[100px] text-center">{format(currentMonth, 'MMMM yyyy')}</span>
            <Button variant="outline" size="sm" onClick={() => setCurrentMonth(m => addMonths(m, 1))}><ChevronRight className="w-4 h-4"/></Button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-px bg-slate-200 rounded-xl overflow-hidden shadow-sm border border-slate-200">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="bg-slate-50 p-3 text-center text-sm font-medium text-slate-500">
            {day}
          </div>
        ))}
        {days.map((day, i) => {
            const dateStr = format(day, 'yyyy-MM-dd');
            const constraint = constraints.find(c => c.date === dateStr);
            const isOff = constraint?.type === ConstraintType.ALL_DAY;
            const isDayOff = isWeekend(day) && day.getDay() === 6; // Saturday closed

            return (
                <div key={dateStr} className={`bg-white min-h-[120px] p-2 flex flex-col justify-between transition-colors ${isDayOff ? 'bg-slate-50' : ''}`}>
                    <div className="flex justify-between items-start">
                        <span className={`text-sm font-medium ${isSameMonth(day, currentMonth) ? 'text-slate-700' : 'text-slate-300'}`}>
                            {format(day, 'd')}
                        </span>
                        {constraint && (
                            <span className={`p-1 rounded-md text-xs font-bold flex items-center
                                ${isOff ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}
                            `}>
                                {getTypeIcon(constraint.type)}
                            </span>
                        )}
                    </div>

                    {!isDayOff && !isReadOnly && (
                        <div className="grid grid-cols-3 gap-1 mt-2">
                             <button 
                                onClick={() => handleSetConstraint(day, ConstraintType.NONE)}
                                className={`text-xs p-1 rounded border flex justify-center ${!constraint ? 'bg-green-50 border-green-200 text-green-700 ring-1 ring-green-500' : 'border-slate-100 text-slate-400'}`}
                                title="Available"
                             >
                                 <Check className="w-3 h-3" />
                             </button>
                             <button 
                                onClick={() => handleSetConstraint(day, ConstraintType.MORNING_ONLY)}
                                className={`text-xs p-1 rounded border flex justify-center ${constraint?.type === ConstraintType.MORNING_ONLY ? 'bg-amber-50 border-amber-200 text-amber-700 ring-1 ring-amber-500' : 'border-slate-100 text-slate-400'}`}
                                title="No Morning"
                             >
                                 <Sun className="w-3 h-3" />
                             </button>
                             <button 
                                onClick={() => handleSetConstraint(day, ConstraintType.EVENING_ONLY)}
                                className={`text-xs p-1 rounded border flex justify-center ${constraint?.type === ConstraintType.EVENING_ONLY ? 'bg-amber-50 border-amber-200 text-amber-700 ring-1 ring-amber-500' : 'border-slate-100 text-slate-400'}`}
                                title="No Evening"
                             >
                                 <Moon className="w-3 h-3" />
                             </button>
                             <button 
                                onClick={() => handleSetConstraint(day, ConstraintType.ALL_DAY)}
                                className={`col-span-3 text-xs p-1 rounded border flex justify-center ${constraint?.type === ConstraintType.ALL_DAY ? 'bg-red-50 border-red-200 text-red-700 ring-1 ring-red-500' : 'border-slate-100 text-slate-400'}`}
                                title="Unavailable All Day"
                             >
                                 Unavailable
                             </button>
                        </div>
                    )}
                </div>
            );
        })}
      </div>
      
      <div className="mt-6 flex gap-6 text-sm text-slate-600">
          <div className="flex items-center"><div className="w-3 h-3 rounded bg-green-100 border border-green-200 mr-2"></div>Available</div>
          <div className="flex items-center"><div className="w-3 h-3 rounded bg-amber-100 border border-amber-200 mr-2"></div>Partial Unavailable</div>
          <div className="flex items-center"><div className="w-3 h-3 rounded bg-red-100 border border-red-200 mr-2"></div>Fully Unavailable</div>
      </div>
    </div>
  );
};

import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Schedule, Shift, User, StaffRole, Assignment, ScheduleStatus } from '../types';
import { Button } from '../components/ui/Button';
import { Lock, Globe, Wand2, ChevronLeft, ChevronRight, AlertTriangle, Check, UserPlus, X } from 'lucide-react';
import { format, parseISO, startOfWeek, addDays, isSameDay } from 'date-fns';

export const ScheduleBuilder: React.FC = () => {
  const [schedule, setSchedule] = useState<Schedule | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedShift, setSelectedShift] = useState<Shift | null>(null);
  const [isAutoAssigning, setIsAutoAssigning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Mock week navigation
  const [currentWeekStart, setCurrentWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 0 }));

  const fetchSchedule = async () => {
      const schedRes = await api.getSchedule();
      if (schedRes.success && schedRes.data) {
          setSchedule(schedRes.data);
          // Update selected shift ref if open
          if (selectedShift) {
              const updated = schedRes.data.shifts.find(s => s.id === selectedShift.id);
              if (updated) setSelectedShift(updated);
          }
      } else {
          setError(schedRes.error || 'Failed to load schedule');
      }
  };

  useEffect(() => {
    const loadData = async () => {
      const [schedRes, userRes] = await Promise.all([
        api.getSchedule(),
        api.getOrgUsers()
      ]);
      
      if (schedRes.success && schedRes.data) setSchedule(schedRes.data);
      else setError(schedRes.error || null);

      if (userRes.success && userRes.data) setUsers(userRes.data);
      
      setLoading(false);
    };
    loadData();
  }, []);

  const handleAutoAssign = async () => {
    setIsAutoAssigning(true);
    setError(null);
    const res = await api.autoAssign();
    if (res.success) {
        await fetchSchedule();
    } else {
        setError(res.error || 'Auto-assign failed');
    }
    setIsAutoAssigning(false);
  };

  const toggleStatus = async () => {
    if (!schedule) return;
    const newStatus = schedule.status === ScheduleStatus.DRAFT 
      ? ScheduleStatus.LOCKED 
      : schedule.status === ScheduleStatus.LOCKED 
        ? ScheduleStatus.PUBLISHED 
        : ScheduleStatus.DRAFT;
    
    const res = await api.updateScheduleStatus(newStatus);
    if (res.success) {
        setSchedule({ ...schedule, status: newStatus });
    } else {
        setError(res.error || 'Failed to update status');
    }
  };

  const handleAssign = async (userId: string, role: StaffRole) => {
    if (!selectedShift) return;
    setError(null);
    
    // First attempt (normal)
    let res = await api.assignShift(selectedShift.id, userId, role, false);

    // If capacity error OR constraint error, ask for force override
    if (!res.success && res.error && (res.error.includes("Shift is full") || res.error.includes("constraint"))) {
        const confirmForce = window.confirm(`${res.error}.\n\nDo you want to force assign this worker anyway? (Manual Override)`);
        if (confirmForce) {
            res = await api.assignShift(selectedShift.id, userId, role, true);
        }
    }

    if (res.success) {
        await fetchSchedule();
    } else {
        setError(res.error || 'Assignment failed');
    }
  };

  const handleRemove = async (userId: string) => {
    if (!selectedShift) return;
    setError(null);
    const res = await api.removeAssignment(selectedShift.id, userId);
    if (res.success) {
        await fetchSchedule();
    } else {
        setError(res.error || 'Removal failed');
    }
  };

  if (loading) return <div className="flex justify-center p-12"><div className="animate-spin h-8 w-8 border-4 border-primary-600 rounded-full border-t-transparent"></div></div>;
  if (!schedule) return <div className="p-8 text-red-500">Error loading schedule: {error}</div>;

  const weekShifts = schedule.shifts.filter(s => {
      const d = parseISO(s.date);
      return d >= currentWeekStart && d < addDays(currentWeekStart, 7);
  });

  // Helper to render a cell
  const ShiftCell = ({ shift }: { shift: Shift }) => {
    const vetCount = shift.assignments.filter(a => a.role === StaffRole.VET).length;
    const asstCount = shift.assignments.filter(a => a.role === StaffRole.ASSISTANT).length;
    const isFull = vetCount >= shift.requirements.VET && asstCount >= shift.requirements.ASSISTANT;

    return (
      <div 
        onClick={() => setSelectedShift(shift)}
        className={`
          p-3 rounded-lg border transition-all cursor-pointer hover:shadow-md h-full flex flex-col justify-between
          ${selectedShift?.id === shift.id ? 'ring-2 ring-primary-500 border-primary-500' : 'border-slate-200 bg-white'}
        `}
      >
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs font-bold text-slate-500 uppercase">{shift.label}</span>
          {isFull ? <Check className="w-4 h-4 text-green-500" /> : <AlertTriangle className="w-4 h-4 text-amber-400" />}
        </div>
        <div className="space-y-1">
          <div className="flex justify-between text-xs">
            <span>Vet</span>
            <span className={`${vetCount < shift.requirements.VET ? 'text-red-500 font-bold' : 'text-slate-600'}`}>
              {vetCount}/{shift.requirements.VET}
            </span>
          </div>
          <div className="flex justify-between text-xs">
            <span>Asst</span>
            <span className={`${asstCount < shift.requirements.ASSISTANT ? 'text-red-500 font-bold' : 'text-slate-600'}`}>
              {asstCount}/{shift.requirements.ASSISTANT}
            </span>
          </div>
        </div>
        <div className="mt-2 flex -space-x-2 overflow-hidden">
           {shift.assignments.map((a, i) => {
               const u = users.find(user => user.id === a.userId);
               return (
                   <img key={i} className="inline-block h-6 w-6 rounded-full ring-2 ring-white" src={u?.photoUrl} alt="" />
               )
           })}
        </div>
      </div>
    );
  };

  return (
    <div className="flex h-[calc(100vh-6rem)] flex-col">
      {/* Toolbar */}
      <div className="flex items-center justify-between mb-6 bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
        <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold text-slate-800">{schedule.title}</h1>
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium
                ${schedule.status === 'PUBLISHED' ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-800'}
            `}>
                {schedule.status}
            </span>
        </div>
        <div className="flex items-center gap-3">
            <Button variant="outline" onClick={handleAutoAssign} disabled={isAutoAssigning}>
                <Wand2 className={`w-4 h-4 mr-2 ${isAutoAssigning ? 'animate-spin' : ''}`} />
                {isAutoAssigning ? 'Assigning...' : 'Auto-Assign'}
            </Button>
            <div className="h-6 w-px bg-slate-300 mx-2"></div>
            <Button variant={schedule.status === 'LOCKED' ? 'secondary' : 'outline'} onClick={toggleStatus}>
                <Lock className="w-4 h-4 mr-2" />
                {schedule.status === 'LOCKED' ? 'Unlock' : 'Lock'}
            </Button>
            <Button variant={schedule.status === 'PUBLISHED' ? 'ghost' : 'primary'} onClick={toggleStatus} disabled={schedule.status === 'DRAFT'}>
                <Globe className="w-4 h-4 mr-2" />
                Publish
            </Button>
        </div>
      </div>

      {error && (
          <div className="bg-red-50 text-red-700 p-3 rounded-md mb-4 text-sm flex items-center">
              <AlertTriangle className="w-4 h-4 mr-2" />
              {error}
          </div>
      )}

      <div className="flex flex-1 gap-6 overflow-hidden">
        {/* Calendar Grid */}
        <div className="flex-1 bg-white border border-slate-200 rounded-xl overflow-auto p-4">
            <div className="flex items-center justify-center mb-4 space-x-4">
                <button onClick={() => setCurrentWeekStart(d => addDays(d, -7))}><ChevronLeft className="w-5 h-5 text-slate-500" /></button>
                <span className="font-medium text-lg">
                    {format(currentWeekStart, 'MMM d')} - {format(addDays(currentWeekStart, 6), 'MMM d')}
                </span>
                <button onClick={() => setCurrentWeekStart(d => addDays(d, 7))}><ChevronRight className="w-5 h-5 text-slate-500" /></button>
            </div>
            
            <div className="grid grid-cols-7 gap-4 min-w-[800px]">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                    <div key={d} className="text-center font-medium text-slate-400 pb-2 text-sm">{d}</div>
                ))}
                
                {Array.from({ length: 7 }).map((_, i) => {
                    const date = addDays(currentWeekStart, i);
                    const dayShifts = weekShifts.filter(s => isSameDay(parseISO(s.date), date));
                    const amShift = dayShifts.find(s => s.label === 'MORNING');
                    const pmShift = dayShifts.find(s => s.label === 'EVENING');
                    
                    return (
                        <div key={i} className="flex flex-col gap-2 min-h-[200px]">
                            <div className="text-center text-sm font-medium mb-1">{format(date, 'd')}</div>
                            {amShift ? <ShiftCell shift={amShift} /> : <div className="flex-1 border border-dashed border-slate-200 rounded-lg flex items-center justify-center bg-slate-50 text-slate-300 text-xs">Closed</div>}
                            {pmShift ? <ShiftCell shift={pmShift} /> : <div className="flex-1 border border-dashed border-slate-200 rounded-lg flex items-center justify-center bg-slate-50 text-slate-300 text-xs">Closed</div>}
                        </div>
                    );
                })}
            </div>
        </div>

        {/* Side Panel: Shift Details & Staffing */}
        {selectedShift && (
             <div className="w-80 bg-white border border-slate-200 rounded-xl shadow-lg flex flex-col">
                <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-xl">
                    <div>
                        <h3 className="font-bold text-slate-800">{format(parseISO(selectedShift.date), 'EEE, MMM d')}</h3>
                        <p className="text-sm text-slate-500">{selectedShift.label} ({selectedShift.startTime} - {selectedShift.endTime})</p>
                    </div>
                    <button onClick={() => setSelectedShift(null)}><X className="w-5 h-5 text-slate-400" /></button>
                </div>
                
                <div className="flex-1 overflow-y-auto p-4 space-y-6">
                    {/* Assigned */}
                    <div>
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Assigned Staff</h4>
                        <div className="space-y-2">
                            {selectedShift.assignments.length === 0 && <p className="text-sm text-slate-400 italic">No assignments yet.</p>}
                            {selectedShift.assignments.map(assign => {
                                const u = users.find(user => user.id === assign.userId);
                                if(!u) return null;
                                return (
                                    <div key={assign.id} className="flex items-center justify-between p-2 bg-slate-50 rounded-md border border-slate-100">
                                        <div className="flex items-center">
                                            <img src={u.photoUrl} className="w-8 h-8 rounded-full mr-2" alt=""/>
                                            <div>
                                                <p className="text-sm font-medium">{u.name}</p>
                                                <p className="text-xs text-slate-500">{assign.role}</p>
                                            </div>
                                        </div>
                                        <button onClick={() => handleRemove(u.id)} className="text-red-400 hover:text-red-600">
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                )
                            })}
                        </div>
                    </div>

                    {/* Eligible */}
                    <div>
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Eligible Staff</h4>
                        {/* Vets */}
                        <p className="text-xs font-medium text-primary-600 mb-1">Veterinarians</p>
                        <div className="space-y-1 mb-3">
                            {users.filter(u => u.staffRole === StaffRole.VET && !selectedShift.assignments.find(a => a.userId === u.id)).map(u => (
                                <div key={u.id} className="flex items-center justify-between p-2 hover:bg-slate-50 rounded-md cursor-pointer group">
                                    <div className="flex items-center">
                                        <div className="w-6 h-6 rounded-full bg-primary-100 text-primary-600 text-xs flex items-center justify-center font-bold mr-2">V</div>
                                        <span className="text-sm text-slate-700">{u.name}</span>
                                    </div>
                                    <button 
                                        onClick={() => handleAssign(u.id, StaffRole.VET)}
                                        className="opacity-0 group-hover:opacity-100 text-primary-600 hover:bg-primary-50 p-1 rounded"
                                    >
                                        <UserPlus className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                        </div>

                        {/* Assistants */}
                         <p className="text-xs font-medium text-secondary-600 mb-1">Assistants</p>
                         <div className="space-y-1">
                            {users.filter(u => u.staffRole === StaffRole.ASSISTANT && !selectedShift.assignments.find(a => a.userId === u.id)).map(u => (
                                <div key={u.id} className="flex items-center justify-between p-2 hover:bg-slate-50 rounded-md cursor-pointer group">
                                    <div className="flex items-center">
                                        <div className="w-6 h-6 rounded-full bg-secondary-100 text-secondary-600 text-xs flex items-center justify-center font-bold mr-2">A</div>
                                        <span className="text-sm text-slate-700">{u.name}</span>
                                    </div>
                                    <button 
                                        onClick={() => handleAssign(u.id, StaffRole.ASSISTANT)}
                                        className="opacity-0 group-hover:opacity-100 text-secondary-600 hover:bg-secondary-50 p-1 rounded"
                                    >
                                        <UserPlus className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
             </div>
        )}
      </div>
    </div>
  );
};
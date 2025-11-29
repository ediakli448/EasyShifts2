import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { OrgSettings, DayOfWeek, ShiftLabel, StaffRole } from '../types';
import { Button } from '../components/ui/Button';
import { Clock, Save, Users, Settings as SettingsIcon, AlertTriangle, CheckCircle, Sun, Moon } from 'lucide-react';

export const Settings: React.FC = () => {
  const [settings, setSettings] = useState<OrgSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const days: DayOfWeek[] = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  useEffect(() => {
    const fetchSettings = async () => {
      const res = await api.getSettings();
      if (res.success && res.data) {
        setSettings(res.data);
      } else {
        setError(res.error || 'Failed to load settings');
      }
      setLoading(false);
    };
    fetchSettings();
  }, []);

  const handleSave = async () => {
    if (!settings) return;
    setSaving(true);
    setError(null);
    setSuccess(null);
    
    const res = await api.updateSettings(settings);
    if (res.success) {
      setSuccess('Settings updated successfully');
    } else {
      setError(res.error || 'Failed to save settings');
    }
    setSaving(false);
  };

  const updateIsOpen = (day: DayOfWeek, isOpen: boolean) => {
    if (!settings) return;
    setSettings({
      ...settings,
      weeklyHours: {
        ...settings.weeklyHours,
        [day]: {
          ...settings.weeklyHours[day],
          isOpen
        }
      }
    });
  };

  const updateShiftTime = (day: DayOfWeek, shift: ShiftLabel, field: 'start' | 'end', value: string) => {
    if (!settings) return;
    setSettings({
      ...settings,
      weeklyHours: {
        ...settings.weeklyHours,
        [day]: {
          ...settings.weeklyHours[day],
          shifts: {
             ...settings.weeklyHours[day].shifts,
             [shift]: {
                ...settings.weeklyHours[day].shifts[shift],
                [field]: value
             }
          }
        }
      }
    });
  };

  const updateRequirements = (shift: ShiftLabel, role: StaffRole, change: number) => {
    if (!settings) return;
    const current = settings.defaultRequirements[shift][role];
    const newValue = Math.max(0, current + change); // Prevent negative

    setSettings({
      ...settings,
      defaultRequirements: {
        ...settings.defaultRequirements,
        [shift]: {
          ...settings.defaultRequirements[shift],
          [role]: newValue
        }
      }
    });
  };

  if (loading) return <div className="p-8 text-center text-slate-500">Loading settings...</div>;
  if (!settings) return <div className="p-8 text-center text-red-500">Error: {error}</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Clinic Settings</h1>
          <p className="text-slate-500">Configure operating hours and shift requirements</p>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          <Save className="w-4 h-4 mr-2" />
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>

      {success && (
        <div className="bg-green-50 text-green-800 p-4 rounded-lg flex items-center border border-green-200">
          <CheckCircle className="w-5 h-5 mr-3" />
          {success}
        </div>
      )}
      
      {error && (
        <div className="bg-red-50 text-red-800 p-4 rounded-lg flex items-center border border-red-200">
          <AlertTriangle className="w-5 h-5 mr-3" />
          {error}
        </div>
      )}

      {/* Operating Hours Section */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center">
          <Clock className="w-5 h-5 text-slate-500 mr-2" />
          <h2 className="font-semibold text-slate-800">Shift Timings (Per Day)</h2>
        </div>
        <div className="p-6">
          <div className="grid gap-6">
            {days.map(day => {
              const dayConfig = settings.weeklyHours[day];
              return (
                <div key={day} className="flex flex-col md:flex-row md:items-start py-4 border-b border-slate-50 last:border-0 gap-4 md:gap-8">
                  <div className="flex items-center w-32 pt-2">
                    <label className="flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={dayConfig.isOpen}
                        onChange={(e) => updateIsOpen(day, e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                      <span className="ml-3 font-bold text-slate-900">{day}</span>
                    </label>
                  </div>
                  
                  {dayConfig.isOpen ? (
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in slide-in-from-left-2 duration-200">
                       {/* Morning Input */}
                       <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 flex items-center gap-3">
                          <Sun className="w-4 h-4 text-amber-500 shrink-0" />
                          <div className="flex-1">
                              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1">Morning</span>
                              <div className="flex items-center gap-2">
                                <input 
                                  type="time" 
                                  value={dayConfig.shifts.MORNING.start}
                                  onChange={(e) => updateShiftTime(day, ShiftLabel.MORNING, 'start', e.target.value)}
                                  className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-sm focus:ring-1 focus:ring-primary-500"
                                />
                                <span className="text-slate-400">-</span>
                                <input 
                                  type="time" 
                                  value={dayConfig.shifts.MORNING.end}
                                  onChange={(e) => updateShiftTime(day, ShiftLabel.MORNING, 'end', e.target.value)}
                                  className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-sm focus:ring-1 focus:ring-primary-500"
                                />
                              </div>
                          </div>
                       </div>

                       {/* Evening Input */}
                       <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 flex items-center gap-3">
                          <Moon className="w-4 h-4 text-indigo-500 shrink-0" />
                          <div className="flex-1">
                              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1">Evening</span>
                              <div className="flex items-center gap-2">
                                <input 
                                  type="time" 
                                  value={dayConfig.shifts.EVENING.start}
                                  onChange={(e) => updateShiftTime(day, ShiftLabel.EVENING, 'start', e.target.value)}
                                  className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-sm focus:ring-1 focus:ring-primary-500"
                                />
                                <span className="text-slate-400">-</span>
                                <input 
                                  type="time" 
                                  value={dayConfig.shifts.EVENING.end}
                                  onChange={(e) => updateShiftTime(day, ShiftLabel.EVENING, 'end', e.target.value)}
                                  className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-sm focus:ring-1 focus:ring-primary-500"
                                />
                              </div>
                          </div>
                       </div>
                    </div>
                  ) : (
                    <div className="flex-1 flex items-center h-full min-h-[60px]">
                      <span className="text-slate-400 text-sm italic">Closed</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Shift Requirements Section */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center">
          <Users className="w-5 h-5 text-slate-500 mr-2" />
          <h2 className="font-semibold text-slate-800">Default Staff Requirements</h2>
        </div>
        <div className="p-6">
          <div className="grid md:grid-cols-2 gap-8">
            
            {/* Morning Config */}
            <div className="space-y-4">
              <h3 className="font-medium text-slate-700 flex items-center border-b pb-2">
                <span className="w-2 h-2 bg-yellow-400 rounded-full mr-2"></span>
                Morning Shifts
              </h3>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Veterinarians</span>
                <div className="flex items-center border border-slate-200 rounded-lg">
                  <button 
                    onClick={() => updateRequirements(ShiftLabel.MORNING, StaffRole.VET, -1)}
                    className="px-3 py-1 hover:bg-slate-50 text-slate-600 border-r border-slate-200"
                  >-</button>
                  <span className="px-4 py-1 text-sm font-medium w-8 text-center">{settings.defaultRequirements.MORNING.VET}</span>
                  <button 
                    onClick={() => updateRequirements(ShiftLabel.MORNING, StaffRole.VET, 1)}
                    className="px-3 py-1 hover:bg-slate-50 text-slate-600 border-l border-slate-200"
                  >+</button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Assistants</span>
                <div className="flex items-center border border-slate-200 rounded-lg">
                  <button 
                    onClick={() => updateRequirements(ShiftLabel.MORNING, StaffRole.ASSISTANT, -1)}
                    className="px-3 py-1 hover:bg-slate-50 text-slate-600 border-r border-slate-200"
                  >-</button>
                  <span className="px-4 py-1 text-sm font-medium w-8 text-center">{settings.defaultRequirements.MORNING.ASSISTANT}</span>
                  <button 
                    onClick={() => updateRequirements(ShiftLabel.MORNING, StaffRole.ASSISTANT, 1)}
                    className="px-3 py-1 hover:bg-slate-50 text-slate-600 border-l border-slate-200"
                  >+</button>
                </div>
              </div>
            </div>

            {/* Evening Config */}
            <div className="space-y-4">
              <h3 className="font-medium text-slate-700 flex items-center border-b pb-2">
                <span className="w-2 h-2 bg-indigo-400 rounded-full mr-2"></span>
                Evening Shifts
              </h3>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Veterinarians</span>
                <div className="flex items-center border border-slate-200 rounded-lg">
                  <button 
                    onClick={() => updateRequirements(ShiftLabel.EVENING, StaffRole.VET, -1)}
                    className="px-3 py-1 hover:bg-slate-50 text-slate-600 border-r border-slate-200"
                  >-</button>
                  <span className="px-4 py-1 text-sm font-medium w-8 text-center">{settings.defaultRequirements.EVENING.VET}</span>
                  <button 
                    onClick={() => updateRequirements(ShiftLabel.EVENING, StaffRole.VET, 1)}
                    className="px-3 py-1 hover:bg-slate-50 text-slate-600 border-l border-slate-200"
                  >+</button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Assistants</span>
                <div className="flex items-center border border-slate-200 rounded-lg">
                  <button 
                    onClick={() => updateRequirements(ShiftLabel.EVENING, StaffRole.ASSISTANT, -1)}
                    className="px-3 py-1 hover:bg-slate-50 text-slate-600 border-r border-slate-200"
                  >-</button>
                  <span className="px-4 py-1 text-sm font-medium w-8 text-center">{settings.defaultRequirements.EVENING.ASSISTANT}</span>
                  <button 
                    onClick={() => updateRequirements(ShiftLabel.EVENING, StaffRole.ASSISTANT, 1)}
                    className="px-3 py-1 hover:bg-slate-50 text-slate-600 border-l border-slate-200"
                  >+</button>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};
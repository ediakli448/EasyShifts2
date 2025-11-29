import { Role, StaffRole, ScheduleStatus, ShiftLabel, User, Schedule, Constraint, ConstraintType, SwapStatus, SwapRequest, OrgSettings, DayOfWeek } from '../types';
import { addDays, format, startOfWeek } from 'date-fns';

// Helpers
const today = new Date();
const startOfCurrentWeek = startOfWeek(today, { weekStartsOn: 0 });

/* 
  NOTE: This is mock data for development/demonstration purposes only.
  Do NOT use this data in a production environment.
*/

// Users
export const MOCK_USERS: User[] = [
  { id: 'u1', name: 'Admin User', email: 'admin@example.com', role: Role.ADMIN, staffRole: StaffRole.VET, photoUrl: 'https://ui-avatars.com/api/?name=Admin+User&background=0ea5e9&color=fff' },
  { id: 'u2', name: 'Vet User 1', email: 'vet1@example.com', role: Role.WORKER, staffRole: StaffRole.VET, photoUrl: 'https://ui-avatars.com/api/?name=Vet+One&background=random' },
  { id: 'u3', name: 'Vet User 2', email: 'vet2@example.com', role: Role.WORKER, staffRole: StaffRole.VET, photoUrl: 'https://ui-avatars.com/api/?name=Vet+Two&background=random' },
  { id: 'u4', name: 'Assistant 1', email: 'asst1@example.com', role: Role.WORKER, staffRole: StaffRole.ASSISTANT, photoUrl: 'https://ui-avatars.com/api/?name=Asst+One&background=random' },
  { id: 'u5', name: 'Assistant 2', email: 'asst2@example.com', role: Role.WORKER, staffRole: StaffRole.ASSISTANT, photoUrl: 'https://ui-avatars.com/api/?name=Asst+Two&background=random' },
  { id: 'u6', name: 'Assistant 3', email: 'asst3@example.com', role: Role.WORKER, staffRole: StaffRole.ASSISTANT, photoUrl: 'https://ui-avatars.com/api/?name=Asst+Three&background=random' },
  { id: 'u7', name: 'Assistant 4', email: 'asst4@example.com', role: Role.WORKER, staffRole: StaffRole.ASSISTANT, photoUrl: 'https://ui-avatars.com/api/?name=Asst+Four&background=random' },
];

// Generate Shifts for 2 weeks
const generateShifts = (): Schedule['shifts'] => {
  const shifts = [];
  for (let i = 0; i < 14; i++) {
    const date = addDays(startOfCurrentWeek, i);
    const dateStr = format(date, 'yyyy-MM-dd');
    const dayOfWeek = date.getDay();

    if (dayOfWeek === 6) continue; // Closed Saturday

    // Morning Shift
    shifts.push({
      id: `s-${dateStr}-AM`,
      date: dateStr,
      label: ShiftLabel.MORNING,
      startTime: '09:00',
      endTime: '15:00',
      requirements: { [StaffRole.VET]: 1, [StaffRole.ASSISTANT]: 2 },
      assignments: []
    });

    // Evening Shift (Short on Fri)
    if (dayOfWeek !== 5) {
      shifts.push({
        id: `s-${dateStr}-PM`,
        date: dateStr,
        label: ShiftLabel.EVENING,
        startTime: '15:00',
        endTime: '21:00',
        requirements: { [StaffRole.VET]: 1, [StaffRole.ASSISTANT]: 2 },
        assignments: []
      });
    }
  }
  return shifts;
};

export const MOCK_SCHEDULE: Schedule = {
  id: 'sch_1',
  title: 'Current Cycle',
  startDate: format(startOfCurrentWeek, 'yyyy-MM-dd'),
  endDate: format(addDays(startOfCurrentWeek, 13), 'yyyy-MM-dd'),
  status: ScheduleStatus.DRAFT,
  submissionDeadline: format(addDays(today, 2), 'yyyy-MM-dd'),
  shifts: generateShifts(),
};

// Some initial constraints
export const MOCK_CONSTRAINTS: Constraint[] = [
  { id: 'c1', userId: 'u2', date: format(addDays(startOfCurrentWeek, 1), 'yyyy-MM-dd'), type: ConstraintType.MORNING_ONLY },
  { id: 'c2', userId: 'u4', date: format(addDays(startOfCurrentWeek, 2), 'yyyy-MM-dd'), type: ConstraintType.ALL_DAY, note: "Personal leave" },
];

// Swap Requests
export const MOCK_SWAPS: SwapRequest[] = [
  {
    id: 'sw1',
    shiftId: 's-temp-1',
    requesterId: 'u4',
    requesterName: 'Assistant 1',
    shiftDate: format(addDays(today, 3), 'yyyy-MM-dd'),
    shiftLabel: ShiftLabel.MORNING,
    status: SwapStatus.ADMIN_APPROVAL,
    offers: [
      { id: 'off1', offerUserId: 'u5', offerUserName: 'Assistant 2' }
    ]
  }
];

// Settings
const defaultShiftTimes = {
  [ShiftLabel.MORNING]: { start: '09:00', end: '15:00' },
  [ShiftLabel.EVENING]: { start: '15:00', end: '21:00' },
};

const defaultDay = { 
  isOpen: true, 
  shifts: defaultShiftTimes 
};

export const MOCK_SETTINGS: OrgSettings = {
  weeklyHours: {
    'Sun': JSON.parse(JSON.stringify(defaultDay)),
    'Mon': JSON.parse(JSON.stringify(defaultDay)),
    'Tue': JSON.parse(JSON.stringify(defaultDay)),
    'Wed': JSON.parse(JSON.stringify(defaultDay)),
    'Thu': JSON.parse(JSON.stringify(defaultDay)),
    'Fri': { 
      isOpen: true, 
      shifts: {
        [ShiftLabel.MORNING]: { start: '09:00', end: '14:00' },
        [ShiftLabel.EVENING]: { start: '14:00', end: '18:00' }, // Hypothetical short evening
      }
    },
    'Sat': { 
      isOpen: false, 
      shifts: defaultShiftTimes
    },
  },
  defaultRequirements: {
    [ShiftLabel.MORNING]: { [StaffRole.VET]: 1, [StaffRole.ASSISTANT]: 2 },
    [ShiftLabel.EVENING]: { [StaffRole.VET]: 1, [StaffRole.ASSISTANT]: 2 },
  }
};
import { Role, StaffRole, ScheduleStatus, ShiftLabel, User, Schedule, Constraint, ConstraintType, SwapStatus, SwapRequest } from '../types';
import { addDays, format, startOfWeek } from 'date-fns';

// Helpers
const today = new Date();
const startOfCurrentWeek = startOfWeek(today, { weekStartsOn: 0 });

// Users
export const MOCK_USERS: User[] = [
  { id: 'u1', name: 'Dr. Alice Admin', email: 'alice@vet.com', role: Role.ADMIN, staffRole: StaffRole.VET, photoUrl: 'https://picsum.photos/id/64/200/200' },
  { id: 'u2', name: 'Dr. Bob Smith', email: 'bob@vet.com', role: Role.WORKER, staffRole: StaffRole.VET, photoUrl: 'https://picsum.photos/id/65/200/200' },
  { id: 'u3', name: 'Dr. Carol Jones', email: 'carol@vet.com', role: Role.WORKER, staffRole: StaffRole.VET, photoUrl: 'https://picsum.photos/id/66/200/200' },
  { id: 'u4', name: 'Dave Assistant', email: 'dave@vet.com', role: Role.WORKER, staffRole: StaffRole.ASSISTANT, photoUrl: 'https://picsum.photos/id/67/200/200' },
  { id: 'u5', name: 'Eve Assistant', email: 'eve@vet.com', role: Role.WORKER, staffRole: StaffRole.ASSISTANT, photoUrl: 'https://picsum.photos/id/68/200/200' },
  { id: 'u6', name: 'Frank Assistant', email: 'frank@vet.com', role: Role.WORKER, staffRole: StaffRole.ASSISTANT, photoUrl: 'https://picsum.photos/id/69/200/200' },
  { id: 'u7', name: 'Grace Assistant', email: 'grace@vet.com', role: Role.WORKER, staffRole: StaffRole.ASSISTANT, photoUrl: 'https://picsum.photos/id/70/200/200' },
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
  title: 'October Cycle A',
  startDate: format(startOfCurrentWeek, 'yyyy-MM-dd'),
  endDate: format(addDays(startOfCurrentWeek, 13), 'yyyy-MM-dd'),
  status: ScheduleStatus.DRAFT,
  submissionDeadline: format(addDays(today, 2), 'yyyy-MM-dd'),
  shifts: generateShifts(),
};

// Some initial constraints
export const MOCK_CONSTRAINTS: Constraint[] = [
  { id: 'c1', userId: 'u2', date: format(addDays(startOfCurrentWeek, 1), 'yyyy-MM-dd'), type: ConstraintType.MORNING_ONLY },
  { id: 'c2', userId: 'u4', date: format(addDays(startOfCurrentWeek, 2), 'yyyy-MM-dd'), type: ConstraintType.ALL_DAY, note: "Dentist appointment" },
];

// Swap Requests
export const MOCK_SWAPS: SwapRequest[] = [
  {
    id: 'sw1',
    shiftId: 's-temp-1',
    requesterId: 'u4',
    requesterName: 'Dave Assistant',
    shiftDate: format(addDays(today, 3), 'yyyy-MM-dd'),
    shiftLabel: ShiftLabel.MORNING,
    status: SwapStatus.ADMIN_APPROVAL,
    offers: [
      { id: 'off1', offerUserId: 'u5', offerUserName: 'Eve Assistant' }
    ]
  }
];

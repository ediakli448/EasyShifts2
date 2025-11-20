import { 
  MOCK_SCHEDULE, 
  MOCK_USERS, 
  MOCK_CONSTRAINTS, 
  MOCK_SWAPS 
} from './mockData';
import { 
  Schedule, 
  User, 
  Constraint, 
  Assignment, 
  StaffRole, 
  ConstraintType,
  Shift,
  ScheduleStatus,
  SwapRequest,
  SwapStatus
} from '../types';

// Simulation delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

class ApiService {
  private schedule: Schedule = { ...MOCK_SCHEDULE };
  private constraints: Constraint[] = [...MOCK_CONSTRAINTS];
  private swaps: SwapRequest[] = [...MOCK_SWAPS];

  async getCurrentUser(role: 'ADMIN' | 'WORKER'): Promise<User> {
    await delay(300);
    // Return first user of that role
    return MOCK_USERS.find(u => u.role === role) || MOCK_USERS[0];
  }

  async getOrgUsers(): Promise<User[]> {
    await delay(200);
    return MOCK_USERS;
  }

  async getSchedule(): Promise<Schedule> {
    await delay(400);
    return this.schedule;
  }

  async updateScheduleStatus(status: ScheduleStatus): Promise<void> {
    await delay(300);
    this.schedule.status = status;
  }

  async getConstraints(userId: string): Promise<Constraint[]> {
    await delay(300);
    return this.constraints.filter(c => c.userId === userId);
  }

  async upsertConstraint(constraint: Constraint): Promise<void> {
    await delay(200);
    const idx = this.constraints.findIndex(c => c.userId === constraint.userId && c.date === constraint.date);
    if (idx >= 0) {
      this.constraints[idx] = constraint;
    } else {
      this.constraints.push(constraint);
    }
  }

  async assignShift(shiftId: string, userId: string, role: StaffRole): Promise<void> {
    await delay(100);
    const shift = this.schedule.shifts.find(s => s.id === shiftId);
    if (!shift) return;

    // Remove existing assignment for this role if specific slot logic was strict, 
    // but for now we just append up to limit.
    // Real app would check slot index.
    
    // Ensure user isn't already assigned
    if (shift.assignments.some(a => a.userId === userId)) return;

    const newAssignment: Assignment = {
      id: Math.random().toString(36).substr(2, 9),
      shiftId,
      userId,
      role,
      assignedBy: 'ADMIN'
    };
    shift.assignments.push(newAssignment);
  }

  async removeAssignment(shiftId: string, userId: string): Promise<void> {
    await delay(100);
    const shift = this.schedule.shifts.find(s => s.id === shiftId);
    if (!shift) return;
    shift.assignments = shift.assignments.filter(a => a.userId !== userId);
  }

  async autoAssign(): Promise<void> {
    await delay(1500); // Simulate complex calculation
    
    // Very basic greedy algorithm simulation
    const allUsers = MOCK_USERS;
    
    this.schedule.shifts.forEach(shift => {
        if (shift.assignments.length >= (shift.requirements.VET + shift.requirements.ASSISTANT)) return;

        // Try to fill VETs
        const vetsNeeded = shift.requirements.VET - shift.assignments.filter(a => a.role === StaffRole.VET).length;
        const availableVets = allUsers.filter(u => 
            u.staffRole === StaffRole.VET && 
            !this.isUserUnavail(u.id, shift) &&
            !shift.assignments.find(a => a.userId === u.id)
        );

        availableVets.slice(0, vetsNeeded).forEach(u => {
            shift.assignments.push({
                id: Math.random().toString(),
                shiftId: shift.id,
                userId: u.id,
                role: StaffRole.VET,
                assignedBy: 'AUTO'
            });
        });

        // Try to fill ASSISTANTS
        const asstNeeded = shift.requirements.ASSISTANT - shift.assignments.filter(a => a.role === StaffRole.ASSISTANT).length;
        const availableAsst = allUsers.filter(u => 
            u.staffRole === StaffRole.ASSISTANT && 
            !this.isUserUnavail(u.id, shift) &&
            !shift.assignments.find(a => a.userId === u.id)
        );

        availableAsst.slice(0, asstNeeded).forEach(u => {
            shift.assignments.push({
                id: Math.random().toString(),
                shiftId: shift.id,
                userId: u.id,
                role: StaffRole.ASSISTANT,
                assignedBy: 'AUTO'
            });
        });
    });
  }

  private isUserUnavail(userId: string, shift: Shift): boolean {
      const constraint = this.constraints.find(c => c.userId === userId && c.date === shift.date);
      if (!constraint) return false;
      if (constraint.type === ConstraintType.ALL_DAY) return true;
      if (constraint.type === ConstraintType.MORNING_ONLY && shift.label === 'MORNING') return true;
      if (constraint.type === ConstraintType.EVENING_ONLY && shift.label === 'EVENING') return true;
      return false;
  }

  async getSwaps(): Promise<SwapRequest[]> {
      await delay(300);
      return this.swaps;
  }

  async approveSwap(swapId: string): Promise<void> {
      await delay(300);
      const swap = this.swaps.find(s => s.id === swapId);
      if(swap) swap.status = SwapStatus.APPROVED;
  }
}

export const api = new ApiService();

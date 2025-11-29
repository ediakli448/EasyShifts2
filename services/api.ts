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
  SwapStatus,
  ApiResponse,
  Role,
  ShiftLabel,
  ExperimentGroup
} from '../types';
import { config } from './config';
import { monitor } from './monitoring';

// Simulation delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

class ApiService {
  private schedule: Schedule = { ...MOCK_SCHEDULE };
  private constraints: Constraint[] = [...MOCK_CONSTRAINTS];
  private swaps: SwapRequest[] = [...MOCK_SWAPS];
  
  // Security: Current User Context
  private currentUser: User | null = null;

  // Rate Limiting State
  private requestCounts = new Map<string, number[]>();

  // --- Security & Helper Methods ---

  // Set the current user for the session (called by AuthContext)
  setCurrentUser(user: User | null) {
    this.currentUser = user;
    if (user) {
        // Assign A/B Group
        user.abGroup = monitor.assignGroup(user.id);
        monitor.logInfo(`User ${user.name} logged in. Assigned to Experiment: ${user.abGroup}`, user);
    }
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
  }

  private ensureAuthorized(allowedRoles?: Role[]) {
    if (!this.currentUser) {
      throw new Error("Unauthorized: Not authenticated");
    }
    if (allowedRoles && !allowedRoles.includes(this.currentUser.role)) {
      throw new Error(`Forbidden: Insufficient permissions. Required: ${allowedRoles.join(', ')}`);
    }
  }

  private checkRateLimit(operation: 'autoAssign' | 'assignShift') {
    if (!this.currentUser) return;
    
    const limitConfig = config.rateLimits[operation];
    const key = `${operation}:${this.currentUser.id}`;
    const now = Date.now();
    
    const timestamps = this.requestCounts.get(key) || [];
    const recent = timestamps.filter(t => now - t < limitConfig.windowMs);
    
    if (recent.length >= limitConfig.maxRequests) {
      const errorMsg = `Rate limit exceeded. Please wait before retrying.`;
      monitor.logError(errorMsg, this.currentUser, { operation, limit: limitConfig.maxRequests });
      throw new Error(errorMsg);
    }
    
    recent.push(now);
    this.requestCounts.set(key, recent);
  }

  // --- Chaos Monkey (A/B Testing Logic) ---
  // Simulate real-world instability for the CANARY group
  private async simulateNetworkConditions(operationName: string) {
      const startTime = Date.now();
      const group = this.currentUser?.abGroup || 'A_STABLE';
      
      let artificialDelay = 0;
      
      if (group === 'B_CANARY') {
          // Chaos Mode: 
          // 1. Higher Latency Variance (up to 2000ms)
          // 2. 10% Random 500 Errors
          
          artificialDelay = Math.random() * 1500; // Random delay up to 1.5s
          
          if (Math.random() < 0.1) { // 10% failure rate
               await delay(500); // Wait a bit then fail
               monitor.trackPerformance(operationName, Date.now() - startTime, false, this.currentUser);
               throw new Error(`[Experiment B] Simulated 500 Internal Server Error for operation: ${operationName}`);
          }
      }

      await delay(200 + artificialDelay); // Base delay + chaos
      return startTime;
  }

  // --- API Methods ---

  async authenticate(role: Role): Promise<ApiResponse<User>> {
    await delay(300);
    const user = MOCK_USERS.find(u => u.role === role) || MOCK_USERS[0];
    if (user) {
        // Clone to avoid mutating static mock data directly
        const userWithGroup = { ...user, abGroup: monitor.assignGroup(user.id) };
        this.currentUser = userWithGroup;
        return { success: true, data: userWithGroup };
    }
    return { success: false, error: "User not found" };
  }

  async getOrgUsers(): Promise<ApiResponse<User[]>> {
    const start = Date.now();
    try {
      this.ensureAuthorized([Role.ADMIN, Role.WORKER]);
      await this.simulateNetworkConditions('getOrgUsers');
      
      monitor.trackPerformance('getOrgUsers', Date.now() - start, true, this.currentUser);
      return { success: true, data: MOCK_USERS };
    } catch (e: any) {
      monitor.trackPerformance('getOrgUsers', Date.now() - start, false, this.currentUser);
      return { success: false, error: e.message };
    }
  }

  async getSchedule(): Promise<ApiResponse<Schedule>> {
    const start = Date.now();
    try {
      this.ensureAuthorized([Role.ADMIN, Role.WORKER]);
      await this.simulateNetworkConditions('getSchedule');
      
      monitor.trackPerformance('getSchedule', Date.now() - start, true, this.currentUser);
      return { success: true, data: this.schedule };
    } catch (e: any) {
      monitor.trackPerformance('getSchedule', Date.now() - start, false, this.currentUser);
      return { success: false, error: e.message };
    }
  }

  async updateScheduleStatus(status: ScheduleStatus): Promise<ApiResponse<void>> {
    const start = Date.now();
    try {
      this.ensureAuthorized([Role.ADMIN]);
      await this.simulateNetworkConditions('updateScheduleStatus');
      
      this.schedule.status = status;
      monitor.trackPerformance('updateScheduleStatus', Date.now() - start, true, this.currentUser);
      return { success: true };
    } catch (e: any) {
      monitor.trackPerformance('updateScheduleStatus', Date.now() - start, false, this.currentUser);
      return { success: false, error: e.message };
    }
  }

  async getConstraints(targetUserId: string): Promise<ApiResponse<Constraint[]>> {
    const start = Date.now();
    try {
      this.ensureAuthorized([Role.ADMIN, Role.WORKER]);
      await this.simulateNetworkConditions('getConstraints');
      
      if (this.currentUser!.role === Role.WORKER && this.currentUser!.id !== targetUserId) {
        throw new Error("Forbidden: Cannot access other users' constraints");
      }

      monitor.trackPerformance('getConstraints', Date.now() - start, true, this.currentUser);
      return { success: true, data: this.constraints.filter(c => c.userId === targetUserId) };
    } catch (e: any) {
      monitor.trackPerformance('getConstraints', Date.now() - start, false, this.currentUser);
      return { success: false, error: e.message };
    }
  }

  async upsertConstraint(constraint: Constraint): Promise<ApiResponse<void>> {
    const start = Date.now();
    try {
      this.ensureAuthorized([Role.ADMIN, Role.WORKER]);
      await this.simulateNetworkConditions('upsertConstraint');

      if (this.currentUser!.role === Role.WORKER && this.currentUser!.id !== constraint.userId) {
        throw new Error("Forbidden: Cannot modify other users' constraints");
      }

      const idx = this.constraints.findIndex(c => c.userId === constraint.userId && c.date === constraint.date);
      
      if (constraint.type === ConstraintType.NONE) {
        if (idx >= 0) this.constraints.splice(idx, 1);
      } else {
        if (idx >= 0) {
            this.constraints[idx] = constraint;
        } else {
            this.constraints.push(constraint);
        }
      }
      
      monitor.trackPerformance('upsertConstraint', Date.now() - start, true, this.currentUser);
      return { success: true };
    } catch (e: any) {
        monitor.trackPerformance('upsertConstraint', Date.now() - start, false, this.currentUser);
        return { success: false, error: e.message };
    }
  }

  async assignShift(shiftId: string, userId: string, role: StaffRole, force: boolean = false): Promise<ApiResponse<void>> {
    const start = Date.now();
    try {
      this.ensureAuthorized([Role.ADMIN]);
      this.checkRateLimit('assignShift');
      await this.simulateNetworkConditions('assignShift');

      const shift = this.schedule.shifts.find(s => s.id === shiftId);
      if (!shift) throw new Error("Shift not found");

      const user = MOCK_USERS.find(u => u.id === userId);
      if (!user) throw new Error("User not found");

      if (user.staffRole !== role) {
          throw new Error(`Role mismatch: User is ${user.staffRole} but being assigned as ${role}`);
      }

      if (shift.assignments.some(a => a.userId === userId)) {
          throw new Error("User already assigned to this shift");
      }

      const currentCount = shift.assignments.filter(a => a.role === role).length;
      
      // If force is true, we bypass the capacity check
      if (!force && currentCount >= shift.requirements[role]) {
          throw new Error(`Shift is full for ${role} role`);
      }

      if (this.isUserUnavail(userId, shift)) {
          // Note: Force currently allows bypassing capacity, but not unavailability constraints.
          // To allow bypassing availability too, we would add !force check here as well.
          throw new Error("User has a constraint preventing this assignment");
      }

      const newAssignment: Assignment = {
        id: this.generateId(),
        shiftId,
        userId,
        role,
        assignedBy: 'ADMIN'
      };
      shift.assignments.push(newAssignment);
      
      monitor.trackPerformance('assignShift', Date.now() - start, true, this.currentUser);
      return { success: true };

    } catch (e: any) {
      monitor.trackPerformance('assignShift', Date.now() - start, false, this.currentUser);
      return { success: false, error: e.message };
    }
  }

  async removeAssignment(shiftId: string, userId: string): Promise<ApiResponse<void>> {
    const start = Date.now();
    try {
      this.ensureAuthorized([Role.ADMIN]);
      await this.simulateNetworkConditions('removeAssignment');

      const shift = this.schedule.shifts.find(s => s.id === shiftId);
      if (!shift) throw new Error("Shift not found");
      
      shift.assignments = shift.assignments.filter(a => a.userId !== userId);
      
      monitor.trackPerformance('removeAssignment', Date.now() - start, true, this.currentUser);
      return { success: true };
    } catch (e: any) {
      monitor.trackPerformance('removeAssignment', Date.now() - start, false, this.currentUser);
      return { success: false, error: e.message };
    }
  }

  async autoAssign(): Promise<ApiResponse<{ assignmentsCreated: number }>> {
    const start = Date.now();
    try {
        this.ensureAuthorized([Role.ADMIN]);
        this.checkRateLimit('autoAssign');
        
        // A/B Test: Canary group uses a slightly heavier delay to simulate complex calculation
        if (this.currentUser?.abGroup === 'B_CANARY') {
            await delay(2500);
             // Canary logic: 20% chance to fail specifically on auto-assign
            if (Math.random() < 0.2) throw new Error("Auto-Assign algorithm timeout (Canary simulation)");
        } else {
            await delay(1500);
        }
        
        let assignmentsCreated = 0;
        const allUsers = MOCK_USERS;
        
        this.schedule.shifts.forEach(shift => {
            const fillRole = (role: StaffRole) => {
                const needed = shift.requirements[role] - shift.assignments.filter(a => a.role === role).length;
                if (needed <= 0) return;

                const candidates = allUsers.filter(u => 
                    u.staffRole === role && 
                    !this.isUserUnavail(u.id, shift) &&
                    !shift.assignments.some(a => a.userId === u.id)
                );

                for (let i = 0; i < Math.min(needed, candidates.length); i++) {
                    shift.assignments.push({
                        id: this.generateId(),
                        shiftId: shift.id,
                        userId: candidates[i].id,
                        role: role,
                        assignedBy: 'AUTO'
                    });
                    assignmentsCreated++;
                }
            };

            fillRole(StaffRole.VET);
            fillRole(StaffRole.ASSISTANT);
        });

        monitor.trackPerformance('autoAssign', Date.now() - start, true, this.currentUser);
        return { success: true, data: { assignmentsCreated } };

    } catch (e: any) {
        monitor.trackPerformance('autoAssign', Date.now() - start, false, this.currentUser);
        monitor.logError(e.message, this.currentUser, { context: 'autoAssign' });
        return { success: false, error: e.message };
    }
  }

  private isUserUnavail(userId: string, shift: Shift): boolean {
      const constraint = this.constraints.find(c => c.userId === userId && c.date === shift.date);
      if (!constraint) return false;
      if (constraint.type === ConstraintType.ALL_DAY) return true;
      if (constraint.type === ConstraintType.MORNING_ONLY && shift.label === ShiftLabel.MORNING) return true;
      if (constraint.type === ConstraintType.EVENING_ONLY && shift.label === ShiftLabel.EVENING) return true;
      return false;
  }

  async getSwaps(): Promise<ApiResponse<SwapRequest[]>> {
      const start = Date.now();
      try {
        this.ensureAuthorized([Role.ADMIN, Role.WORKER]);
        await this.simulateNetworkConditions('getSwaps');

        const result = this.currentUser!.role === Role.ADMIN
            ? this.swaps
            : this.swaps.filter(s => 
                s.requesterId === this.currentUser!.id || 
                s.offers.some(o => o.offerUserId === this.currentUser!.id)
            );
            
        monitor.trackPerformance('getSwaps', Date.now() - start, true, this.currentUser);
        return { success: true, data: result };
      } catch (e: any) {
        monitor.trackPerformance('getSwaps', Date.now() - start, false, this.currentUser);
        return { success: false, error: e.message };
      }
  }

  async approveSwap(swapId: string): Promise<ApiResponse<void>> {
      const start = Date.now();
      try {
        this.ensureAuthorized([Role.ADMIN]);
        await this.simulateNetworkConditions('approveSwap');
        
        const swap = this.swaps.find(s => s.id === swapId);
        if(!swap) throw new Error("Swap not found");
        
        if (swap.status !== SwapStatus.ADMIN_APPROVAL) {
             throw new Error("Swap is not in approval state");
        }

        swap.status = SwapStatus.APPROVED;
        monitor.trackPerformance('approveSwap', Date.now() - start, true, this.currentUser);
        return { success: true };
      } catch (e: any) {
        monitor.trackPerformance('approveSwap', Date.now() - start, false, this.currentUser);
        return { success: false, error: e.message };
      }
  }
}

export const api = new ApiService();
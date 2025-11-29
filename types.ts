export enum Role {
  ADMIN = 'ADMIN',
  WORKER = 'WORKER'
}

export enum StaffRole {
  VET = 'VET',
  ASSISTANT = 'ASSISTANT'
}

export enum ShiftLabel {
  MORNING = 'MORNING',
  EVENING = 'EVENING'
}

export enum ScheduleStatus {
  DRAFT = 'DRAFT',
  LOCKED = 'LOCKED',
  PUBLISHED = 'PUBLISHED',
  ARCHIVED = 'ARCHIVED'
}

export enum ConstraintType {
  ALL_DAY = 'ALL_DAY',
  MORNING_ONLY = 'MORNING_ONLY',
  EVENING_ONLY = 'EVENING_ONLY',
  NONE = 'NONE'
}

export enum PreferredShift {
  MORNING = 'MORNING',
  EVENING = 'EVENING',
  NONE = 'NONE'
}

export enum SwapStatus {
  REQUESTED = 'REQUESTED',
  OFFERED = 'OFFERED',
  ADMIN_APPROVAL = 'ADMIN_APPROVAL',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  CANCELED = 'CANCELED'
}

export interface ApiResponse<T = void> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  photoUrl?: string;
  role: Role;
  staffRole: StaffRole;
  abGroup?: 'A_STABLE' | 'B_CANARY'; // New field for A/B testing
}

export interface Shift {
  id: string;
  date: string; // ISO date string YYYY-MM-DD
  label: ShiftLabel;
  startTime: string;
  endTime: string;
  requirements: {
    [key in StaffRole]: number;
  };
  assignments: Assignment[];
}

export interface Assignment {
  id: string;
  shiftId: string;
  userId: string;
  role: StaffRole;
  assignedBy: 'AUTO' | 'ADMIN';
}

export interface Schedule {
  id: string;
  title: string;
  startDate: string;
  endDate: string;
  status: ScheduleStatus;
  submissionDeadline: string;
  shifts: Shift[];
}

export interface Constraint {
  id: string;
  userId: string;
  date: string;
  type: ConstraintType;
  note?: string;
  preferred?: PreferredShift;
}

export interface SwapRequest {
  id: string;
  shiftId: string;
  requesterId: string;
  requesterName: string;
  shiftDate: string;
  shiftLabel: ShiftLabel;
  status: SwapStatus;
  offers: SwapOffer[];
}

export interface SwapOffer {
  id: string;
  offerUserId: string;
  offerUserName: string;
}

// --- Monitoring & A/B Testing Types ---

export type ExperimentGroup = 'A_STABLE' | 'B_CANARY';

export interface LogEntry {
  id: string;
  timestamp: number;
  level: 'INFO' | 'WARN' | 'ERROR';
  message: string;
  userId?: string;
  group?: ExperimentGroup;
  metadata?: any;
}

export interface PerformanceMetric {
  operation: string;
  durationMs: number;
  success: boolean;
  group: ExperimentGroup;
  timestamp: number;
}
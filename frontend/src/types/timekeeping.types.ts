/**
 * Time Keeping TypeScript Types
 * Defines interfaces for sign-ins, time entries, and payroll reports
 */

// ========================================
// Sign-In Types
// ========================================

export interface DailySignIn {
  id: string;
  employeeId: string;
  employee: {
    id: string;
    firstName: string;
    lastName: string;
    classification: string;
  };
  date: string;
  signInTime: string;
  signOutTime: string | null;
  location?: string;
  projectId?: string;
  project?: {
    id: string;
    name: string;
    projectNumber: string;
  };
  notes?: string;
  signedInBy: string;
  signedInByUser?: {
    id: string;
    firstName: string;
    lastName: string;
  };
  signedOutBy?: string;
  signedOutByUser?: {
    id: string;
    firstName: string;
    lastName: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface SignInFormData {
  employeeIds: string[];
  date: string;
  signInTime: string;
  location?: string;
  projectId?: string;
  notes?: string;
}

export interface BulkSignInResult {
  signedIn: DailySignIn[];
  alreadySignedIn: string[];
}

// ========================================
// Time Entry Types
// ========================================

export type TimeEntryStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export type WorkType = 'Regular' | 'Overtime' | 'Double Time';

export interface TimeEntry {
  id: string;
  employeeId: string;
  employee: {
    id: string;
    firstName: string;
    lastName: string;
    classification: string;
  };
  date: string;
  projectId: string;
  project: {
    id: string;
    name: string;
    projectNumber: string;
  };
  hoursWorked: number;
  workType?: WorkType;
  description?: string;
  taskPerformed?: string;
  startTime?: string;
  endTime?: string;
  hourlyRate?: number;
  totalCost?: number;
  status: TimeEntryStatus;
  signInId?: string;
  createdBy: string;
  createdByUser?: {
    id: string;
    firstName: string;
    lastName: string;
  };
  approvedBy?: string;
  approvedByUser?: {
    id: string;
    firstName: string;
    lastName: string;
  };
  approvedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TimeEntryFormData {
  employeeId: string;
  date: string;
  projectId: string;
  hoursWorked: number;
  workType?: WorkType;
  description?: string;
  taskPerformed?: string;
  startTime?: string;
  endTime?: string;
  hourlyRate?: number;
  signInId?: string;
}

export interface BulkTimeEntryData extends TimeEntryFormData {
  // Same structure as TimeEntryFormData, used for bulk creation
}

// ========================================
// Payroll Report Types
// ========================================

export interface ProjectHours {
  projectId: string;
  projectName: string;
  hoursWorked: number;
}

export interface DailyReportEmployee {
  employeeId: string;
  firstName: string;
  lastName: string;
  classification: string;
  totalHours: number;
  regularHours: number;
  overtimeHours: number;
  projects: ProjectHours[];
  signInTime?: string;
  signOutTime?: string;
}

export interface DailyReport {
  date: string;
  employees: DailyReportEmployee[];
  grandTotalHours: number;
}

export interface DailyHours {
  date: string;
  hours: number;
  projects: ProjectHours[];
}

export interface WeeklyReportEmployee {
  employeeId: string;
  firstName: string;
  lastName: string;
  classification: string;
  totalHours: number;
  regularHours: number;
  overtimeHours: number;
  dailyHours: DailyHours[];
}

export interface WeeklyReport {
  startDate: string;
  endDate: string;
  employees: WeeklyReportEmployee[];
  grandTotalHours: number;
}

export interface ProjectCostBreakdown {
  employeeId: string;
  name: string;
  classification: string;
  hours: number;
  rate: number | null;
  cost: number;
}

export interface ProjectCostReport {
  projectId: string;
  projectName: string;
  projectNumber: string;
  startDate: string;
  endDate: string;
  totalHours: number;
  totalCost: number;
  breakdown: ProjectCostBreakdown[];
}

export interface PayrollSummary {
  totalLaborHours: number;
  totalLaborCost: number;
  employeeCount: number;
  projectCount: number;
  topProjects: Array<{
    projectId: string;
    name: string;
    hours: number;
  }>;
}

// ========================================
// Filter & Query Types
// ========================================

export interface SignInFilters {
  employeeId?: string;
  projectId?: string;
  date?: string;
}

export interface TimeEntryFilters {
  employeeId?: string;
  projectId?: string;
  status?: TimeEntryStatus;
  date?: string;
  startDate?: string;
  endDate?: string;
}

export interface PayrollReportFilters {
  date?: string;
  startDate?: string;
  endDate?: string;
  projectId?: string;
}

// ========================================
// Utility Types
// ========================================

export interface DayTotal {
  totalHours: number;
}

export interface SignInHistory {
  signIns: DailySignIn[];
  totalDays: number;
  totalHours: number;
}

// ========================================
// API Response Types
// ========================================

export interface SignInResponse {
  success: boolean;
  data: DailySignIn;
  message?: string;
}

export interface SignInsResponse {
  success: boolean;
  data: DailySignIn[];
  message?: string;
}

export interface TimeEntryResponse {
  success: boolean;
  data: TimeEntry;
  message?: string;
}

export interface TimeEntriesResponse {
  success: boolean;
  data: TimeEntry[];
  message?: string;
}

export interface DailyReportResponse {
  success: boolean;
  data: DailyReport;
  message?: string;
}

export interface WeeklyReportResponse {
  success: boolean;
  data: WeeklyReport;
  message?: string;
}

export interface ProjectCostReportResponse {
  success: boolean;
  data: ProjectCostReport;
  message?: string;
}

export interface PayrollSummaryResponse {
  success: boolean;
  data: PayrollSummary;
  message?: string;
}

// ========================================
// Component Props Types
// ========================================

export interface SignInSheetProps {
  selectedDate?: string;
  onDateChange?: (date: string) => void;
}

export interface TimeEntryListProps {
  date?: string;
  employeeId?: string;
  projectId?: string;
  onEntrySelect?: (entry: TimeEntry) => void;
}

export interface PayrollReportProps {
  reportType: 'daily' | 'weekly' | 'project' | 'summary';
  onExport?: () => void;
}


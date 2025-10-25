# Time Keeping Module - Implementation Plan for AI Agent

## 🎯 MODULE OVERVIEW

**Two-Part System:**

### Part 1: Digital Sign-In Sheet
- Foreman can sign employees in/out for the day
- Quick, mobile-friendly interface
- Uses Employee Directory for selection
- Tracks who's on site each day

### Part 2: Project Time Allocation
- Assign hours worked to specific projects
- One employee can work multiple projects in a day
- Tracks total hours per employee per day
- Generates daily payroll reports (CSV export)

**Key Features:**
- Mobile-optimized (foremen use on job sites)
- Integrates with Employee Directory and Projects
- Automatic time calculations
- Export to CSV for payroll software
- Historical time tracking and reporting

---

## 📊 DATABASE DESIGN

### Models to Create

**Instructions for AI:**

Add these models to `backend/prisma/schema.prisma`:

```prisma
// Daily Sign-In Sheet
// Tracks when employees sign in/out each day
model DailySignIn {
  id          String    @id @default(uuid())
  
  // Employee who signed in
  employeeId  String
  employee    Employee  @relation(fields: [employeeId], references: [id])
  
  // Date and times
  date        DateTime  @db.Date
  signInTime  DateTime
  signOutTime DateTime?
  
  // Who signed them in (foreman)
  signedInBy  String
  signedInByUser User   @relation("SignInCreatedBy", fields: [signedInBy], references: [id])
  
  // Who signed them out (if different)
  signedOutBy String?
  signedOutByUser User? @relation("SignInSignedOutBy", fields: [signedOutBy], references: [id])
  
  // Location/Site
  location    String?   // Job site address or name
  projectId   String?   // Primary project for the day (optional)
  project     Project?  @relation(fields: [projectId], references: [id])
  
  // Notes
  notes       String?   @db.Text
  
  // Audit
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  
  // Link to time entries
  timeEntries TimeEntry[]
  
  @@unique([employeeId, date])
  @@index([date])
  @@index([employeeId])
  @@index([signedInBy])
}

// Project Time Allocation
// Tracks hours worked on specific projects
model TimeEntry {
  id            String    @id @default(uuid())
  
  // Employee and date
  employeeId    String
  employee      Employee  @relation(fields: [employeeId], references: [id])
  date          DateTime  @db.Date
  
  // Project allocation
  projectId     String
  project       Project   @relation(fields: [projectId], references: [id])
  
  // Hours worked
  hoursWorked   Decimal   @db.Decimal(5, 2)  // e.g., 8.50 hours
  
  // Time period (optional)
  startTime     DateTime?
  endTime       DateTime?
  
  // Type of work
  workType      String?   // Regular, Overtime, Double Time
  
  // Description
  description   String?   @db.Text
  taskPerformed String?   // What they worked on
  
  // Rates (optional - for cost tracking)
  hourlyRate    Decimal?  @db.Decimal(10, 2)
  totalCost     Decimal?  @db.Decimal(10, 2)
  
  // Link to sign-in (if they signed in that day)
  signInId      String?
  signIn        DailySignIn? @relation(fields: [signInId], references: [id])
  
  // Status
  status        String    @default("PENDING")  // PENDING, APPROVED, REJECTED
  approvedBy    String?
  approvedByUser User?   @relation(fields: [approvedBy], references: [id])
  approvedAt    DateTime?
  
  // Audit
  createdBy     String
  createdByUser User     @relation("TimeEntryCreatedBy", fields: [createdBy], references: [id])
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  updatedBy     String?
  
  @@index([employeeId, date])
  @@index([projectId, date])
  @@index([date])
  @@index([status])
}

// Weekly Timesheet Summary (optional - for approval workflow)
model WeeklyTimesheet {
  id            String    @id @default(uuid())
  
  // Employee and week
  employeeId    String
  employee      Employee  @relation(fields: [employeeId], references: [id])
  weekStartDate DateTime  @db.Date
  weekEndDate   DateTime  @db.Date
  
  // Totals
  totalHours    Decimal   @db.Decimal(6, 2)
  regularHours  Decimal   @db.Decimal(6, 2)
  overtimeHours Decimal   @db.Decimal(6, 2)
  
  // Status
  status        String    @default("DRAFT")  // DRAFT, SUBMITTED, APPROVED, REJECTED
  submittedAt   DateTime?
  approvedBy    String?
  approvedByUser User?   @relation(fields: [approvedBy], references: [id])
  approvedAt    DateTime?
  
  // Notes
  notes         String?   @db.Text
  
  // Audit
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  
  @@unique([employeeId, weekStartDate])
  @@index([weekStartDate])
  @@index([status])
}

// Update existing models to add relationships

model Employee {
  // ... existing fields ...
  
  // Time tracking relationships
  signIns       DailySignIn[]
  timeEntries   TimeEntry[]
  weeklyTimesheets WeeklyTimesheet[]
}

model Project {
  // ... existing fields ...
  
  // Time tracking relationships
  signIns       DailySignIn[]
  timeEntries   TimeEntry[]
}

model User {
  // ... existing fields ...
  
  // Time tracking relationships
  signInsCreated     DailySignIn[] @relation("SignInCreatedBy")
  signInsSignedOut   DailySignIn[] @relation("SignInSignedOutBy")
  timeEntriesCreated TimeEntry[]   @relation("TimeEntryCreatedBy")
  timeEntriesApproved TimeEntry[]
  timesheetsApproved WeeklyTimesheet[]
}
```

**Why This Design:**
- ✅ Separates sign-in (attendance) from time allocation (project hours)
- ✅ One sign-in per employee per day
- ✅ Multiple time entries per employee per day (different projects)
- ✅ Tracks who signed them in (accountability)
- ✅ Optional approval workflow
- ✅ Links to Employee Directory and Projects
- ✅ Ready for payroll integration
- ✅ Stores rates and costs for project cost tracking

---

## 🔧 BACKEND IMPLEMENTATION

### Step 1: Create Migration

**Prompt for AI:**
```
Update backend/prisma/schema.prisma to add the DailySignIn, TimeEntry, and WeeklyTimesheet models with all relationships as defined in the plan. Then:
1. Run: npx prisma migrate dev --name add_time_keeping
2. Run: npx prisma generate

Show me the updated schema and confirm the migration completed successfully.
```

---

### Step 2: Sign-In Service

**Prompt for AI:**
```
Create backend/src/services/signin.service.ts with the following functions:

- getSignInsForDate(date: Date, filters?: {employeeId?, projectId?})
  Returns all sign-ins for a specific date with employee details

- getTodaySignIns()
  Returns all sign-ins for today

- signIn(data: {employeeId, date, signInTime, location?, projectId?, notes?}, signedInBy: string)
  Signs an employee in. Prevents duplicate sign-ins for same employee/date.

- signOut(signInId: string, signOutTime: DateTime, signedOutBy: string)
  Signs an employee out. Updates the existing sign-in record.

- bulkSignIn(employeeIds: string[], date: Date, signInTime: DateTime, signedInBy: string, location?: string, projectId?: string)
  Signs multiple employees in at once (for foreman convenience)

- getEmployeeSignInHistory(employeeId: string, startDate: Date, endDate: Date)
  Returns sign-in history for an employee within date range

- isEmployeeSignedIn(employeeId: string, date: Date)
  Checks if employee is currently signed in for a date

- getActiveSignIns()
  Returns all sign-ins that haven't been signed out yet

Use Prisma for all database operations. Include proper error handling.
```

---

### Step 3: Time Entry Service

**Prompt for AI:**
```
Create backend/src/services/timeentry.service.ts with the following functions:

- getTimeEntriesForDate(date: Date, filters?: {employeeId?, projectId?, status?})
  Returns all time entries for a specific date

- getTimeEntriesForEmployee(employeeId: string, startDate: Date, endDate: Date)
  Returns time entries for an employee within date range

- getTimeEntriesForProject(projectId: string, startDate: Date, endDate: Date)
  Returns time entries for a project within date range

- create(data: {employeeId, date, projectId, hoursWorked, workType?, description?, taskPerformed?, hourlyRate?}, createdBy: string)
  Creates a new time entry. Validates that hours are reasonable (e.g., 0-24).

- update(id: string, data: Partial<TimeEntry>, updatedBy: string)
  Updates a time entry

- delete(id: string)
  Deletes a time entry (hard delete or soft delete)

- bulkCreate(entries: Array<{employeeId, date, projectId, hoursWorked, ...}>, createdBy: string)
  Creates multiple time entries at once

- calculateDayTotal(employeeId: string, date: Date)
  Calculates total hours for an employee on a specific day across all projects

- autoCreateFromSignIn(signInId: string, projectId: string, createdBy: string)
  Automatically creates time entry from sign-in/sign-out times

- approve(id: string, approvedBy: string)
  Approves a time entry

- reject(id: string, approvedBy: string, reason: string)
  Rejects a time entry

- getUnapprovedEntries()
  Returns all time entries with PENDING status

Use Prisma. Include validation for hours (must be positive, reasonable). Calculate totalCost if hourlyRate is provided.
```

---

### Step 4: Payroll Report Service

**Prompt for AI:**
```
Create backend/src/services/payroll.service.ts with the following functions:

- generateDailyReport(date: Date)
  Returns data for daily payroll report:
  {
    date,
    employees: [{
      employeeId, firstName, lastName, classification,
      totalHours, regularHours, overtimeHours,
      projects: [{projectId, projectName, hoursWorked}],
      signInTime, signOutTime
    }],
    grandTotalHours
  }

- generateWeeklyReport(startDate: Date, endDate: Date)
  Returns weekly payroll report with same structure but grouped by week

- generateProjectCostReport(projectId: string, startDate: Date, endDate: Date)
  Returns labor costs for a project:
  {
    projectId, projectName,
    totalHours, totalCost,
    breakdown: [{employeeId, name, hours, rate, cost}]
  }

- exportDailyReportCSV(date: Date)
  Generates CSV format for daily payroll:
  Columns: Employee ID, First Name, Last Name, Classification, Date, Project, Hours, Rate, Total
  Returns CSV string ready for download

- exportWeeklyReportCSV(startDate: Date, endDate: Date)
  Generates CSV for weekly payroll with similar format

- getPayrollSummary(startDate: Date, endDate: Date)
  Returns summary statistics:
  {
    totalLaborHours,
    totalLaborCost,
    employeeCount,
    projectCount,
    topProjects: [{projectId, name, hours}]
  }

Use the TimeEntry and DailySignIn data. Calculate overtime as any hours over 8 per day or 40 per week. Format CSV properly with headers.
```

---

### Step 5: Controllers

**Prompt for AI:**
```
Create three controller files:

1. backend/src/controllers/signin.controller.ts
   Create route handlers for all signin.service functions:
   - getTodaySignIns(req, res)
   - getSignInsForDate(req, res) - date from query param
   - signIn(req, res) - data from body
   - signOut(req, res) - signInId from params, signOutTime from body
   - bulkSignIn(req, res) - employeeIds array from body
   - getEmployeeHistory(req, res) - employeeId from params, dates from query
   - getActiveSignIns(req, res)

2. backend/src/controllers/timeentry.controller.ts
   Create route handlers for all timeentry.service functions:
   - getTimeEntriesForDate(req, res)
   - getTimeEntriesForEmployee(req, res)
   - getTimeEntriesForProject(req, res)
   - createTimeEntry(req, res)
   - updateTimeEntry(req, res)
   - deleteTimeEntry(req, res)
   - bulkCreateTimeEntries(req, res)
   - calculateDayTotal(req, res)
   - approveTimeEntry(req, res)
   - rejectTimeEntry(req, res)
   - getUnapprovedEntries(req, res)

3. backend/src/controllers/payroll.controller.ts
   Create route handlers for payroll.service functions:
   - getDailyReport(req, res) - date from query
   - getWeeklyReport(req, res) - startDate, endDate from query
   - getProjectCostReport(req, res)
   - downloadDailyCSV(req, res) - sets headers for file download
   - downloadWeeklyCSV(req, res) - sets headers for file download
   - getPayrollSummary(req, res)

All controllers should:
- Use try-catch for error handling
- Return consistent response format: {success: true/false, data, error}
- Validate required fields
- Get userId from req.user (authenticated user)
```

---

### Step 6: Routes

**Prompt for AI:**
```
Create three route files:

1. backend/src/routes/signin.routes.ts
   Routes:
   - GET /sign-ins/today - getTodaySignIns
   - GET /sign-ins/date - getSignInsForDate (requires date query param)
   - GET /sign-ins/active - getActiveSignIns
   - GET /sign-ins/employee/:employeeId/history - getEmployeeHistory
   - POST /sign-ins - signIn (requires authentication)
   - POST /sign-ins/bulk - bulkSignIn (requires authentication)
   - PUT /sign-ins/:id/sign-out - signOut (requires authentication)

2. backend/src/routes/timeentry.routes.ts
   Routes:
   - GET /time-entries/date - getTimeEntriesForDate
   - GET /time-entries/employee/:employeeId - getTimeEntriesForEmployee
   - GET /time-entries/project/:projectId - getTimeEntriesForProject
   - GET /time-entries/unapproved - getUnapprovedEntries
   - GET /time-entries/:employeeId/:date/total - calculateDayTotal
   - POST /time-entries - createTimeEntry (requires authentication)
   - POST /time-entries/bulk - bulkCreateTimeEntries (requires authentication)
   - PUT /time-entries/:id - updateTimeEntry (requires authentication)
   - PUT /time-entries/:id/approve - approveTimeEntry (requires manager role)
   - PUT /time-entries/:id/reject - rejectTimeEntry (requires manager role)
   - DELETE /time-entries/:id - deleteTimeEntry (requires admin role)

3. backend/src/routes/payroll.routes.ts
   Routes:
   - GET /payroll/daily - getDailyReport
   - GET /payroll/weekly - getWeeklyReport
   - GET /payroll/project/:projectId - getProjectCostReport
   - GET /payroll/summary - getPayrollSummary
   - GET /payroll/export/daily - downloadDailyCSV (triggers file download)
   - GET /payroll/export/weekly - downloadWeeklyCSV (triggers file download)

All routes require authentication. Sign-in routes accessible by foremen and above. Time entry creation accessible by managers and above. Payroll reports accessible by managers and admins only.
```

---

### Step 7: Register Routes in Server

**Prompt for AI:**
```
Update backend/src/server.ts to register the three new route groups:

import signInRoutes from './routes/signin.routes';
import timeEntryRoutes from './routes/timeentry.routes';
import payrollRoutes from './routes/payroll.routes';

app.use('/api/v1/sign-ins', signInRoutes);
app.use('/api/v1/time-entries', timeEntryRoutes);
app.use('/api/v1/payroll', payrollRoutes);
```

---

## 🎨 FRONTEND IMPLEMENTATION

### Step 1: TypeScript Types

**Prompt for AI:**
```
Create frontend/src/types/timekeeping.types.ts with interfaces:

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
  };
  notes?: string;
  signedInBy: string;
  signedOutBy?: string;
  createdAt: string;
}

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
  };
  hoursWorked: number;
  workType?: string;
  description?: string;
  taskPerformed?: string;
  hourlyRate?: number;
  totalCost?: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdBy: string;
  createdAt: string;
}

export interface SignInFormData {
  employeeIds: string[];
  date: string;
  signInTime: string;
  location?: string;
  projectId?: string;
  notes?: string;
}

export interface TimeEntryFormData {
  employeeId: string;
  date: string;
  projectId: string;
  hoursWorked: number;
  workType?: string;
  description?: string;
  taskPerformed?: string;
}

export interface PayrollReport {
  date: string;
  employees: Array<{
    employeeId: string;
    firstName: string;
    lastName: string;
    classification: string;
    totalHours: number;
    regularHours: number;
    overtimeHours: number;
    projects: Array<{
      projectId: string;
      projectName: string;
      hoursWorked: number;
    }>;
    signInTime?: string;
    signOutTime?: string;
  }>;
  grandTotalHours: number;
}
```

---

### Step 2: API Services

**Prompt for AI:**
```
Create three service files:

1. frontend/src/services/signin.service.ts
   Functions for all sign-in endpoints:
   - getTodaySignIns()
   - getSignInsForDate(date: string)
   - getActiveSignIns()
   - getEmployeeHistory(employeeId: string, startDate: string, endDate: string)
   - signIn(data: SignInFormData)
   - bulkSignIn(data: SignInFormData)
   - signOut(signInId: string, signOutTime: string)

2. frontend/src/services/timeentry.service.ts
   Functions for time entry endpoints:
   - getTimeEntriesForDate(date: string, filters?)
   - getTimeEntriesForEmployee(employeeId: string, startDate: string, endDate: string)
   - getTimeEntriesForProject(projectId: string, startDate: string, endDate: string)
   - getUnapprovedEntries()
   - calculateDayTotal(employeeId: string, date: string)
   - createTimeEntry(data: TimeEntryFormData)
   - bulkCreateTimeEntries(entries: TimeEntryFormData[])
   - updateTimeEntry(id: string, data: Partial<TimeEntryFormData>)
   - deleteTimeEntry(id: string)
   - approveTimeEntry(id: string)
   - rejectTimeEntry(id: string, reason: string)

3. frontend/src/services/payroll.service.ts
   Functions for payroll endpoints:
   - getDailyReport(date: string)
   - getWeeklyReport(startDate: string, endDate: string)
   - getProjectCostReport(projectId: string, startDate: string, endDate: string)
   - getPayrollSummary(startDate: string, endDate: string)
   - downloadDailyCSV(date: string) - triggers file download
   - downloadWeeklyCSV(startDate: string, endDate: string) - triggers file download

All services use the api instance from services/api.ts and return properly typed responses.
```

---

### Step 3: State Management

**Prompt for AI:**
```
Create Zustand stores:

1. frontend/src/store/signin.store.ts
   State:
   - signIns: DailySignIn[]
   - activeSignIns: DailySignIn[]
   - selectedDate: string
   - isLoading: boolean
   - error: string | null
   
   Actions:
   - fetchTodaySignIns()
   - fetchSignInsForDate(date: string)
   - fetchActiveSignIns()
   - signIn(data: SignInFormData)
   - bulkSignIn(data: SignInFormData)
   - signOut(signInId: string, signOutTime: string)
   - setSelectedDate(date: string)

2. frontend/src/store/timeentry.store.ts
   State:
   - timeEntries: TimeEntry[]
   - selectedDate: string
   - unapprovedEntries: TimeEntry[]
   - isLoading: boolean
   - error: string | null
   
   Actions:
   - fetchTimeEntriesForDate(date: string)
   - fetchTimeEntriesForEmployee(employeeId: string, startDate: string, endDate: string)
   - fetchUnapprovedEntries()
   - createTimeEntry(data: TimeEntryFormData)
   - bulkCreateTimeEntries(entries: TimeEntryFormData[])
   - updateTimeEntry(id: string, data: Partial<TimeEntryFormData>)
   - deleteTimeEntry(id: string)
   - approveTimeEntry(id: string)
   - rejectTimeEntry(id: string, reason: string)
   - setSelectedDate(date: string)

3. frontend/src/store/payroll.store.ts
   State:
   - dailyReport: PayrollReport | null
   - weeklyReport: any | null
   - summary: any | null
   - isLoading: boolean
   - error: string | null
   
   Actions:
   - fetchDailyReport(date: string)
   - fetchWeeklyReport(startDate: string, endDate: string)
   - fetchPayrollSummary(startDate: string, endDate: string)
   - downloadDailyCSV(date: string)
   - downloadWeeklyCSV(startDate: string, endDate: string)

Follow the patterns from other stores in the project.
```

---

### Step 4: Sign-In Sheet Page (Part 1)

**Prompt for AI:**
```
Create frontend/src/pages/TimeKeeping/SignInSheet.tsx:

This is a mobile-optimized page for foremen to sign employees in/out.

Features:
- Date selector at top (defaults to today)
- Large "Sign In Employees" button
- List of employees currently signed in today showing:
  - Employee name
  - Classification
  - Sign in time
  - Location/Project
  - "Sign Out" button (large, easy to tap)
- Show total employees signed in
- Filter to show only active sign-ins or all for the day

Sign In Flow:
- Click "Sign In Employees" button
- Opens modal/dialog with:
  - Multi-select employee picker (from Employee Directory)
  - Location text field (optional)
  - Project selector (optional)
  - Notes field (optional)
  - Current time displayed (can be adjusted)
  - "Sign In Selected" button
- After sign in, employees appear in the list

Sign Out Flow:
- Click "Sign Out" button next to employee
- Confirms with dialog showing current time
- Can adjust sign out time if needed
- Signs them out

Use Material-UI components:
- Card for layout
- List for signed-in employees
- ListItem with secondary action for sign out button
- Dialog for sign-in modal
- Autocomplete for employee selection (multi-select)
- DatePicker for date
- TimePicker for times
- Button (large size for mobile)
- Chip to show status
- Avatar with employee initials

Make it look clean and professional. Large touch targets for mobile. Show loading states.
```

---

### Step 5: Time Entry Page (Part 2)

**Prompt for AI:**
```
Create frontend/src/pages/TimeKeeping/TimeEntryManagement.tsx:

This page is for office staff/managers to allocate hours to projects.

Layout:
- Date selector at top
- "Add Time Entry" button
- Summary cards showing:
  - Total hours for the day
  - Number of employees
  - Number of projects
- Table/DataGrid with all time entries for selected date showing:
  - Employee name
  - Project name
  - Hours worked
  - Work type (Regular/Overtime)
  - Status (Pending/Approved)
  - Edit and Delete buttons

Add Time Entry Modal:
- Employee selector (autocomplete, shows who was signed in that day first)
- Date picker (defaults to selected date)
- Project selector (dropdown of active projects)
- Hours worked (number input, validates 0-24)
- Work type selector (Regular, Overtime, Double Time)
- Task performed (text field)
- Description (text area, optional)
- "Save" and "Cancel" buttons

Features:
- Quick-add from sign-in sheet (pre-fill employee and calculate hours from sign-in/out times)
- Bulk add mode: select multiple employees and assign same hours to same project
- Edit existing entries
- Delete entries (with confirmation)
- Filter by employee or project
- Show total hours per employee (with warning if >12 hours in a day)
- Color-code by status (pending=yellow, approved=green)

Use Material-UI DataGrid with:
- Sorting
- Filtering
- Pagination
- Custom action column
```

---

### Step 6: Payroll Reports Page

**Prompt for AI:**
```
Create frontend/src/pages/TimeKeeping/PayrollReports.tsx:

This page generates and exports payroll reports.

Layout:
- Tab navigation:
  - Daily Report
  - Weekly Report
  - Project Cost Report
  - Summary

Daily Report Tab:
- Date picker for report date
- "Generate Report" button
- "Export to CSV" button
- Table showing:
  - Employee name
  - Classification
  - Total hours
  - Regular hours
  - Overtime hours
  - Projects worked (expandable list)
  - Sign in/out times
- Summary row with totals

Weekly Report Tab:
- Date range picker (start/end date)
- "Generate Report" button
- "Export to CSV" button
- Similar table but grouped by week
- Shows Mon-Sun breakdown per employee

Project Cost Report Tab:
- Project selector
- Date range picker
- "Generate Report" button
- Table showing:
  - Employee name
  - Hours worked
  - Hourly rate (if available)
  - Total cost
- Summary with total project labor cost

Summary Tab:
- Date range picker
- Shows aggregate statistics:
  - Total labor hours
  - Total labor cost
  - Average hours per employee
  - Top 5 projects by hours
  - Charts/graphs (optional):
    - Hours by project (bar chart)
    - Hours by employee (bar chart)
    - Hours trend over time (line chart)

CSV Export:
- When clicking export button, triggers download
- Filename includes date (e.g., "payroll-report-2025-01-15.csv")
- Formatted for easy import into payroll software

Use Material-UI:
- Tabs
- DatePicker / DateRangePicker
- Select for project dropdown
- DataGrid for tables
- Button for export
- Card for summary stats
- Alert for warnings/errors
```

---

### Step 7: Time Approval Page (Optional)

**Prompt for AI:**
```
Create frontend/src/pages/TimeKeeping/TimeApproval.tsx:

This page is for managers to approve/reject time entries.

Features:
- Show all unapproved time entries
- Filter by employee, project, date range
- Bulk select for approval
- Individual approve/reject buttons
- Rejection requires reason/comment

Layout:
- Filter bar at top
- "Approve Selected" button (bulk action)
- DataGrid showing pending entries:
  - Employee name
  - Date
  - Project
  - Hours
  - Work type
  - Created by
  - Approve and Reject buttons

Approve Dialog:
- Simple confirmation
- Shows what will be approved

Reject Dialog:
- Requires reason text
- Sends notification to creator

After approval/rejection:
- Entry status updates
- Notification shown
- List refreshes

Use Material-UI DataGrid with checkboxes for multi-select.
```

---

### Step 8: Add to Navigation

**Prompt for AI:**
```
Update navigation files to add Time Keeping module:

1. Update frontend/src/App.tsx routes:
   - /timekeeping/sign-in - SignInSheet
   - /timekeeping/time-entries - TimeEntryManagement  
   - /timekeeping/reports - PayrollReports
   - /timekeeping/approval - TimeApproval (optional)

2. Update sidebar/AppLayout:
   Add "Time Keeping" menu with submenu:
   - Sign-In Sheet (icon: AccessTime)
   - Time Entries (icon: Schedule)
   - Payroll Reports (icon: Assessment)
   - Approval (icon: CheckCircle) - only for managers

3. Update Dashboard:
   Add Time Keeping card:
   - Icon: AccessTime
   - Title: "Time Keeping"
   - Description: "Track employee time and generate payroll reports"
   - Shows today's stats: "X employees signed in, Y hours logged"
   - Button to open sign-in sheet

Make the Time Keeping section prominent since it's used daily.
```

---

### Step 9: Mobile Optimizations

**Prompt for AI:**
```
Add mobile-specific features to the Sign-In Sheet:

1. Create frontend/src/pages/TimeKeeping/MobileSignIn.tsx:
   - Simplified version of SignInSheet for phone screens
   - Larger buttons (minimum 48px height)
   - Simplified employee list (just name and sign in/out button)
   - Quick actions at bottom (fixed position)
   - Swipe to sign out (optional)
   - Use bottom sheet instead of modal for better mobile UX

2. Add responsive breakpoints:
   - Desktop (md+): Show full SignInSheet with all details
   - Mobile (sm-): Show MobileSignIn with simplified view

3. PWA features (optional but recommended):
   - Add service worker for offline capability
   - Add to home screen prompt for foremen
   - Store pending sign-ins locally if offline
   - Sync when back online

Use Material-UI:
- BottomSheet (from MUI or library)
- SwipeableDrawer
- SpeedDial for quick actions
- Snackbar for confirmations
```

---

### Step 10: Quick Actions & Shortcuts

**Prompt for AI:**
```
Add convenience features:

1. Create frontend/src/components/timekeeping/QuickSignIn.tsx:
   A floating action button (FAB) that's always visible on mobile
   - Click to quick-sign in (uses current location, time, default project)
   - Shows employee picker
   - One-tap sign in

2. Create frontend/src/components/timekeeping/TimeEntryQuickAdd.tsx:
   Quick-add time entry from sign-in sheet
   - "Add Time" button on each signed-in employee
   - Pre-fills employee, date, calculates hours from sign-in/out
   - Just needs project selection
   - One click to save

3. Create frontend/src/components/timekeeping/TodaysSummary.tsx:
   Widget that shows on dashboard:
   - Employees signed in now
   - Total hours logged today
   - Projects being worked today
   - Quick link to sign-in sheet

4. Add keyboard shortcuts:
   - Ctrl/Cmd + Shift + S: Open sign-in sheet
   - Ctrl/Cmd + Shift + T: Add time entry
   - Ctrl/Cmd + Shift + R: Open reports

Use Material-UI Fab, Tooltip, and shortcuts library (react-hotkeys-hook).
```

---

## ✅ TESTING CHECKLIST

Test these scenarios after implementation:

### Sign-In Sheet Testing
- [ ] Can select date and see sign-ins for that date
- [ ] Can sign in single employee
- [ ] Can sign in multiple employees at once (bulk)
- [ ] Can sign out employee
- [ ] Sign-in prevents duplicates (same employee, same day)
- [ ] Shows who signed them in/out
- [ ] Works on mobile device (large touch targets)
- [ ] Loads quickly even with 50+ employees

### Time Entry Testing
- [ ] Can add time entry for any employee
- [ ] Can assign hours to multiple projects in one day
- [ ] Validates hours (can't exceed 24 per day)
- [ ] Can edit existing time entry
- [ ] Can delete time entry with confirmation
- [ ] Shows warning if employee has >12 hours
- [ ] Can bulk-add same hours to multiple employees
- [ ] Calculates totals correctly

### Payroll Reports Testing
- [ ] Daily report shows all employees worked that day
- [ ] Weekly report aggregates correctly (Mon-Sun)
- [ ] CSV export downloads with correct data
- [ ] CSV format is compatible with payroll software
- [ ] Project cost report calculates correctly
- [ ] Summary shows accurate totals
- [ ] Can generate report for any date range

### Integration Testing
- [ ] Sign-in links to Employee Directory correctly
- [ ] Time entries link to Projects correctly
- [ ] Can navigate from sign-in sheet to time entry
- [ ] Dashboard shows accurate "today's" stats
- [ ] Foreman can only see their features (not payroll)
- [ ] Manager can approve time entries
- [ ] Admin can access all features

### Mobile Testing
- [ ] Sign-in sheet works on phone
- [ ] Buttons are easy to tap
- [ ] Can quickly sign in/out on job site
- [ ] Works in poor network conditions
- [ ] Date/time pickers work well on mobile

---

## 📊 PAYROLL CSV FORMAT

The exported CSV should have these columns for maximum compatibility:

**Daily Report Format:**
```
Employee ID, First Name, Last Name, Classification, Date, Project ID, Project Name, Hours, Work Type, Hourly Rate, Total Cost
```

**Weekly Report Format:**
```
Employee ID, First Name, Last Name, Week Start, Week End, Total Hours, Regular Hours, Overtime Hours, Projects List
```

Make sure:
- Headers are in the first row
- Dates are in YYYY-MM-DD format
- Numbers have 2 decimal places
- No special characters that break CSV parsing
- UTF-8 encoding

---

## 🚀 FUTURE ENHANCEMENTS

The system is designed to easily add:

### Phase 2 Features:
- **GPS Location Tracking**: Verify employee is at job site
- **Geofencing**: Auto sign-in when entering job site
- **Photo Time Stamps**: Take photo when signing in (proof)
- **Break Tracking**: Sign in/out for breaks
- **Equipment Time**: Track equipment usage time
- **Cost Codes**: Add cost codes for accounting

### Phase 3 Features:
- **Mobile App**: Native iOS/Android app for foremen
- **Offline Mode**: Work without internet, sync later
- **Biometric Sign-In**: Fingerprint or face recognition
- **Integration**: Connect to QuickBooks, ADP, Gusto
- **Analytics**: Predict labor costs, efficiency reports
- **Scheduling**: Compare scheduled vs actual time

All these are possible with the current database structure!

---

## 💡 TIPS FOR AI AGENT

**When implementing:**
1. Start with database models first (migration)
2. Then backend services (business logic)
3. Then controllers (API endpoints)
4. Test backend with Postman/Thunder Client
5. Then frontend services (API calls)
6. Then state management (Zustand stores)
7. Then UI components (one page at a time)
8. Test each page individually before moving on

**Best practices:**
- Mobile-first design for sign-in sheet
- Large touch targets (48px minimum)
- Clear visual feedback (loading states, success messages)
- Validate hours before saving
- Prevent accidental deletions (confirmations)
- Show helpful error messages
- Make it fast (foremen use on job sites)

**Security considerations:**
- Foremen can only sign in/out (not edit hours or rates)
- Only managers can see payroll reports
- Only admins can delete time entries
- Audit log who creates/modifies time entries
- Validate user has access to that project

---

## 📝 IMPLEMENTATION ORDER

**Week 1:**
1. Database models and migration
2. Backend services (sign-in, time entry)
3. Backend controllers and routes
4. Test with Postman

**Week 2:**
5. Frontend types and services
6. State management stores
7. Sign-In Sheet page
8. Test sign-in flow

**Week 3:**
9. Time Entry Management page
10. Test time allocation
11. Payroll Reports page
12. Test CSV export

**Week 4:**
13. Mobile optimizations
14. Quick actions and shortcuts
15. Navigation and dashboard integration
16. Final testing and bug fixes

---

This plan gives you a complete, production-ready Time Keeping system that's optimized for electrical construction workflows! 🚀

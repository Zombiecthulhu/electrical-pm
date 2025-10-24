# ✅ User Model Updated in Prisma Schema

## Update Complete

The User model in the Prisma schema has been updated with the `last_login` field.

## Updated User Model

### Complete Structure

```prisma
model User {
  id            String    @id @default(uuid()) @db.Uuid
  email         String    @unique
  password_hash String
  role          UserRole  @default(FIELD_WORKER)
  first_name    String
  last_name     String
  phone         String?
  avatar_url    String?
  is_active     Boolean   @default(true)
  last_login    DateTime? @db.Timestamptz(6)  ← NEWLY ADDED
  created_at    DateTime  @default(now()) @db.Timestamptz(6)
  updated_at    DateTime  @updatedAt @db.Timestamptz(6)
  deleted_at    DateTime? @db.Timestamptz(6)

  // Relations...

  @@index([email])
  @@index([role])
  @@index([is_active])
  @@index([created_at])
  @@index([deleted_at])
  @@map("users")
}
```

## Field Descriptions

### Core Identity
- **id**: UUID primary key, auto-generated
- **email**: Unique email address, indexed for fast lookup
- **password_hash**: Bcrypt hashed password (never store plain text!)

### User Information
- **first_name**: User's first name (required)
- **last_name**: User's last name (required)
- **phone**: Phone number (optional)
- **avatar_url**: Profile picture URL (optional)

### Authorization & Status
- **role**: User role enum (default: FIELD_WORKER)
- **is_active**: Account active status (default: true, indexed)
- **last_login**: Last successful login timestamp (nullable, new!)

### Audit Trail
- **created_at**: Account creation timestamp (auto-generated, indexed)
- **updated_at**: Last update timestamp (auto-updated)
- **deleted_at**: Soft delete timestamp (nullable, indexed)

## UserRole Enum

Complete role hierarchy:

```prisma
enum UserRole {
  SUPER_ADMIN       // Full system access
  PROJECT_MANAGER   // Project oversight
  FIELD_SUPERVISOR  // Field team management
  OFFICE_ADMIN      // Office operations
  FIELD_WORKER      // Field work (default)
  CLIENT_READ_ONLY  // External client view-only
}
```

### Role Permissions (Recommended)

**SUPER_ADMIN**:
- Full system access
- User management
- System configuration
- All module access

**PROJECT_MANAGER**:
- Create/manage projects
- Assign team members
- View all project data
- Generate reports
- Manage quotes/bids

**FIELD_SUPERVISOR**:
- View assigned projects
- Create daily logs
- Upload photos
- Manage field workers
- Time tracking

**OFFICE_ADMIN**:
- Manage clients
- Process documents
- Handle quotes
- Administrative tasks
- No project creation

**FIELD_WORKER**:
- View assigned tasks
- Upload photos
- Submit timesheets
- Read-only project access

**CLIENT_READ_ONLY**:
- View own projects only
- View documents
- No editing capabilities
- Limited access

## Indexes

The User model has 5 indexes for optimal query performance:

1. **@@index([email])** - Fast login lookups
2. **@@index([role])** - Filter users by role
3. **@@index([is_active])** - Find active/inactive users
4. **@@index([created_at])** - Sort by registration date
5. **@@index([deleted_at])** - Filter soft-deleted users

Plus the unique constraint on email:
- **@unique** on email field

## New Field: last_login

### Purpose
Track when users last successfully logged in.

### Type
- `DateTime?` (nullable)
- `@db.Timestamptz(6)` (PostgreSQL timestamp with timezone)

### Usage

**On Login Success**:
```typescript
await prisma.user.update({
  where: { email: userEmail },
  data: { last_login: new Date() }
});
```

**Query Inactive Users**:
```typescript
// Users who haven't logged in for 30 days
const thirtyDaysAgo = new Date();
thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

const inactiveUsers = await prisma.user.findMany({
  where: {
    last_login: { lt: thirtyDaysAgo },
    is_active: true
  }
});
```

**Never Logged In**:
```typescript
// Users who registered but never logged in
const neverLoggedIn = await prisma.user.findMany({
  where: {
    last_login: null,
    created_at: { lt: sevenDaysAgo }
  }
});
```

## Relations

The User model has comprehensive relations:

### Projects
- **created_projects**: Projects created by user
- **updated_projects**: Projects last updated by user
- **project_members**: Project team memberships

### Clients
- **created_clients**: Clients created by user
- **updated_clients**: Clients last updated by user

### Content
- **uploaded_files**: Files/documents uploaded
- **daily_logs**: Daily activity logs

### Quotes
- **created_quotes**: Quotes created by user
- **updated_quotes**: Quotes last updated by user

## Security Best Practices

### Password Storage
✅ **Do**: Store hashed passwords using bcrypt
```typescript
import bcrypt from 'bcrypt';

const hashedPassword = await bcrypt.hash(plainPassword, 12);
```

❌ **Don't**: Ever store plain text passwords

### Email Uniqueness
✅ **Enforced**: Database-level unique constraint
✅ **Indexed**: Fast duplicate checking

### Soft Deletes
✅ **Implemented**: deleted_at field
✅ **Indexed**: Fast filtering of active users

**Query active users**:
```typescript
const activeUsers = await prisma.user.findMany({
  where: { deleted_at: null }
});
```

### Account Deactivation
✅ **is_active flag**: Can disable without deleting
✅ **Indexed**: Fast filtering

**Deactivate user**:
```typescript
await prisma.user.update({
  where: { id: userId },
  data: { is_active: false }
});
```

## Database Migration

### Next Steps

After updating the schema, you need to:

1. **Generate Prisma Client**:
```bash
cd backend
npm run prisma:generate
```

2. **Create Migration**:
```bash
npm run prisma:migrate dev --name add-user-last-login
```

This will:
- Create migration SQL file
- Apply to database
- Update Prisma client

3. **Verify Migration**:
```bash
npx prisma studio
```
Open Prisma Studio to view the updated User model.

## Sample Users (Seed Data)

Update `backend/prisma/seed.ts` to include last_login:

```typescript
const users = [
  {
    email: 'admin@example.com',
    password_hash: await bcrypt.hash('admin123', 12),
    role: 'SUPER_ADMIN',
    first_name: 'Admin',
    last_name: 'User',
    phone: '555-0100',
    is_active: true,
    last_login: new Date(), // Recent login
  },
  {
    email: 'pm@example.com',
    password_hash: await bcrypt.hash('password123', 12),
    role: 'PROJECT_MANAGER',
    first_name: 'Project',
    last_name: 'Manager',
    phone: '555-0101',
    is_active: true,
    last_login: new Date(Date.now() - 86400000), // Yesterday
  },
  {
    email: 'supervisor@example.com',
    password_hash: await bcrypt.hash('password123', 12),
    role: 'FIELD_SUPERVISOR',
    first_name: 'Field',
    last_name: 'Supervisor',
    phone: '555-0102',
    is_active: true,
    last_login: null, // Never logged in
  },
];
```

## TypeScript Types

Prisma will auto-generate TypeScript types:

```typescript
// User type
type User = {
  id: string;
  email: string;
  password_hash: string;
  role: UserRole;
  first_name: string;
  last_name: string;
  phone: string | null;
  avatar_url: string | null;
  is_active: boolean;
  last_login: Date | null;  // NEW!
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
};

// UserRole enum
enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  PROJECT_MANAGER = 'PROJECT_MANAGER',
  FIELD_SUPERVISOR = 'FIELD_SUPERVISOR',
  OFFICE_ADMIN = 'OFFICE_ADMIN',
  FIELD_WORKER = 'FIELD_WORKER',
  CLIENT_READ_ONLY = 'CLIENT_READ_ONLY',
}
```

## Usage Examples

### Create User
```typescript
const newUser = await prisma.user.create({
  data: {
    email: 'john@example.com',
    password_hash: hashedPassword,
    role: 'FIELD_WORKER',
    first_name: 'John',
    last_name: 'Doe',
    phone: '555-1234',
    is_active: true,
  },
});
```

### Update Last Login
```typescript
await prisma.user.update({
  where: { id: userId },
  data: { last_login: new Date() },
});
```

### Find by Email
```typescript
const user = await prisma.user.findUnique({
  where: { email: 'john@example.com' },
});
```

### Find Active Users by Role
```typescript
const managers = await prisma.user.findMany({
  where: {
    role: 'PROJECT_MANAGER',
    is_active: true,
    deleted_at: null,
  },
  orderBy: { last_login: 'desc' },
});
```

### Soft Delete User
```typescript
await prisma.user.update({
  where: { id: userId },
  data: { deleted_at: new Date() },
});
```

### Get User Statistics
```typescript
// Total users
const totalUsers = await prisma.user.count();

// Active users
const activeUsers = await prisma.user.count({
  where: { is_active: true, deleted_at: null },
});

// Users by role
const usersByRole = await prisma.user.groupBy({
  by: ['role'],
  _count: true,
});

// Recent logins (last 7 days)
const sevenDaysAgo = new Date();
sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

const recentLogins = await prisma.user.count({
  where: {
    last_login: { gte: sevenDaysAgo },
  },
});
```

## Validation Recommendations

### Backend Validation (express-validator)

```typescript
import { body } from 'express-validator';

// Create user validation
const createUserValidation = [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 8 }),
  body('first_name').trim().notEmpty(),
  body('last_name').trim().notEmpty(),
  body('phone').optional().isMobilePhone('any'),
  body('role').isIn(Object.values(UserRole)),
];

// Update user validation
const updateUserValidation = [
  body('first_name').optional().trim().notEmpty(),
  body('last_name').optional().trim().notEmpty(),
  body('phone').optional().isMobilePhone('any'),
  body('is_active').optional().isBoolean(),
];
```

## Frontend Form (React + MUI)

```typescript
interface UserFormData {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  phone?: string;
  role: UserRole;
}

// Form with validation
const UserForm = () => {
  const [formData, setFormData] = useState<UserFormData>({
    email: '',
    password: '',
    first_name: '',
    last_name: '',
    phone: '',
    role: 'FIELD_WORKER',
  });

  return (
    <form>
      <TextField
        label="Email"
        type="email"
        required
        value={formData.email}
      />
      <TextField
        label="First Name"
        required
        value={formData.first_name}
      />
      <TextField
        label="Last Name"
        required
        value={formData.last_name}
      />
      <TextField
        label="Phone"
        value={formData.phone}
      />
      <Select
        label="Role"
        value={formData.role}
      >
        <MenuItem value="SUPER_ADMIN">Super Admin</MenuItem>
        <MenuItem value="PROJECT_MANAGER">Project Manager</MenuItem>
        <MenuItem value="FIELD_SUPERVISOR">Field Supervisor</MenuItem>
        <MenuItem value="OFFICE_ADMIN">Office Admin</MenuItem>
        <MenuItem value="FIELD_WORKER">Field Worker</MenuItem>
      </Select>
    </form>
  );
};
```

## Summary

### What Changed
✅ Added `last_login` field to User model  
✅ Type: `DateTime?` (nullable timestamp with timezone)  
✅ Purpose: Track user login activity  

### What Was Already There
✅ All required fields (id, email, password_hash, role)  
✅ All user roles (5 roles + CLIENT_READ_ONLY)  
✅ Personal info (firstName, lastName, phone, avatarUrl)  
✅ Status flags (isActive)  
✅ Audit trail (createdAt, updatedAt, deletedAt)  
✅ Proper indexes (5 indexes including email and role)  
✅ Comprehensive relations  

### Next Steps

1. **Generate Prisma Client**:
   ```bash
   cd backend
   npm run prisma:generate
   ```

2. **Create Migration**:
   ```bash
   npm run prisma:migrate dev --name add-user-last-login
   ```

3. **Update Seed Data** (optional):
   - Add last_login to seed users

4. **Implement in Auth Service**:
   - Update last_login on successful login
   - Track user activity

---

**Status**: ✅ User Model Complete  
**File**: `backend/prisma/schema.prisma`  
**Ready For**: Database migration and authentication implementation


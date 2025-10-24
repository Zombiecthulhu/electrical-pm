# ✅ Prisma Schema Documentation

## Schema Updated Successfully

The Prisma schema has been fully configured with proper PostgreSQL data types, UUID primary keys, and comprehensive indexes for optimal query performance.

## Key Features

### ✅ PostgreSQL Configuration
- **Provider**: postgresql
- **Connection**: Uses `DATABASE_URL` environment variable
- **Database Name**: `electrical_pm` (configured in .env)

### ✅ UUID Primary Keys
All models use UUID (v4) for primary keys:
```prisma
id String @id @default(uuid()) @db.Uuid
```

Benefits:
- Globally unique identifiers
- Better for distributed systems
- No sequential ID guessing
- Supports database sharding (future)

### ✅ Timestamp Fields with Timezone
All date/time fields use PostgreSQL's `timestamptz` for proper timezone handling:
```prisma
created_at DateTime @default(now()) @db.Timestamptz(6)
updated_at DateTime @updatedAt @db.Timestamptz(6)
```

### ✅ Comprehensive Indexes
Performance indexes added to all frequently queried fields:
- Foreign key columns
- Status/type enum fields
- Date fields
- Email and unique identifiers
- Soft delete fields (deleted_at)

## Models Overview

### 1. User Model
**Purpose**: User authentication and profile management

**Key Fields**:
- `id` (UUID) - Primary key
- `email` (unique) - Login identifier
- `password_hash` - Bcrypt hashed password
- `role` - UserRole enum
- `first_name`, `last_name` - User name
- `phone` - Contact number (optional)
- `avatar_url` - Profile picture (optional)
- `is_active` - Account status
- `created_at`, `updated_at` - Audit timestamps
- `deleted_at` - Soft delete timestamp

**Indexes**:
- email (for login queries)
- role (for permission checks)
- is_active (for active user queries)
- created_at (for sorting)
- deleted_at (for filtering soft-deleted)

**Relations**:
- Created projects, clients, quotes
- Updated projects, clients, quotes
- Project memberships
- Uploaded files
- Daily logs

### 2. Client Model
**Purpose**: Client/customer management

**Key Fields**:
- `id` (UUID) - Primary key
- `name` - Client company/person name
- `type` - ClientType enum
- Contact information (address, phone, email, website)
- `tax_id` - Tax identification
- `created_by`, `updated_by` - Audit user references
- `created_at`, `updated_at`, `deleted_at` - Timestamps

**Indexes**:
- name (for search/sorting)
- type (for filtering)
- created_by (for user activity)
- created_at, deleted_at (for queries)

**Relations**:
- Projects (one-to-many)
- Quotes (one-to-many)
- Contacts (one-to-many)
- Creator, Updater (User)

### 3. ClientContact Model
**Purpose**: Multiple contacts per client

**Key Fields**:
- Contact details (name, title, phone, email)
- `is_primary` - Primary contact flag
- `client_id` - Foreign key to Client

**Indexes**:
- client_id (for fetching client contacts)
- is_primary (for finding primary contact)

### 4. Project Model
**Purpose**: Construction project management

**Key Fields**:
- `id` (UUID) - Primary key
- `name` - Project name
- `project_number` (unique) - Project identifier
- `client_id` - Foreign key to Client
- `status` - ProjectStatus enum
- `type` - ProjectType enum
- Location (location, address, latitude, longitude)
- Dates (start_date, estimated_end_date, actual_end_date)
- `budget` - Decimal(12,2)
- `description` - Project details
- Audit fields

**Indexes**:
- project_number (unique lookup)
- client_id (for client projects)
- status (for status filtering)
- type (for type filtering)
- created_by (for user projects)
- start_date, created_at (for sorting)
- deleted_at (soft delete filter)

**Relations**:
- Client
- Project members (many-to-many via ProjectMember)
- Files
- Daily logs
- Expenses

### 5. ProjectMember Model
**Purpose**: Project team assignments

**Key Fields**:
- `project_id`, `user_id` - Composite relationship
- `role` - Role on project (string for flexibility)
- `assigned_at` - Assignment timestamp

**Unique Constraint**: [project_id, user_id] - User can only be assigned once per project

**Indexes**:
- project_id (for project team queries)
- user_id (for user assignments)

### 6. ProjectExpense Model
**Purpose**: Track project expenses

**Key Fields**:
- `project_id` - Foreign key
- `description` - Expense details
- `amount` - Decimal(10,2)
- `category` - Expense category
- `date` - Expense date

**Indexes**:
- project_id (for project expenses)
- date (for time-based queries)
- category (for categorization)

### 7. File Model
**Purpose**: Document and photo management

**Key Fields**:
- `storage_path` - File location
- `original_filename` - Original name
- `mime_type` - File type
- `file_size` - Size in bytes
- `checksum` - SHA-256 for integrity
- `category` - FileCategory enum
- `project_id` - Optional project link
- `uploaded_by` - User reference
- `version_number` - For versioning
- `parent_file_id` - For version history
- `tags` - String array for categorization
- `deleted_at` - Soft delete

**Indexes**:
- project_id (for project files)
- uploaded_by (for user uploads)
- category (for file type filtering)
- uploaded_at (for sorting)
- deleted_at (soft delete filter)

**Self-Relation**: parent_file_id creates version history tree

### 8. DailyLog Model
**Purpose**: Daily field activity logging

**Key Fields**:
- `project_id` - Foreign key
- `date` - Log date
- `weather` - Weather conditions
- `crew_members` - JSON (flexible structure)
- `hours_worked` - JSON (per person)
- `work_performed` - Text description
- `materials_used` - JSON
- `equipment_used` - Text
- `issues` - Text (problems noted)
- `inspector_visit` - Inspector notes
- `created_by` - Logger user

**Indexes**:
- project_id (for project logs)
- date (for date range queries)
- created_by (for user logs)
- created_at (for sorting)

### 9. Quote Model
**Purpose**: Bid/quote management

**Key Fields**:
- `quote_number` (unique) - Quote identifier
- `client_id` - Foreign key
- `project_name` - Proposed project name
- `status` - QuoteStatus enum
- `line_items` - JSON (flexible line item structure)
- Financial (subtotal, tax, total) - Decimal(12,2)
- `notes` - Additional information
- `valid_until` - Quote expiration date
- Audit fields

**Indexes**:
- quote_number (unique lookup)
- client_id (for client quotes)
- status (for status filtering)
- created_by (for user quotes)
- created_at (for sorting)

## Enums

### UserRole
```
SUPER_ADMIN         - Full system access
PROJECT_MANAGER     - Manage projects & teams
FIELD_SUPERVISOR    - Field operations
OFFICE_ADMIN        - Office operations
FIELD_WORKER        - Field work only
CLIENT_READ_ONLY    - Limited client access
```

### ProjectStatus
```
QUOTED              - Quote sent
AWARDED             - Project awarded
IN_PROGRESS         - Active work
INSPECTION          - Under inspection
COMPLETE            - Finished
ON_HOLD             - Paused
CANCELLED           - Cancelled
```

### ProjectType
```
COMMERCIAL          - Commercial projects
RESIDENTIAL         - Residential projects
INDUSTRIAL          - Industrial projects
MAINTENANCE         - Maintenance work
OTHER               - Other types
```

### ClientType
```
GENERAL_CONTRACTOR  - GC clients
DEVELOPER           - Developer clients
HOMEOWNER           - Homeowners
COMMERCIAL          - Commercial clients
OTHER               - Other types
```

### FileCategory
```
DOCUMENT            - General documents
PHOTO               - Photographs
PLAN                - Construction plans
SPEC                - Specifications
PERMIT              - Permits
CONTRACT            - Contracts
INVOICE             - Invoices
OTHER               - Other files
```

### QuoteStatus
```
DRAFT               - Being created
SENT                - Sent to client
PENDING             - Awaiting response
ACCEPTED            - Quote accepted
REJECTED            - Quote rejected
```

## Audit Trail Pattern

All main models include audit fields:
```prisma
created_at DateTime  @default(now()) @db.Timestamptz(6)
updated_at DateTime  @updatedAt @db.Timestamptz(6)
created_by String    @db.Uuid
updated_by String    @db.Uuid
```

This provides:
- Who created the record
- When it was created
- Who last updated it
- When it was last updated

## Soft Delete Pattern

Critical models include soft delete:
```prisma
deleted_at DateTime? @db.Timestamptz(6)
```

Models with soft delete:
- User
- Client
- Project
- File

Benefits:
- Data recovery capability
- Audit trail preservation
- Referential integrity maintained
- Can permanently delete later

Usage:
```typescript
// Soft delete
await prisma.project.update({
  where: { id },
  data: { deleted_at: new Date() }
});

// Query only active records
await prisma.project.findMany({
  where: { deleted_at: null }
});
```

## Indexes Explained

### Why These Indexes?

1. **Foreign Keys** (project_id, user_id, client_id)
   - Speed up JOIN operations
   - Essential for relationship queries

2. **Status/Type Fields**
   - Frequently used in WHERE clauses
   - Used for filtering and grouping

3. **Date Fields** (created_at, start_date, date)
   - Used for sorting (ORDER BY)
   - Date range queries

4. **Unique Fields** (email, project_number, quote_number)
   - Already indexed (unique constraint)
   - Fast lookups

5. **Soft Delete** (deleted_at)
   - Most queries filter by `deleted_at IS NULL`
   - Partial index for better performance

### Index Impact

**Query Performance**:
- Without index: O(n) - Full table scan
- With index: O(log n) - Binary tree search

**Trade-offs**:
- ✅ Faster SELECT queries
- ✅ Faster WHERE filtering
- ✅ Faster ORDER BY sorting
- ❌ Slower INSERT/UPDATE (index maintenance)
- ❌ More disk space

For our use case (more reads than writes), indexes are beneficial.

## Next Steps

### 1. Generate Prisma Client
```bash
npm run prisma:generate
```

This generates the TypeScript types and Prisma Client.

### 2. Create Migration
```bash
npm run prisma:migrate
```

This will:
- Analyze schema changes
- Generate SQL migration
- Apply to database
- Prompt for migration name (e.g., "initial_setup")

### 3. Seed Database
```bash
npm run prisma:seed
```

This creates sample data:
- 3 users (admin, PM, supervisor)
- 1 client
- 1 project

### 4. Open Prisma Studio
```bash
npm run prisma:studio
```

Visual database editor at http://localhost:5555

## Schema Validation

✅ Schema validated successfully  
✅ All models have proper types  
✅ All relations defined correctly  
✅ Indexes configured  
✅ Enums defined  
✅ Ready for migration  

## Common Queries

### Find Active Projects
```typescript
const projects = await prisma.project.findMany({
  where: {
    deleted_at: null,
    status: 'IN_PROGRESS'
  },
  include: {
    client: true,
    members: {
      include: { user: true }
    }
  },
  orderBy: { created_at: 'desc' }
});
```

### Find User with Projects
```typescript
const user = await prisma.user.findUnique({
  where: { email: 'admin@example.com' },
  include: {
    project_members: {
      include: { project: true }
    }
  }
});
```

### Create Project with Members
```typescript
const project = await prisma.project.create({
  data: {
    name: 'New Project',
    project_number: 'PRJ-2025-002',
    client_id: clientId,
    status: 'QUOTED',
    type: 'COMMERCIAL',
    created_by: userId,
    updated_by: userId,
    members: {
      create: [
        { user_id: managerId, role: 'Project Manager' },
        { user_id: supervisorId, role: 'Field Supervisor' }
      ]
    }
  }
});
```

## Performance Tips

1. **Always filter soft deletes**: `where: { deleted_at: null }`
2. **Use select to limit fields**: Only fetch what you need
3. **Use include sparingly**: Don't nest too deep
4. **Paginate large results**: Use `skip` and `take`
5. **Use transactions**: For multi-step operations
6. **Leverage indexes**: Query on indexed fields

---

**Status: Schema Ready for Migration** 🚀

Run `npm run prisma:migrate` to create the database tables!


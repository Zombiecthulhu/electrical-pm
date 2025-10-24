# ✅ Authentication Middleware Created

## Middleware Implementation Complete

Comprehensive authentication and authorization middleware has been created with JWT verification, role-based access control, and advanced permission checking.

## File Created

**Location**: `backend/src/middleware/auth.middleware.ts` (550+ lines)

## Middleware Functions

### 1. authenticate

**Primary authentication middleware** - Verifies JWT from Authorization header or cookies.

**Features**:
- ✅ Extracts token from Authorization header (`Bearer <token>`)
- ✅ Falls back to cookie (`accessToken`)
- ✅ Verifies token using auth service
- ✅ Attaches user info to `req.user`
- ✅ Returns proper 401 errors
- ✅ Detailed logging for security audit

**Usage**:
```typescript
import { authenticate } from './middleware/auth.middleware';

// Protect single route
router.get('/protected', authenticate, controller);

// Protect all routes in router
router.use(authenticate);
```

**Response on Failure**:
```json
{
  "success": false,
  "error": {
    "code": "NO_TOKEN",
    "message": "Authentication required. Please provide a valid token."
  }
}
```

**Token Expired**:
```json
{
  "success": false,
  "error": {
    "code": "TOKEN_EXPIRED",
    "message": "Your session has expired. Please login again."
  }
}
```

### 2. authorize(allowedRoles)

**Role-based authorization middleware** - Checks if user has required role(s).

**Features**:
- ✅ Single role or multiple roles
- ✅ Must be used after `authenticate`
- ✅ Returns 403 if insufficient permissions
- ✅ Logs authorization attempts
- ✅ Type-safe with TypeScript

**Usage**:
```typescript
import { authenticate, authorize } from './middleware/auth.middleware';

// Single role
router.post(
  '/projects',
  authenticate,
  authorize('SUPER_ADMIN'),
  createProject
);

// Multiple roles (any one matches)
router.get(
  '/projects',
  authenticate,
  authorize(['PROJECT_MANAGER', 'SUPER_ADMIN']),
  getProjects
);
```

**Response on Failure**:
```json
{
  "success": false,
  "error": {
    "code": "FORBIDDEN",
    "message": "You do not have permission to access this resource."
  }
}
```

### 3. authorizeMinRole(minRole)

**Hierarchical authorization** - Checks if user's role meets minimum level.

**Role Hierarchy** (high to low):
```
6. SUPER_ADMIN       (highest)
5. PROJECT_MANAGER
4. FIELD_SUPERVISOR
3. OFFICE_ADMIN
2. FIELD_WORKER
1. CLIENT_READ_ONLY  (lowest)
```

**Features**:
- ✅ Higher roles automatically have lower role permissions
- ✅ SUPER_ADMIN has all permissions
- ✅ Simplifies permission logic
- ✅ Easy to maintain

**Usage**:
```typescript
// Allows PROJECT_MANAGER and SUPER_ADMIN
router.post(
  '/projects',
  authenticate,
  authorizeMinRole('PROJECT_MANAGER'),
  createProject
);

// Allows FIELD_SUPERVISOR, PROJECT_MANAGER, SUPER_ADMIN
router.post(
  '/daily-logs',
  authenticate,
  authorizeMinRole('FIELD_SUPERVISOR'),
  createLog
);
```

**Response on Failure**:
```json
{
  "success": false,
  "error": {
    "code": "INSUFFICIENT_ROLE",
    "message": "This action requires at least PROJECT_MANAGER role."
  }
}
```

### 4. optionalAuthenticate

**Optional authentication** - Authenticates if token present, continues if not.

**Use Cases**:
- Public routes that show extra info for logged-in users
- Mixed public/private content
- Analytics tracking

**Usage**:
```typescript
// Public route with optional user context
router.get(
  '/public-projects',
  optionalAuthenticate,
  getPublicProjects
);
```

**Controller**:
```typescript
function getPublicProjects(req: AuthRequest, res: Response) {
  if (req.user) {
    // User is logged in - show personalized content
    return getPersonalizedProjects(req, res);
  } else {
    // Guest user - show public content only
    return getPublicProjectsOnly(req, res);
  }
}
```

### 5. authorizeOwnership(getUserId)

**Resource ownership authorization** - Ensures user owns the resource.

**Features**:
- ✅ SUPER_ADMIN bypasses ownership check
- ✅ Async support for database lookups
- ✅ Prevents users from modifying others' data
- ✅ Flexible userId extraction

**Usage**:
```typescript
// From URL parameter
router.put(
  '/profile/:userId',
  authenticate,
  authorizeOwnership((req) => req.params.userId),
  updateProfile
);

// From database lookup
router.delete(
  '/projects/:id',
  authenticate,
  authorizeOwnership(async (req) => {
    const project = await prisma.project.findUnique({
      where: { id: req.params.id },
    });
    return project?.created_by || '';
  }),
  deleteProject
);
```

**Response on Failure**:
```json
{
  "success": false,
  "error": {
    "code": "NOT_OWNER",
    "message": "You do not have permission to access this resource."
  }
}
```

## Helper Functions

### hasPermission(req, allowedRoles)

Check if user has permission (for use in controllers).

```typescript
function someController(req: AuthRequest, res: Response) {
  if (!hasPermission(req, ['SUPER_ADMIN', 'PROJECT_MANAGER'])) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  
  // Continue with logic
}
```

### hasMinRole(req, minRole)

Check if user meets minimum role level.

```typescript
function someController(req: AuthRequest, res: Response) {
  if (!hasMinRole(req, 'FIELD_SUPERVISOR')) {
    return res.status(403).json({ error: 'Insufficient permissions' });
  }
  
  // Continue with logic
}
```

### isOwnerOrAdmin(req, resourceOwnerId)

Check if user owns resource or is admin.

```typescript
async function updateProject(req: AuthRequest, res: Response) {
  const project = await prisma.project.findUnique({
    where: { id: req.params.id },
  });
  
  if (!isOwnerOrAdmin(req, project.created_by)) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  
  // Update project
}
```

## TypeScript Types

### AuthRequest

Extended Express Request with user information:

```typescript
interface AuthRequest extends Request {
  user?: {
    userId: string;
    role: string;
    email?: string;
  };
}
```

**Usage in controllers**:
```typescript
import { AuthRequest } from '../middleware/auth.middleware';

export function getProfile(req: AuthRequest, res: Response) {
  const userId = req.user?.userId;  // Type-safe access
  // ...
}
```

## Complete Usage Examples

### 1. Public Route (No Auth)

```typescript
// No authentication required
router.get('/public/projects', getPublicProjects);
```

### 2. Protected Route (Authenticated Users Only)

```typescript
// Must be logged in
router.get('/dashboard', authenticate, getDashboard);
```

### 3. Admin-Only Route

```typescript
// Only SUPER_ADMIN
router.delete(
  '/users/:id',
  authenticate,
  authorize('SUPER_ADMIN'),
  deleteUser
);
```

### 4. Multiple Roles

```typescript
// PROJECT_MANAGER or SUPER_ADMIN
router.post(
  '/projects',
  authenticate,
  authorize(['PROJECT_MANAGER', 'SUPER_ADMIN']),
  createProject
);
```

### 5. Hierarchical Permissions

```typescript
// FIELD_SUPERVISOR and above (includes PROJECT_MANAGER, SUPER_ADMIN)
router.post(
  '/daily-logs',
  authenticate,
  authorizeMinRole('FIELD_SUPERVISOR'),
  createDailyLog
);
```

### 6. Owner or Admin

```typescript
// User can only update their own profile, unless they're SUPER_ADMIN
router.put(
  '/users/:id',
  authenticate,
  authorizeOwnership((req) => req.params.id),
  updateUser
);
```

### 7. Complex Authorization

```typescript
// Managers can see all, others only their own
router.get('/projects', authenticate, async (req: AuthRequest, res: Response) => {
  if (hasMinRole(req, 'PROJECT_MANAGER')) {
    // Managers see all projects
    const projects = await prisma.project.findMany();
    return res.json(projects);
  } else {
    // Workers see only their assigned projects
    const projects = await prisma.project.findMany({
      where: {
        project_members: {
          some: { user_id: req.user?.userId },
        },
      },
    });
    return res.json(projects);
  }
});
```

### 8. Optional Authentication

```typescript
// Public route with personalized content for logged-in users
router.get('/feed', optionalAuthenticate, async (req: AuthRequest, res: Response) => {
  if (req.user) {
    // Personalized feed
    const feed = await getPersonalizedFeed(req.user.userId);
    return res.json({ feed, personalized: true });
  } else {
    // Generic public feed
    const feed = await getPublicFeed();
    return res.json({ feed, personalized: false });
  }
});
```

## Token Sources

The middleware checks for tokens in this order:

**1. Authorization Header** (Recommended):
```http
GET /api/v1/projects
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**2. Cookie** (Alternative):
```http
GET /api/v1/projects
Cookie: accessToken=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Frontend Examples

**With Axios (Header)**:
```typescript
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000/api/v1',
});

// Add token to all requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Use it
const projects = await api.get('/projects');
```

**With Fetch (Header)**:
```typescript
const token = localStorage.getItem('accessToken');

const response = await fetch('http://localhost:5000/api/v1/projects', {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
});
```

**With Cookies**:
```typescript
const response = await fetch('http://localhost:5000/api/v1/projects', {
  credentials: 'include',  // Send cookies
  headers: {
    'Content-Type': 'application/json',
  },
});
```

## Error Responses

### 401 Unauthorized

**No Token**:
```json
{
  "success": false,
  "error": {
    "code": "NO_TOKEN",
    "message": "Authentication required. Please provide a valid token."
  }
}
```

**Invalid Token**:
```json
{
  "success": false,
  "error": {
    "code": "INVALID_TOKEN",
    "message": "Invalid authentication token. Please login again."
  }
}
```

**Expired Token**:
```json
{
  "success": false,
  "error": {
    "code": "TOKEN_EXPIRED",
    "message": "Your session has expired. Please login again."
  }
}
```

### 403 Forbidden

**Insufficient Permissions**:
```json
{
  "success": false,
  "error": {
    "code": "FORBIDDEN",
    "message": "You do not have permission to access this resource."
  }
}
```

**Insufficient Role**:
```json
{
  "success": false,
  "error": {
    "code": "INSUFFICIENT_ROLE",
    "message": "This action requires at least PROJECT_MANAGER role."
  }
}
```

**Not Owner**:
```json
{
  "success": false,
  "error": {
    "code": "NOT_OWNER",
    "message": "You do not have permission to access this resource."
  }
}
```

## Logging

The middleware logs all authentication and authorization events:

**Success**:
```
info: User authenticated successfully
  userId: "uuid-123"
  role: "PROJECT_MANAGER"
  path: "/api/v1/projects"
```

**Failure**:
```
warn: Authentication failed: No token provided
  ip: "192.168.1.1"
  path: "/api/v1/protected"

warn: Authorization failed: Insufficient permissions
  userId: "uuid-123"
  userRole: "FIELD_WORKER"
  requiredRoles: ["PROJECT_MANAGER", "SUPER_ADMIN"]
  path: "/api/v1/projects"
```

## Security Features

✅ **Token Verification** - Cryptographic signature check  
✅ **Expiration Checking** - Enforces token lifetime  
✅ **Role Validation** - Prevents privilege escalation  
✅ **Ownership Checking** - Prevents unauthorized access  
✅ **Audit Logging** - All auth events logged  
✅ **Type Safety** - TypeScript prevents errors  
✅ **Generic Errors** - No information leakage  
✅ **Multiple Token Sources** - Header or cookie  

## Integration Example

### Complete Route Setup

```typescript
import express from 'express';
import {
  authenticate,
  authorize,
  authorizeMinRole,
  authorizeOwnership,
} from './middleware/auth.middleware';
import * as projectController from './controllers/project.controller';

const router = express.Router();

// Public routes
router.get('/projects/public', projectController.getPublicProjects);

// Authenticated routes
router.get(
  '/projects',
  authenticate,
  projectController.getProjects
);

// Admin-only routes
router.delete(
  '/projects/:id',
  authenticate,
  authorize('SUPER_ADMIN'),
  projectController.deleteProject
);

// Manager and above
router.post(
  '/projects',
  authenticate,
  authorizeMinRole('PROJECT_MANAGER'),
  projectController.createProject
);

// Owner or admin only
router.put(
  '/projects/:id',
  authenticate,
  authorizeOwnership(async (req) => {
    const project = await prisma.project.findUnique({
      where: { id: req.params.id },
    });
    return project?.created_by || '';
  }),
  projectController.updateProject
);

export default router;
```

## Next Steps

### 1. Create Authentication Controller

**File**: `backend/src/controllers/auth.controller.ts`

Functions to implement:
- `register()` - User signup
- `login()` - User signin
- `refresh()` - Token refresh
- `logout()` - Invalidate tokens
- `me()` - Get current user
- `changePassword()` - Update password

### 2. Create Authentication Routes

**File**: `backend/src/routes/auth.routes.ts`

Routes to create:
- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/refresh`
- `POST /api/v1/auth/logout`
- `GET /api/v1/auth/me`
- `PUT /api/v1/auth/password`

### 3. Protect Existing Routes

Add middleware to existing routes:
```typescript
import { authenticate, authorizeMinRole } from './middleware';

// Protect routes
router.use('/projects', authenticate);
router.post('/projects', authorizeMinRole('PROJECT_MANAGER'));
```

### 4. Setup Cookie Parser

Install and configure cookie-parser:
```bash
npm install cookie-parser @types/cookie-parser
```

**In server.ts**:
```typescript
import cookieParser from 'cookie-parser';

app.use(cookieParser());
```

## Summary

### ✅ Middleware Created

**Core Middleware** (5):
1. ✅ `authenticate` - JWT verification
2. ✅ `authorize(roles)` - Role-based access
3. ✅ `authorizeMinRole(role)` - Hierarchical permissions
4. ✅ `optionalAuthenticate` - Optional auth
5. ✅ `authorizeOwnership(fn)` - Resource ownership

**Helper Functions** (3):
1. ✅ `hasPermission()` - Check permission
2. ✅ `hasMinRole()` - Check role level
3. ✅ `isOwnerOrAdmin()` - Check ownership

### 🎯 Features

✅ **JWT from header or cookie**  
✅ **Role-based access control**  
✅ **Hierarchical permissions**  
✅ **Resource ownership checking**  
✅ **Optional authentication**  
✅ **Comprehensive error handling**  
✅ **Security audit logging**  
✅ **TypeScript type safety**  
✅ **Multiple authorization strategies**  

### 🔐 Security

✅ **No information leakage**  
✅ **Proper HTTP status codes**  
✅ **Detailed audit logging**  
✅ **Generic error messages**  
✅ **SUPER_ADMIN bypass support**  
✅ **Token expiration handling**  

---

**Status**: ✅ Authentication Middleware Complete  
**File**: `backend/src/middleware/auth.middleware.ts`  
**Lines**: 550+  
**Ready For**: Authentication controller and protected routes


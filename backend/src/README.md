# Backend Source Code Structure

This directory contains the backend application source code organized following the cursor rules.

## Directory Structure

```
src/
├── config/          - Configuration and setup
│   ├── database.ts     - Prisma client and DB connection
│   └── index.ts        - Config exports
│
├── controllers/     - Request handlers (HTTP layer)
│   └── index.ts        - Controller exports
│
├── middleware/      - Express middleware
│   ├── error-handler.ts - Global error handling
│   └── index.ts         - Middleware exports
│
├── models/          - Type definitions and DTOs
│   └── index.ts        - Model exports (re-exports Prisma types)
│
├── routes/          - API route definitions
│   └── index.ts        - Route exports and API v1 router
│
├── services/        - Business logic layer
│   └── index.ts        - Service exports
│
├── utils/           - Helper functions and utilities
│   ├── constants.ts    - Application constants
│   ├── logger.ts       - Winston logger configuration
│   ├── response.ts     - Standardized API responses
│   └── index.ts        - Utility exports
│
└── server.ts        - Application entry point
```

## Architectural Pattern

This backend follows a **layered architecture**:

### 1. Routes Layer (`/routes`)
- Define API endpoints
- Map URLs to controller functions
- Apply route-specific middleware
- Group related endpoints

**Example:**
```typescript
router.post('/login', validateLoginInput, authController.login);
```

### 2. Controller Layer (`/controllers`)
- Handle HTTP requests and responses
- Extract data from request (body, params, query)
- Call service layer for business logic
- Return formatted responses

**Responsibilities:**
- Input extraction
- Service coordination
- Response formatting
- HTTP status codes

**Example:**
```typescript
export const getProject = async (req: Request, res: Response) => {
  const { id } = req.params;
  const project = await projectService.findById(id);
  return sendSuccess(res, project);
};
```

### 3. Service Layer (`/services`)
- Implement business logic
- Interact with database (Prisma)
- Perform data validation and transformation
- Handle complex operations
- Reusable across multiple controllers

**Responsibilities:**
- CRUD operations
- Business rules enforcement
- Data validation
- Transaction management
- Third-party integrations

**Example:**
```typescript
export const createProject = async (data: CreateProjectDTO, userId: string) => {
  // Validate business rules
  // Create project in database
  // Return created project
};
```

### 4. Middleware Layer (`/middleware`)
- Process requests before controllers
- Authentication verification
- Authorization checks
- Input validation
- Error handling

**Example:**
```typescript
export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  // Verify JWT token
  // Attach user to request
  // Call next() or throw error
};
```

### 5. Models Layer (`/models`)
- Type definitions (TypeScript interfaces)
- Data Transfer Objects (DTOs)
- Request/Response types
- Re-export Prisma types

**Note:** Database models are defined in `prisma/schema.prisma`

**Example:**
```typescript
export interface CreateProjectDTO {
  name: string;
  client_id: string;
  type: ProjectType;
  // ...
}
```

### 6. Utils Layer (`/utils`)
- Helper functions
- Constants
- Formatters
- Validators
- Common utilities

**Example:**
```typescript
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount);
};
```

### 7. Config Layer (`/config`)
- Database connection
- Environment variables
- Application configuration
- External service setup

## Data Flow

```
Request → Routes → Middleware → Controller → Service → Database
                                                ↓
Response ← Routes ← Controller ← Service ← Prisma
```

**Detailed Flow:**
1. **Request arrives** at an endpoint
2. **Route** matches URL and HTTP method
3. **Middleware** processes request (auth, validation)
4. **Controller** receives request, extracts data
5. **Service** performs business logic and DB operations
6. **Prisma** interacts with PostgreSQL database
7. **Service** returns result to controller
8. **Controller** formats response
9. **Response** sent back to client

## Naming Conventions

Following cursor rules:

### Files
- **kebab-case**: `auth-service.ts`, `project-controller.ts`
- **Components**: `PascalCase` (if creating shared components)

### Code
- **Functions/Variables**: `camelCase` - `getUserById`, `projectData`
- **Classes**: `PascalCase` - `ProjectService`, `AuthController`
- **Constants**: `UPPER_SNAKE_CASE` - `MAX_FILE_SIZE`, `API_VERSION`
- **Interfaces/Types**: `PascalCase` - `User`, `CreateProjectDTO`
- **Private properties**: prefix with `_` - `_validateInput`

### Database (Prisma)
- **Tables**: `snake_case` - `users`, `project_members`
- **Columns**: `snake_case` - `created_at`, `project_id`

## Best Practices

### Controllers
✅ Keep thin - delegate to services  
✅ Handle HTTP concerns only  
✅ Use response helpers from `utils/response.ts`  
✅ Catch errors and pass to error handler  
❌ Don't include business logic  
❌ Don't access database directly  

### Services
✅ Implement business logic  
✅ Interact with database via Prisma  
✅ Reusable across controllers  
✅ Throw AppError for errors  
❌ Don't handle HTTP requests/responses  
❌ Don't import Express types  

### Middleware
✅ Single responsibility  
✅ Call next() or throw error  
✅ Attach data to req object if needed  
❌ Don't include business logic  

### Models
✅ Define clear interfaces  
✅ Use TypeScript strict types  
✅ Document complex types  
❌ Don't include logic  

## Error Handling

All errors should use `AppError` from middleware:

```typescript
import { AppError } from '@middleware/error-handler';

throw new AppError('Project not found', 404, 'NOT_FOUND');
```

## Response Format

Use helpers from `utils/response.ts`:

```typescript
import { sendSuccess, sendError, sendPaginated } from '@utils/response';

// Success
return sendSuccess(res, data, 'Optional message');

// Error
return sendError(res, 'ERROR_CODE', 'Error message', 400);

// Paginated
return sendPaginated(res, items, page, pageSize, total);
```

## Import Paths

Use path aliases configured in `tsconfig.json`:

```typescript
import { prisma } from '@config/database';
import { projectService } from '@services/project.service';
import { authenticate } from '@middleware/authenticate';
import { sendSuccess } from '@utils/response';
```

## Adding New Features

### 1. Create Service
```typescript
// src/services/example.service.ts
export const exampleService = {
  create: async (data) => { /* ... */ },
  findById: async (id) => { /* ... */ },
  update: async (id, data) => { /* ... */ },
  delete: async (id) => { /* ... */ },
};
```

### 2. Create Controller
```typescript
// src/controllers/example.controller.ts
export const exampleController = {
  getAll: async (req, res) => { /* ... */ },
  getOne: async (req, res) => { /* ... */ },
  create: async (req, res) => { /* ... */ },
  update: async (req, res) => { /* ... */ },
  delete: async (req, res) => { /* ... */ },
};
```

### 3. Create Routes
```typescript
// src/routes/example.routes.ts
const router = Router();
router.get('/', authenticate, exampleController.getAll);
router.post('/', authenticate, authorize, exampleController.create);
export default router;
```

### 4. Register Routes
```typescript
// src/routes/index.ts
import exampleRoutes from './example.routes';
router.use('/examples', exampleRoutes);
```

## Testing

When adding tests (future):
- Unit tests for services
- Integration tests for controllers
- E2E tests for routes
- Place tests next to source files with `.test.ts` extension

## Security Checklist

✅ Validate all inputs  
✅ Authenticate protected routes  
✅ Authorize actions based on roles  
✅ Sanitize user input  
✅ Use parameterized queries (Prisma)  
✅ Hash passwords (bcrypt)  
✅ Secure JWT tokens (HTTP-only cookies)  
✅ Rate limit endpoints  
✅ Log security events  
✅ Never expose stack traces  

---

**Ready to build!** Start implementing features following this structure.


# Frontend Source Code Structure

This directory contains the React frontend application source code organized following the cursor rules.

## Directory Structure

```
src/
├── components/          - React components
│   ├── common/         - Reusable UI components
│   ├── layout/         - App shell and navigation
│   ├── modules/        - Module-specific components
│   └── index.ts        - Component exports
│
├── pages/              - Route-level page components
│   └── index.ts        - Page exports
│
├── services/           - API client and service functions
│   └── index.ts        - Service exports
│
├── store/              - State management (Zustand/Redux)
│   └── index.ts        - Store exports
│
├── utils/              - Helper functions and utilities
│   └── index.ts        - Utility exports
│
├── hooks/              - Custom React hooks
│   └── index.ts        - Hook exports
│
├── theme/              - MUI theme configuration
│   └── index.ts        - Theme exports
│
├── App.tsx             - Main application component
└── index.tsx           - Application entry point
```

## Architectural Pattern

This frontend follows a **component-based architecture** with clear separation of concerns:

### 1. Components Layer (`/components`)

**Common Components** (`/components/common`)
- Reusable UI elements used across the app
- Buttons, inputs, cards, modals, etc.
- No business logic, only presentation
- Should be generic and configurable via props

**Layout Components** (`/components/layout`)
- Define the app structure and navigation
- AppShell, Header, Sidebar, Footer
- Handle responsive behavior
- Manage navigation and routing

**Module Components** (`/components/modules`)
- Feature-specific components
- Organized by module (Projects, Clients, etc.)
- Can use common components
- Contain module-specific business logic

### 2. Pages Layer (`/pages`)
- Top-level components for each route
- Compose layout and components
- Handle route parameters
- Fetch data (using hooks or services)
- Page-level state management

**Example:**
```typescript
// pages/ProjectsPage.tsx
export const ProjectsPage = () => {
  const { data, loading } = useProjects();
  
  return (
    <AppShell>
      <PageHeader title="Projects" />
      <ProjectList projects={data} loading={loading} />
    </AppShell>
  );
};
```

### 3. Services Layer (`/services`)
- API communication with backend
- HTTP requests using Axios
- Type-safe request/response handling
- Error handling and retries

**Example:**
```typescript
// services/projectService.ts
export const projectService = {
  getAll: () => api.get<Project[]>('/projects'),
  getById: (id: string) => api.get<Project>(`/projects/${id}`),
  create: (data: CreateProjectDTO) => api.post<Project>('/projects', data),
  update: (id: string, data: UpdateProjectDTO) => 
    api.put<Project>(`/projects/${id}`, data),
  delete: (id: string) => api.delete(`/projects/${id}`)
};
```

### 4. Store Layer (`/store`)
- Global state management
- Authentication state (user, token)
- UI state (theme, sidebar, modals)
- Cached data (if not using React Query)

**Zustand Example:**
```typescript
// store/authStore.ts
export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  login: (user, token) => set({ user, token, isAuthenticated: true }),
  logout: () => set({ user: null, token: null, isAuthenticated: false })
}));
```

### 5. Hooks Layer (`/hooks`)
- Custom React hooks
- Reusable stateful logic
- API request hooks
- Form management hooks
- UI state hooks

**Example:**
```typescript
// hooks/useApi.ts
export const useApi = <T>(apiCall: () => Promise<T>) => {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  const execute = async () => {
    setLoading(true);
    try {
      const result = await apiCall();
      setData(result);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  };
  
  return { data, loading, error, execute };
};
```

### 6. Utils Layer (`/utils`)
- Pure utility functions
- No React dependencies
- Formatters, validators, helpers
- Constants and configuration

**Example:**
```typescript
// utils/formatters.ts
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount);
};

export const formatDate = (date: Date): string => {
  return new Intl.DateTimeFormat('en-US').format(date);
};
```

### 7. Theme Layer (`/theme`)
- Material-UI theme configuration
- Color palettes
- Typography settings
- Component style overrides
- Responsive breakpoints

## Data Flow

```
User Interaction
    ↓
Component (UI)
    ↓
Event Handler
    ↓
Custom Hook (optional)
    ↓
Service (API call)
    ↓
Backend API
    ↓
Response
    ↓
Store/State Update
    ↓
Component Re-render
```

## Naming Conventions

Following cursor rules:

### Files
- **Components**: PascalCase - `ProjectList.tsx`, `ClientCard.tsx`
- **Hooks**: camelCase with "use" prefix - `useAuth.ts`, `useApi.ts`
- **Services**: camelCase with "Service" suffix - `projectService.ts`
- **Utils**: camelCase - `formatters.ts`, `validators.ts`
- **Pages**: PascalCase with "Page" suffix - `ProjectsPage.tsx`

### Code
- **Components**: PascalCase - `ProjectList`, `ClientCard`
- **Functions**: camelCase - `handleSubmit`, `fetchProjects`
- **Variables**: camelCase - `projectData`, `isLoading`
- **Constants**: UPPER_SNAKE_CASE - `API_BASE_URL`, `MAX_FILE_SIZE`
- **Types/Interfaces**: PascalCase - `Project`, `User`, `ApiResponse<T>`

## Best Practices

### Components
✅ Keep components small and focused (< 200 lines)  
✅ Use functional components with hooks  
✅ Extract reusable logic into custom hooks  
✅ Use TypeScript for type safety  
✅ Memoize expensive computations (useMemo)  
✅ Memoize callbacks (useCallback)  
✅ Use React.memo() for performance  
❌ Don't create class components  
❌ Don't make components do too much  

### State Management
✅ Use local state (useState) for component-specific data  
✅ Use global state (Zustand/Redux) for shared data  
✅ Use React Query for server state  
✅ Keep state normalized (avoid deep nesting)  
✅ Derive values instead of storing them  
❌ Don't store derived data in state  
❌ Don't make state too granular  

### API Calls
✅ Use custom hooks for API calls  
✅ Handle loading and error states  
✅ Show loading indicators  
✅ Display user-friendly error messages  
✅ Implement retry logic for failed requests  
❌ Don't make API calls directly in components  
❌ Don't ignore error states  

### Performance
✅ Code split by route (React.lazy)  
✅ Lazy load heavy components  
✅ Virtualize long lists (react-window)  
✅ Debounce search inputs  
✅ Optimize images  
✅ Use production build for deployment  
❌ Don't load everything at once  
❌ Don't create new functions in render  

## Component Patterns

### Presentational vs. Container Components

**Presentational Components**:
- Focus on how things look
- Receive data via props
- No state management
- No API calls
- Highly reusable

```typescript
// Presentational
interface ProjectCardProps {
  project: Project;
  onEdit: (id: string) => void;
}

export const ProjectCard: React.FC<ProjectCardProps> = ({ project, onEdit }) => {
  return (
    <Card>
      <h3>{project.name}</h3>
      <button onClick={() => onEdit(project.id)}>Edit</button>
    </Card>
  );
};
```

**Container Components**:
- Focus on how things work
- Fetch data
- Manage state
- Handle business logic
- Pass data to presentational components

```typescript
// Container
export const ProjectListContainer = () => {
  const { projects, loading } = useProjects();
  const navigate = useNavigate();
  
  const handleEdit = (id: string) => {
    navigate(`/projects/${id}/edit`);
  };
  
  if (loading) return <Loading />;
  
  return (
    <div>
      {projects.map(project => (
        <ProjectCard 
          key={project.id} 
          project={project} 
          onEdit={handleEdit} 
        />
      ))}
    </div>
  );
};
```

## Import Patterns

### Path Aliases
Configure in `tsconfig.json`:
```json
{
  "compilerOptions": {
    "baseUrl": "src",
    "paths": {
      "@components/*": ["components/*"],
      "@pages/*": ["pages/*"],
      "@services/*": ["services/*"],
      "@hooks/*": ["hooks/*"],
      "@utils/*": ["utils/*"],
      "@store/*": ["store/*"],
      "@theme/*": ["theme/*"]
    }
  }
}
```

### Usage
```typescript
// Instead of: import { Button } from '../../../components/common/Button';
import { Button } from '@components/common/Button';

// Instead of: import { useAuth } from '../../hooks/useAuth';
import { useAuth } from '@hooks/useAuth';
```

## Testing Strategy

### Component Tests
- Test user interactions
- Test conditional rendering
- Test prop variations
- Use React Testing Library

### Hook Tests
- Test state changes
- Test side effects
- Use @testing-library/react-hooks

### Integration Tests
- Test user workflows
- Test API integration
- Use Cypress or Playwright

## Folder Creation Guidelines

When adding new features:

1. **New Module**: Create folder in `components/modules/`
2. **New Page**: Create file in `pages/`
3. **New Service**: Create file in `services/`
4. **New Hook**: Create file in `hooks/`
5. **New Utility**: Create file in `utils/`

## Security Considerations

✅ Sanitize user input  
✅ Use HTTPS only  
✅ Store tokens securely (HTTP-only cookies)  
✅ Validate data on client and server  
✅ Implement CSRF protection  
✅ Use Content Security Policy  
❌ Never store sensitive data in localStorage  
❌ Never expose API keys in client code  

---

**Ready to build!** Start implementing features following this structure.


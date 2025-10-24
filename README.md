# Electrical Construction Project Management System

A comprehensive, modular project management system specifically designed for electrical construction businesses. This system serves as a centralized hub for managing projects, clients, documentation, team collaboration, and daily operations.

## 🚀 Features

- **Project Management**: Complete project lifecycle management with status tracking
- **Client Management**: Client profiles, history, and relationship tracking
- **Document Management**: Centralized storage with version control
- **Photo Management**: Job site photography organization
- **Daily Logs**: Field activity logging and documentation
- **Quote Management**: Estimation and proposal creation
- **User Management**: Role-based access control
- **Mobile-First Design**: Optimized for field use

## 🛠 Tech Stack

### Frontend
- React 18+ with TypeScript
- Material-UI (MUI) v5+
- React Router v6
- Zustand/Redux Toolkit for state management
- Axios for HTTP requests
- React Query for data fetching/caching

### Backend
- Node.js 18+ with Express.js
- TypeScript for type safety
- Prisma ORM with PostgreSQL 14+
- JWT (jsonwebtoken) for authentication
- bcrypt for password hashing
- Multer for file uploads
- Sharp for image processing

## 📋 Prerequisites

- Node.js 18+
- PostgreSQL 14+
- npm or yarn
- Git

## 🚀 Getting Started

### 1. Clone the Repository

\`\`\`bash
git clone [repository-url]
cd electrical-construction-pm
\`\`\`

### 2. Set Up Environment Variables

Create a .env file in the backend directory:

\`\`\`env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/project_mgmt

# Authentication
JWT_SECRET=your-secret-key-change-in-production
JWT_EXPIRES_IN=30m
REFRESH_TOKEN_SECRET=your-refresh-secret
REFRESH_TOKEN_EXPIRES_IN=7d

# File Storage
STORAGE_PATH=/storage
MAX_FILE_SIZE=10485760  # 10MB in bytes

# Server
PORT=5000
NODE_ENV=development
\`\`\`

Create a .env file in the frontend directory:

\`\`\`env
REACT_APP_API_URL=http://localhost:5000/api/v1
\`\`\`

### 3. Install Dependencies

Backend:
\`\`\`bash
cd backend
npm install
\`\`\`

Frontend:
\`\`\`bash
cd frontend
npm install
\`\`\`

### 4. Database Setup

\`\`\`bash
cd backend
npx prisma migrate dev
npx prisma db seed
\`\`\`

### 5. Start Development Servers

Backend:
\`\`\`bash
cd backend
npm run dev
\`\`\`

Frontend:
\`\`\`bash
cd frontend
npm start
\`\`\`

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000/api/v1

## 📁 Project Structure

### Backend (/backend)
\`\`\`
/src
  /controllers    # API route handlers
  /models         # Prisma schema and database models
  /services       # Business logic layer
  /middleware     # Auth, validation, error handling
  /routes         # API route definitions
  /utils          # Helpers, formatters, constants
  /config         # Database config, environment setup
server.js         # Entry point
\`\`\`

### Frontend (/frontend)
\`\`\`
/src
  /components
    /common       # Reusable components
    /layout       # App shell, sidebar, header, footer
    /modules      # Module-specific components
  /pages          # Route-level page components
  /services       # API client
  /store          # State management
  /utils          # Helper functions
  /hooks          # Custom React hooks
  /theme          # MUI theme configuration
  App.tsx
  index.tsx
\`\`\`

## 🔒 Security Features

- JWT tokens stored in HTTP-only cookies
- Refresh token rotation
- Password hashing with bcrypt
- Role-based access control (RBAC)
- Input validation and sanitization
- File upload security measures
- Secure file storage and serving

## 📱 Mobile Support

The application is designed with a mobile-first approach:
- Responsive design for all screen sizes
- Touch-friendly interface
- Optimized for field use
- Progressive Web App (PWA) capabilities

## 🧪 Testing

Run tests:

\`\`\`bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test
\`\`\`

## 📚 Documentation

- [Product Requirements Document](./PRD.md)
- [Cursor Rules](./cursorrules)
- API Documentation (available at /api/docs when running)

## 🤝 Contributing

1. Follow the established code style and conventions
2. Use TypeScript for type safety
3. Write clear commit messages following conventional commits
4. Test your changes thoroughly
5. Update documentation as needed

## 📄 License

This project is proprietary and confidential.

## 👥 Target Users

- Business owners (full access)
- Project managers (project oversight)
- Field supervisors (daily logs, photos)
- Office staff (documents, quotes)
- Field workers (view assignments, upload photos)

## 🔜 Future Features

- Mobile app (React Native)
- Real-time collaboration
- Advanced analytics
- Accounting software integration
- OCR for document processing
- Cloud migration (Google Cloud Platform)

## ⚡ Performance Considerations

- Code splitting for optimized loading
- Image optimization and lazy loading
- Caching strategies
- Database query optimization
- Efficient file handling

## 🆘 Support

For support or questions, please contact the development team.

---

Built with ❤️ using AI-assisted development in Cursor IDE

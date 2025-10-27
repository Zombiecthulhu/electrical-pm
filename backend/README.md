# Electrical Construction PM - Backend API

Backend API for the Electrical Construction Project Management System.

## Tech Stack

- Node.js 18+
- Express.js with TypeScript
- PostgreSQL with Prisma ORM
- JWT Authentication
- Winston for logging

## Setup Instructions

### 1. Install Dependencies

\`\`\`bash
npm install
\`\`\`

### 2. Environment Variables

Copy the example environment file and configure:

\`\`\`bash
cp env.example .env
\`\`\`

Update the `.env` file with your database credentials and JWT secrets.

### 3. Database Setup

Make sure PostgreSQL is running, then:

\`\`\`bash
# Generate Prisma Client
npm run prisma:generate

# Run database migrations
npm run prisma:migrate

# Seed the database with sample data
npm run prisma:seed
\`\`\`

### 4. Start Development Server

\`\`\`bash
npm run dev
\`\`\`

The API will be available at: http://localhost:5000

## Default Seed Users

After running the seed script, you can use these credentials:

- **Admin**: admin@example.com / Admin@123
- **Project Manager**: pm@example.com / Manager@123
- **Field Supervisor**: supervisor@example.com / Super@123

## Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build TypeScript to JavaScript
- `npm start` - Start production server
- `npm run prisma:generate` - Generate Prisma Client
- `npm run prisma:migrate` - Run database migrations
- `npm run prisma:studio` - Open Prisma Studio (database GUI)
- `npm run prisma:seed` - Seed database with sample data
- `npm test` - Run tests
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier

## API Structure

\`\`\`
/api/v1
  /auth          - Authentication endpoints
  /users         - User management
  /projects      - Project management
  /clients       - Client management
  /files         - File upload/download
  /daily-logs    - Daily logs
  /quotes        - Quote management
\`\`\`

## Project Structure

\`\`\`
src/
├── config/         - Configuration files (database, etc.)
├── controllers/    - Request handlers
├── middleware/     - Express middleware (auth, validation, etc.)
├── models/         - Data models (currently in Prisma schema)
├── routes/         - API route definitions
├── services/       - Business logic
├── utils/          - Helper functions and utilities
└── server.ts       - Application entry point
\`\`\`

## Security Features

- JWT-based authentication with HTTP-only cookies
- Password hashing with bcrypt (work factor 12)
- Rate limiting on API endpoints
- Helmet.js for security headers
- Input validation and sanitization
- CORS protection
- SQL injection prevention (Prisma)

## Database Schema

Key models:
- Users (with role-based access)
- Clients and Client Contacts
- Projects and Project Members
- Files (documents and photos)
- Daily Logs
- Quotes

See `prisma/schema.prisma` for complete schema definition.

## Development Guidelines

- Follow TypeScript strict mode
- Use camelCase for variables and functions
- Use PascalCase for classes and types
- Use snake_case for database columns
- Always validate inputs
- Use try-catch for async operations
- Log errors with context
- Never expose stack traces to clients
- Write JSDoc comments for complex functions

## Testing

\`\`\`bash
npm test
\`\`\`

## Prisma Studio

To view and edit database data with a GUI:

\`\`\`bash
npm run prisma:studio
\`\`\`

This will open Prisma Studio at http://localhost:5555


# ✅ Environment Configuration Created

## .env File Created Successfully

Your `.env` file has been created with the following configuration:

### Database Configuration
```
DATABASE_URL=postgresql://postgres:password@localhost:5432/electrical_pm
```

**⚠️ IMPORTANT**: Update the connection string with your actual PostgreSQL credentials:
- Replace `postgres` with your PostgreSQL username
- Replace `password` with your PostgreSQL password
- Keep `electrical_pm` as the database name (or change if needed)

### JWT Secrets
Strong random secrets have been generated for:
- `JWT_SECRET` - Used for access tokens (30 min expiration)
- `REFRESH_TOKEN_SECRET` - Used for refresh tokens (7 day expiration)

**🔒 Security Note**: These secrets are randomly generated. For production, generate new ones!

### File Storage
```
STORAGE_PATH=./storage
MAX_FILE_SIZE=10485760 (10MB)
```

### Server Configuration
```
PORT=5000
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000
LOG_LEVEL=info
```

## Next Steps

### 1. Update Database Credentials

Edit `.env` and update the DATABASE_URL with your PostgreSQL credentials:

**Format:**
```
DATABASE_URL=postgresql://USERNAME:PASSWORD@HOST:PORT/DATABASE
```

**Example (local PostgreSQL):**
```
DATABASE_URL=postgresql://postgres:mypassword@localhost:5432/electrical_pm
```

**Example (with special characters in password):**
```
DATABASE_URL=postgresql://postgres:my%40pass%21word@localhost:5432/electrical_pm
```
*(URL encode special characters: @ = %40, ! = %21, etc.)*

### 2. Create Database

Connect to PostgreSQL and create the database:

```bash
# Using psql
psql -U postgres

# In psql, create the database
CREATE DATABASE electrical_pm;

# Verify
\l

# Exit
\q
```

**Or using pgAdmin:**
1. Right-click on "Databases"
2. Create → Database
3. Name: `electrical_pm`
4. Click "Save"

### 3. Generate Prisma Client

```bash
npm run prisma:generate
```

This will generate the Prisma Client based on your schema.

### 4. Run Database Migrations

```bash
npm run prisma:migrate
```

This will:
- Create all database tables
- Set up relationships
- Apply indexes
- Prompt you to name the migration (e.g., "initial_setup")

### 5. Seed Database with Sample Data

```bash
npm run prisma:seed
```

This will create:
- 3 sample users (admin, project manager, supervisor)
- 1 sample client (ABC Construction Company)
- 1 sample project (Downtown Office Building)

### 6. Start Development Server

```bash
npm run dev
```

Expected output:
```
[INFO] Server is running on port 5000
[INFO] Environment: development
[INFO] Database connected successfully
```

### 7. Test the Server

Open your browser or use curl:

**Health Check:**
```bash
curl http://localhost:5000/health
```

Expected response:
```json
{
  "success": true,
  "message": "Server is running",
  "timestamp": "2025-10-23T..."
}
```

## Sample Users (After Seeding)

| Email | Password | Role |
|-------|----------|------|
| admin@example.com | Admin@123 | SUPER_ADMIN |
| pm@example.com | Manager@123 | PROJECT_MANAGER |
| supervisor@example.com | Super@123 | FIELD_SUPERVISOR |

## Environment Variables Reference

| Variable | Description | Default |
|----------|-------------|---------|
| DATABASE_URL | PostgreSQL connection string | Required |
| JWT_SECRET | Secret for access tokens | Required |
| JWT_EXPIRES_IN | Access token expiration | 30m |
| REFRESH_TOKEN_SECRET | Secret for refresh tokens | Required |
| REFRESH_TOKEN_EXPIRES_IN | Refresh token expiration | 7d |
| STORAGE_PATH | Local file storage path | ./storage |
| MAX_FILE_SIZE | Max upload size in bytes | 10485760 (10MB) |
| PORT | Server port | 5000 |
| NODE_ENV | Environment mode | development |
| CORS_ORIGIN | Allowed CORS origin | http://localhost:3000 |
| LOG_LEVEL | Logging level | info |

## Troubleshooting

### "Connection refused" error
- PostgreSQL is not running
- Check with: `pg_isready` or check Windows Services

### "database does not exist" error
- Create the database: `CREATE DATABASE electrical_pm;`

### "password authentication failed"
- Check username and password in DATABASE_URL
- Verify with: `psql -U username -d electrical_pm`

### "Permission denied" error
- User doesn't have permissions on the database
- Grant permissions: `GRANT ALL PRIVILEGES ON DATABASE electrical_pm TO username;`

### Prisma Client errors
- Run: `npm run prisma:generate`
- Delete node_modules and reinstall if needed

## Security Best Practices

### For Development
✅ Current setup is fine

### For Production
⚠️ **MUST CHANGE:**
1. Generate new JWT secrets (use crypto.randomBytes or similar)
2. Use environment-specific database credentials
3. Enable SSL for database connection
4. Set NODE_ENV=production
5. Use secure CORS_ORIGIN (your domain)
6. Consider using a secrets manager (Google Secret Manager, AWS Secrets Manager)

**Generate secure secrets:**
```bash
# Using Node.js
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

## File Storage

The `STORAGE_PATH=./storage` directory structure will be:
```
storage/
├── documents/
│   └── [project_id]/
│       ├── plans/
│       ├── specs/
│       └── permits/
├── photos/
│   └── [project_id]/
│       └── [date]/
│           ├── originals/
│           └── thumbnails/
└── temp/
```

Directories are created automatically on first file upload.

## What's Next?

✅ .env file created  
⏳ Update DATABASE_URL with your credentials  
⏳ Create PostgreSQL database  
⏳ Run migrations  
⏳ Seed database  
⏳ Start server  

Once the server is running, you're ready to implement API endpoints!

---

**Need Help?**
- Backend docs: `backend/README.md`
- Project overview: `../README.md`
- Quick start: `../QUICK_START.md`


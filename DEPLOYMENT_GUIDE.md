# Deployment Guide - Electrical PM System

Complete guide for deploying the Electrical Construction Project Management System to Synology NAS with Docker.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Git Branching Strategy](#git-branching-strategy)
3. [Local Setup](#local-setup)
4. [Synology NAS Setup](#synology-nas-setup)
5. [Production Deployment](#production-deployment)
6. [Development Deployment](#development-deployment)
7. [Cloudflare Setup (Optional)](#cloudflare-setup-optional)
8. [Maintenance](#maintenance)
9. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### On Your Local Computer
- ✅ Git installed
- ✅ Node.js 18+ installed
- ✅ PostgreSQL installed (for local development)

### On Your Synology NAS
- ✅ Container Manager (Docker) installed
- ✅ SSH enabled
- ✅ At least 4GB RAM recommended
- ✅ 20GB+ free disk space

---

## Git Branching Strategy

We use a simple two-branch strategy:

- **`main`** → Production (stable, tested code)
- **`develop`** → Development (work in progress, testing)

### Workflow

1. Work on features locally
2. Test on local machine
3. Push to `develop` branch
4. Deploy to dev environment on NAS
5. Test thoroughly
6. Merge `develop` → `main`
7. Deploy to production

---

## Local Setup

### 1. Ensure Your Local Environment Works

```bash
# Backend
cd backend
npm install
npm run dev

# Frontend (in new terminal)
cd frontend
npm install
npm start
```

### 2. Commit All Changes

```bash
git add .
git commit -m "Add Docker configuration for deployment"
```

---

## Synology NAS Setup

### Step 1: Enable SSH

1. Open Synology DSM (web interface)
2. Go to **Control Panel** → **Terminal & SNMP**
3. Check **"Enable SSH service"**
4. Keep port as `22`
5. Click **Apply**

### Step 2: Install Container Manager

1. Open **Package Center**
2. Search for **"Container Manager"**
3. Click **Install**
4. Wait for installation to complete

### Step 3: Connect via SSH

From your local computer (PowerShell):

```powershell
ssh your_username@YOUR_NAS_IP
```

Replace:
- `your_username` with your Synology username
- `YOUR_NAS_IP` with your NAS IP (e.g., `192.168.1.100`)

### Step 4: Create Project Directory

```bash
# Create directory for Docker projects
sudo mkdir -p /volume1/docker/electrical-pm

# Change ownership to your user
sudo chown -R $(whoami):users /volume1/docker/electrical-pm

# Go to directory
cd /volume1/docker/electrical-pm
```

### Step 5: Clone Repository

```bash
# Clone your repository
git clone https://github.com/YOUR_USERNAME/electrical-pm.git .

# Verify files are present
ls -la
```

You should see:
- `backend/`
- `frontend/`
- `docker-compose.prod.yml`
- `docker-compose.dev.yml`
- `deploy-prod.sh`
- `deploy-dev.sh`

---

## Production Deployment

### Step 1: Create Environment File

```bash
# Copy example file
cp env.production.example .env.production

# Edit with nano
nano .env.production
```

**Update these values:**

```bash
# Strong password for database
DB_PASSWORD=YourVeryStrongPassword123!@#

# Generate random secrets (run these commands):
# node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
JWT_SECRET=paste_generated_64_char_hex_here
REFRESH_TOKEN_SECRET=paste_another_generated_64_char_hex_here

# Your NAS IP or domain
FRONTEND_URL=http://192.168.1.100:3001
BACKEND_URL=http://192.168.1.100:5001
```

**Save:** `Ctrl + X`, then `Y`, then `Enter`

### Step 2: Make Deploy Script Executable

```bash
chmod +x deploy-prod.sh
```

### Step 3: Run Deployment

```bash
./deploy-prod.sh
```

This will:
- Pull latest code from `main` branch
- Build Docker images
- Start containers
- Run database migrations

**Wait 5-10 minutes** for first deployment (building images).

### Step 4: Verify Deployment

```bash
# Check container status
docker ps

# You should see 3 containers running:
# - electrical_pm_prod_db
# - electrical_pm_prod_backend
# - electrical_pm_prod_frontend
```

### Step 5: Seed Database (First Time Only)

```bash
docker-compose -f docker-compose.prod.yml exec backend npx prisma db seed
```

This creates an initial admin user.

### Step 6: Access Your Application

Open browser and go to:
```
http://YOUR_NAS_IP:3001
```

Example: `http://192.168.1.100:3001`

**Default credentials (from seed):**
- Email: `admin@example.com`
- Password: `admin123` (change immediately!)

---

## Development Deployment

Same process as production, but using dev files:

### Step 1: Create Development Environment File

```bash
cp env.development.example .env.development
nano .env.development
```

Update the values (can use simpler passwords for dev).

### Step 2: Deploy Development Environment

```bash
chmod +x deploy-dev.sh
./deploy-dev.sh
```

### Step 3: Access Development Environment

```
http://YOUR_NAS_IP:3002
```

Example: `http://192.168.1.100:3002`

---

## Cloudflare Setup (Optional)

To access your application from anywhere on the internet securely.

### Benefits
- Access from anywhere (work, home, mobile)
- Automatic HTTPS
- No port forwarding needed
- DDoS protection
- Free tier available

### Step 1: Register Domain

If you don't have a domain:
1. Register at [Cloudflare Registrar](https://www.cloudflare.com/products/registrar/) or any registrar
2. Add domain to Cloudflare

### Step 2: Install Cloudflared on NAS

```bash
# Download cloudflared
wget https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64

# Move to system path
sudo mv cloudflared-linux-amd64 /usr/local/bin/cloudflared
sudo chmod +x /usr/local/bin/cloudflared

# Verify installation
cloudflared --version
```

### Step 3: Authenticate with Cloudflare

```bash
cloudflared tunnel login
```

This will open a browser window. Log in and authorize.

### Step 4: Create Tunnels

**Production Tunnel:**
```bash
cloudflared tunnel create electrical-pm-prod
```

**Development Tunnel:**
```bash
cloudflared tunnel create electrical-pm-dev
```

Save the tunnel IDs shown.

### Step 5: Configure Tunnels

Create config file:

```bash
mkdir -p ~/.cloudflared
nano ~/.cloudflared/config.yml
```

**Content:**
```yaml
tunnel: YOUR_PROD_TUNNEL_ID
credentials-file: /root/.cloudflared/YOUR_PROD_TUNNEL_ID.json

ingress:
  - hostname: electrical-pm.yourdomain.com
    service: http://localhost:3001
  - service: http_status:404
```

### Step 6: Create DNS Records

In Cloudflare dashboard:
1. Go to DNS settings
2. Add CNAME record:
   - Name: `electrical-pm`
   - Target: `YOUR_TUNNEL_ID.cfargotunnel.com`

### Step 7: Run Tunnel

```bash
cloudflared tunnel run electrical-pm-prod
```

Or install as service:
```bash
sudo cloudflared service install
sudo systemctl start cloudflared
sudo systemctl enable cloudflared
```

### Step 8: Update Environment Variables

Update `.env.production`:
```bash
FRONTEND_URL=https://electrical-pm.yourdomain.com
BACKEND_URL=https://electrical-pm.yourdomain.com
```

Redeploy:
```bash
./deploy-prod.sh
```

---

## Maintenance

### Updating Production

```bash
cd /volume1/docker/electrical-pm
./deploy-prod.sh
```

### Updating Development

```bash
cd /volume1/docker/electrical-pm
./deploy-dev.sh
```

### Viewing Logs

**Production:**
```bash
docker-compose -f docker-compose.prod.yml logs -f
```

**Development:**
```bash
docker-compose -f docker-compose.dev.yml logs -f
```

Press `Ctrl + C` to exit.

### Backup Database

**Production:**
```bash
docker-compose -f docker-compose.prod.yml exec postgres pg_dump -U postgres electrical_pm_prod > backup_$(date +%Y%m%d).sql
```

**Development:**
```bash
docker-compose -f docker-compose.dev.yml exec postgres pg_dump -U postgres electrical_pm_dev > backup_dev_$(date +%Y%m%d).sql
```

### Restore Database

```bash
cat backup_20241027.sql | docker-compose -f docker-compose.prod.yml exec -T postgres psql -U postgres electrical_pm_prod
```

---

## Troubleshooting

### Containers Won't Start

**Check logs:**
```bash
docker-compose -f docker-compose.prod.yml logs
```

**Common issues:**
- Port already in use
- Invalid environment variables
- Not enough RAM

### Can't Access Application

1. **Check if containers are running:**
   ```bash
   docker ps
   ```

2. **Check firewall on NAS:**
   - Control Panel → Security → Firewall
   - Allow ports 3001, 3002, 5001, 5002

3. **Test backend directly:**
   ```bash
   curl http://localhost:5001/health
   ```

### Database Connection Errors

1. **Check database is running:**
   ```bash
   docker ps | grep postgres
   ```

2. **Check database logs:**
   ```bash
   docker-compose -f docker-compose.prod.yml logs postgres
   ```

3. **Verify DATABASE_URL in environment:**
   ```bash
   cat .env.production
   ```

### Frontend Can't Connect to Backend

1. **Check CORS settings** in `.env.production`:
   ```bash
   FRONTEND_URL=http://YOUR_ACTUAL_IP:3001
   ```

2. **Rebuild containers:**
   ```bash
   docker-compose -f docker-compose.prod.yml down
   ./deploy-prod.sh
   ```

### Out of Disk Space

**Check disk usage:**
```bash
df -h
```

**Clean unused Docker images:**
```bash
docker system prune -a
```

**Remove old containers:**
```bash
docker container prune
```

### Performance Issues

1. **Check container resource usage:**
   ```bash
   docker stats
   ```

2. **Increase Docker memory limit** in Container Manager

3. **Check database size:**
   ```bash
   docker-compose -f docker-compose.prod.yml exec postgres psql -U postgres -c "SELECT pg_size_pretty(pg_database_size('electrical_pm_prod'));"
   ```

---

## Useful Commands

### Check Container Status
```bash
docker ps
docker-compose -f docker-compose.prod.yml ps
```

### Restart All Containers
```bash
docker-compose -f docker-compose.prod.yml restart
```

### Stop All Containers
```bash
docker-compose -f docker-compose.prod.yml down
```

### Access Container Shell
```bash
docker-compose -f docker-compose.prod.yml exec backend sh
docker-compose -f docker-compose.prod.yml exec postgres sh
```

### Run Prisma Commands
```bash
# Migrate database
docker-compose -f docker-compose.prod.yml exec backend npx prisma migrate deploy

# Open Prisma Studio
docker-compose -f docker-compose.prod.yml exec backend npx prisma studio

# Reset database (CAUTION!)
docker-compose -f docker-compose.prod.yml exec backend npx prisma migrate reset
```

---

## Security Best Practices

1. **Change default admin password** immediately after first login
2. **Use strong passwords** for database and JWT secrets
3. **Keep secrets secure** - never commit `.env.production` or `.env.development`
4. **Update regularly** - pull latest code and rebuild
5. **Use HTTPS** - set up Cloudflare Tunnel for internet access
6. **Backup regularly** - automate database backups
7. **Monitor logs** - check for suspicious activity
8. **Limit SSH access** - use key-based authentication
9. **Update NAS** - keep Synology DSM up to date
10. **Firewall** - only allow necessary ports

---

## Support

If you encounter issues:

1. Check logs first
2. Review this guide
3. Check GitHub issues
4. Create new issue with:
   - Error messages
   - Logs
   - Steps to reproduce

---

**Last Updated:** October 2025  
**Version:** 1.0


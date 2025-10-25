# PM2 Setup Guide for Production

## What is PM2?

PM2 is a production-grade process manager for Node.js applications that provides:
- ✅ Auto-restart on crash
- ✅ Memory monitoring
- ✅ Log management
- ✅ Cluster mode (run multiple instances)
- ✅ Zero-downtime reload
- ✅ Startup scripts (auto-start on server boot)

---

## Installation

### 1. Install PM2 globally:
```bash
npm install -g pm2
```

### 2. Verify installation:
```bash
pm2 --version
```

---

## Usage

### Start the Application:

**First time (after npm install):**
```bash
cd backend
npm run build  # Compile TypeScript
pm2 start ecosystem.config.js
```

**View status:**
```bash
pm2 status
```

**View logs (real-time):**
```bash
pm2 logs electrical-pm-api
```

**View last 100 lines:**
```bash
pm2 logs electrical-pm-api --lines 100
```

**Monitor CPU/Memory:**
```bash
pm2 monit
```

---

## Common Commands

| Command | Description |
|---------|-------------|
| `pm2 start ecosystem.config.js` | Start the app |
| `pm2 stop electrical-pm-api` | Stop the app |
| `pm2 restart electrical-pm-api` | Restart the app |
| `pm2 reload electrical-pm-api` | Zero-downtime reload |
| `pm2 delete electrical-pm-api` | Remove from PM2 |
| `pm2 logs` | View logs for all apps |
| `pm2 logs electrical-pm-api` | View logs for this app |
| `pm2 logs --err` | View only error logs |
| `pm2 flush` | Clear all logs |
| `pm2 monit` | Real-time monitoring |
| `pm2 list` | List all apps |
| `pm2 describe electrical-pm-api` | Detailed app info |

---

## Production Setup

### 1. Start with production environment:
```bash
pm2 start ecosystem.config.js --env production
```

### 2. Save PM2 process list:
```bash
pm2 save
```

### 3. Setup auto-start on server boot:
```bash
# Generate startup script (Windows)
pm2 startup

# Follow the instructions shown
# It will give you a command to run with admin privileges

# After running that command:
pm2 save
```

### 4. Update app without downtime:
```bash
cd backend
git pull
npm install
npm run build
pm2 reload electrical-pm-api
```

---

## Cluster Mode (Multiple Instances)

For better performance, run multiple instances:

**Edit `ecosystem.config.js`:**
```javascript
{
  instances: 'max', // or a number like 4
  exec_mode: 'cluster'
}
```

**Start in cluster mode:**
```bash
pm2 start ecosystem.config.js --env production
```

This will start one instance per CPU core.

---

## Monitoring & Alerts

### Built-in Monitoring:
```bash
pm2 monit  # Real-time monitoring
```

### Web Dashboard (PM2 Plus):
1. Create account at https://pm2.io
2. Link your server:
```bash
pm2 link <secret_key> <public_key>
```

---

## Troubleshooting

### App keeps restarting:
```bash
pm2 logs electrical-pm-api --lines 200  # Check error logs
pm2 describe electrical-pm-api         # Check restart count
```

### Clear logs:
```bash
pm2 flush  # Clear all logs
```

### Reset restart count:
```bash
pm2 reset electrical-pm-api
```

### App not starting:
```bash
# Check if port 5000 is in use
netstat -ano | findstr :5000

# Kill process if needed (replace PID)
taskkill /PID <process_id> /F

# Try starting again
pm2 start ecosystem.config.js
```

---

## Development vs Production

| Feature | Development (nodemon) | Production (PM2) |
|---------|----------------------|------------------|
| **Auto-restart on file change** | ✅ Yes | ❌ No |
| **Auto-restart on crash** | ✅ Yes | ✅ Yes |
| **Memory monitoring** | ❌ No | ✅ Yes |
| **Cluster mode** | ❌ No | ✅ Yes |
| **Log management** | ❌ No | ✅ Yes |
| **Process management** | ❌ No | ✅ Yes |
| **Startup on boot** | ❌ No | ✅ Yes |

**Recommendation:**
- **Development:** Use `npm run dev` (nodemon)
- **Production:** Use PM2

---

## Quick Reference

### Start/Stop/Restart:
```bash
pm2 start ecosystem.config.js    # Start
pm2 stop electrical-pm-api        # Stop
pm2 restart electrical-pm-api     # Restart
pm2 reload electrical-pm-api      # Zero-downtime reload
pm2 delete electrical-pm-api      # Remove
```

### Logs:
```bash
pm2 logs                          # All apps
pm2 logs electrical-pm-api        # This app
pm2 logs --lines 100              # Last 100 lines
pm2 flush                         # Clear logs
```

### Monitoring:
```bash
pm2 monit                         # Real-time monitor
pm2 status                        # Status of all apps
pm2 describe electrical-pm-api    # Detailed info
```

### Process Management:
```bash
pm2 save                          # Save process list
pm2 resurrect                     # Restore saved processes
pm2 startup                       # Generate startup script
pm2 unstartup                     # Remove startup script
```

---

## Environment Variables

PM2 loads `.env` file automatically if it exists in the project root.

**Or specify in ecosystem.config.js:**
```javascript
env: {
  NODE_ENV: 'development',
  PORT: 5000,
  DATABASE_URL: '...'
}
```

---

## Support

- PM2 Documentation: https://pm2.keymetrics.io/docs/
- PM2 GitHub: https://github.com/Unitech/pm2
- PM2 Plus (Monitoring): https://pm2.io

---

**You're now ready to run a production-grade Node.js application!** 🚀


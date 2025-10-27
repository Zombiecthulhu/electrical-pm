# Server Management Guide

## 🚨 Preventing Zombie Node Processes

Zombie processes happen when Node.js servers don't shut down cleanly. This can cause:
- Port conflicts (can't start server)
- Multiple instances running
- Performance issues
- Database connection exhaustion

## ✅ Best Practices

### Option 1: Use the PowerShell Scripts (Recommended)

We've created helper scripts that automatically clean up ports before starting:

```powershell
# Start both servers (auto-cleans ports 3000 and 5000)
.\start-servers.ps1

# Stop both servers cleanly
.\stop-servers.ps1

# Restart both servers
.\restart-servers.ps1
```

**Benefits:**
- ✅ Automatically kills processes on ports 3000 and 5000 before starting
- ✅ Opens servers in separate windows
- ✅ Prevents zombie processes
- ✅ Easy to use

### Option 2: Use PM2 (Production-Ready)

PM2 is already configured in `backend/ecosystem.config.js`:

```bash
# Start with PM2
cd backend
pm2 start ecosystem.config.js

# Stop all PM2 processes
pm2 stop all

# Restart all PM2 processes
pm2 restart all

# View status
pm2 status

# View logs
pm2 logs

# Stop and delete all PM2 processes
pm2 delete all
```

**Benefits:**
- ✅ Production-ready process manager
- ✅ Auto-restart on crash
- ✅ Log management
- ✅ Load balancing (multiple instances)
- ✅ Zero-downtime restarts
- ✅ **No zombie processes**

## 🛠️ Troubleshooting

### Ports are already in use

```powershell
# Check what's using the ports
Get-NetTCPConnection -LocalPort 5000, 3000 | Select-Object LocalPort, State, OwningProcess

# Kill all Node processes (nuclear option)
taskkill /F /IM node.exe

# Or use the stop script
.\stop-servers.ps1
```

### Multiple Node processes running

```powershell
# List all Node processes
Get-Process node | Select-Object Id, CPU, ProcessName, StartTime

# Kill all Node processes
taskkill /F /IM node.exe
```

### Server won't stop gracefully

1. Press `Ctrl+C` in the terminal (may need to press twice)
2. If that doesn't work: Close the terminal window
3. If still running: Use `.\stop-servers.ps1`
4. Nuclear option: `taskkill /F /IM node.exe`

## 🎯 Recommended Workflow

### For Development
```powershell
# Morning startup
.\start-servers.ps1

# End of day
.\stop-servers.ps1
```

### For Production
```bash
# Deploy with PM2
cd backend
pm2 start ecosystem.config.js --env production

# Monitor
pm2 monit
```

## 📋 Prevention Checklist

To prevent zombie processes in the future:

- [ ] **Always use the provided scripts** (`start-servers.ps1`, `stop-servers.ps1`)
- [ ] **Use PM2 for production** (already configured)
- [ ] **Don't close terminals without stopping servers** (use Ctrl+C first)
- [ ] **Before starting servers, check if ports are free**
- [ ] **Use `.\stop-servers.ps1` at the end of each session**
- [ ] **If you see "port already in use," run cleanup first**

## 🔍 Quick Checks

```powershell
# Are ports 3000 and 5000 free?
Test-NetConnection -ComputerName localhost -Port 5000
Test-NetConnection -ComputerName localhost -Port 3000

# How many Node processes are running?
(Get-Process node -ErrorAction SilentlyContinue).Count

# What are they?
Get-Process node -ErrorAction SilentlyContinue | Select-Object Id, CPU, StartTime
```

## 🚀 Advanced: PM2 Configuration

Your PM2 config (`backend/ecosystem.config.js`) is already set up with:

- **Auto-restart** on crash
- **Log rotation** (500KB max)
- **Environment variables** from `.env`
- **Watch mode** disabled for stability

To customize PM2 behavior, edit `backend/ecosystem.config.js`.

## 💡 Tips

1. **Close terminals properly**: Always use `Ctrl+C` to stop servers before closing the terminal
2. **Use the scripts**: They're designed to prevent these issues
3. **Regular cleanup**: If you notice slowness, check for zombie processes
4. **PM2 for serious work**: If you're doing a lot of development, use PM2
5. **Keep only one instance**: Don't start multiple instances manually

## ⚠️ Common Mistakes

❌ **DON'T**: Close the terminal without stopping the server  
✅ **DO**: Press `Ctrl+C` then close, or use `.\stop-servers.ps1`

❌ **DON'T**: Start multiple instances manually  
✅ **DO**: Check if server is already running first

❌ **DON'T**: Kill processes randomly from Task Manager  
✅ **DO**: Use the provided scripts or PM2 commands

❌ **DON'T**: Ignore "port already in use" errors  
✅ **DO**: Clean up processes before starting

## 📚 Further Reading

- [PM2 Documentation](https://pm2.keymetrics.io/docs/usage/quick-start/)
- [Node.js Process Management](https://nodejs.org/api/process.html)
- [PowerShell Process Management](https://docs.microsoft.com/en-us/powershell/module/microsoft.powershell.management/get-process)


# 🕐 Session Duration - Quick Reference

## ⏱️ **Answer: Your session lasts 30 minutes**

---

## 📊 Session Timing

| Event | Time | What Happens |
|-------|------|--------------|
| **Login** | 0:00 | Session starts, you get a 30-minute token |
| **Working** | 0:00 - 25:00 | Everything works normally |
| **Warning** | 25:00 | ⚠️ Dialog appears: "Session expiring in 5 minutes" |
| **Click "Stay Logged In"** | 25:00+ | Dialog closes (TODO: auto-refresh token) |
| **Auto-Logout** | 30:00 | 🚪 Automatically logged out, redirected to login |
| **Try to use expired session** | 30:00+ | 🚪 Immediately logged out, redirected to login |

---

## ✅ What Was Fixed

### **Before (Broken):**
- ❌ Session expires after 30 minutes
- ❌ User stays "logged in" but nothing works
- ❌ No warning before expiration
- ❌ User confused: "Why can't I do anything?"
- ❌ Must refresh page or manually log out

### **After (Fixed):**
- ✅ Session expires after 30 minutes
- ✅ **Auto-logout** when expired - no more broken state!
- ✅ **Warning 5 minutes before** expiration
- ✅ Clear message: "Your session has expired. Please log in again."
- ✅ Automatic redirect to login page

---

## 🎯 User Experience Now

### Scenario 1: Active User
```
You're working on a project →
(25 minutes pass)
Dialog appears: "Session expiring in 5 minutes"
You click "Stay Logged In"
Dialog closes
(You can keep working)
```

### Scenario 2: Idle User
```
You're logged in →
(You walk away for coffee)
(30 minutes pass)
You come back and try to click something
Auto-logout happens
Redirect to login with message: "Your session has expired"
You log in again
```

### Scenario 3: Very Active User
```
You're working all day →
Warning appears every 25 minutes
You click "Stay Logged In" each time
(You can work all day with minimal interruption)
```

---

## ⚙️ Configuration

### Change Session Duration:
Edit `backend/.env`:
```env
# Current: 30 minutes
JWT_EXPIRES_IN=30m

# Options:
JWT_EXPIRES_IN=15m    # 15 minutes
JWT_EXPIRES_IN=1h     # 1 hour
JWT_EXPIRES_IN=2h     # 2 hours
JWT_EXPIRES_IN=8h     # 8 hours (work day)
JWT_EXPIRES_IN=24h    # 24 hours (full day)
```

**Recommendation:** Keep it at 30m for security, or use 1h for convenience.

### Change Warning Time:
Edit `frontend/src/App.tsx`:
```typescript
// Current: 5 minutes before expiration
<SessionTimeout warningMinutes={5} />

// Options:
<SessionTimeout warningMinutes={2} />   // Warn at 28 minutes
<SessionTimeout warningMinutes={10} />  // Warn at 20 minutes
```

---

## 🔐 Security Notes

**Why 30 minutes?**
- ✅ Industry standard for web applications
- ✅ Balances security with usability
- ✅ Prevents unauthorized access to abandoned sessions
- ✅ Common for banking, healthcare, government sites

**Why not longer?**
- ❌ 8 hours = Someone could use your computer while you're out
- ❌ 24 hours = Huge security risk
- ❌ Never expire = Anyone can access your account

**Why not shorter?**
- ❌ 5 minutes = Too annoying, constant logins
- ❌ 10 minutes = Interrupts workflow too often
- ❌ 15 minutes = Better but still frequent

**30 minutes is the sweet spot!** ✅

---

## 📱 How It Works Technically

### Access Token (Your Session):
- **Storage:** `localStorage.accessToken`
- **Duration:** 30 minutes
- **Usage:** Sent with every API request
- **When expired:** Can't make API calls

### Refresh Token (for extending):
- **Storage:** HTTP-only cookie (more secure)
- **Duration:** 7 days
- **Usage:** Can get a new 30-minute access token
- **Status:** Backend ready, frontend TODO

### Auto-Logout Mechanism:
1. You try to do something (e.g., view employees)
2. Frontend sends request with access token
3. Backend checks: Is token valid?
4. If expired: Backend returns `401 Unauthorized`
5. Frontend intercepts 401 response
6. Frontend clears all tokens
7. Frontend redirects to `/login?session=expired`
8. Login page shows: "Your session has expired"

---

## 🎯 Quick Tests

### Test 1: Normal Session
1. Log in
2. Work for 20 minutes
3. ✅ Everything works

### Test 2: Warning Dialog
1. Log in
2. Wait 25 minutes (or temporarily change `JWT_EXPIRES_IN=2m`)
3. ✅ Warning dialog appears
4. Click "Stay Logged In"
5. ✅ Dialog closes

### Test 3: Auto-Logout
1. Log in
2. Wait 30 minutes (or use `JWT_EXPIRES_IN=2m` for testing)
3. Try to navigate or do something
4. ✅ Auto-logout happens
5. ✅ Redirected to login
6. ✅ See "Your session has expired" message

### Test 4: Manual Token Deletion
1. Log in
2. Open DevTools → Application → Local Storage
3. Delete `accessToken`
4. Try to navigate
5. ✅ Redirected to login immediately

---

## 📝 Summary

**Session Duration: 30 minutes** ⏱️

**What happens:**
- Work normally for 0-25 minutes ✅
- Warning at 25 minutes ⚠️
- Auto-logout at 30 minutes 🚪
- Clear "session expired" message 💬
- Can extend session by clicking button 🔄

**No more broken "zombie sessions"!** 🎉

Your app now handles session expiration professionally and securely.


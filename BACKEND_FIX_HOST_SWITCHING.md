# Backend Fix Required: Host-to-Host Switching While Impersonating

## 🐛 Issue

**Problem:** Cannot switch from Host A to Host B while already impersonating.

**What's Happening:**
1. Superadmin impersonates Host A ✅ (Works)
2. Token now has `role: "host"` and `originalRole: "superadmin"`
3. Try to impersonate Host B ❌ (Fails)
4. Backend rejects because it only checks `role === "superadmin"`
5. But current `role` is "host", not "superadmin"!

**Root Cause:**  
The impersonation endpoint's permission check only looks at the current `role`, not the `originalRole`.

---

## 🔧 Backend Fix Required

### Update Impersonation Controller

**File:** `controllers/impersonationController.js` (or similar)

**Current Code (Problematic):**
```javascript
exports.impersonateHost = async (req, res) => {
  try {
    // ❌ This only checks current role
    if (req.user.role !== 'superadmin') {
      return res.status(403).json({ 
        error: 'Only superadmins can impersonate users' 
      });
    }
    
    // ... rest of impersonation logic
  } catch (error) {
    // ...
  }
};
```

**Fixed Code:**
```javascript
exports.impersonateHost = async (req, res) => {
  try {
    // ✅ Check BOTH current role AND original role
    const isSuperAdmin = req.user.role === 'superadmin' || 
                         req.user.originalRole === 'superadmin';
    
    if (!isSuperAdmin) {
      return res.status(403).json({ 
        error: 'Only superadmins can impersonate users' 
      });
    }
    
    const { hostId } = req.params;
    
    // Fetch the target host user
    const targetHost = await User.findById(hostId);
    if (!targetHost) {
      return res.status(404).json({ error: 'Host not found' });
    }
    
    if (!targetHost.host && !targetHost.isHost) {
      return res.status(400).json({ error: 'User is not a host' });
    }
    
    // Get the ACTUAL superadmin ID (for token generation)
    // If already impersonating, use the original superadmin
    // Otherwise, use current user
    const actualSuperadminId = req.user.impersonatedBy || req.user.userId;
    const actualSuperadmin = req.user.impersonatedBy 
      ? await User.findById(req.user.impersonatedBy)
      : req.user;
    
    // Generate new impersonation token
    const impersonationToken = jwt.sign(
      {
        userId: targetHost._id,
        role: targetHost.role,
        email: targetHost.email,
        name: targetHost.name,
        host: targetHost.host,
        // IMPORTANT: Preserve the original superadmin info
        impersonatedBy: actualSuperadminId,
        originalRole: 'superadmin',
        originalEmail: actualSuperadmin.email || req.user.originalEmail,
        isImpersonating: true,
      },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );
    
    res.json({
      success: true,
      token: impersonationToken,
      user: {
        id: targetHost._id,
        name: targetHost.name,
        email: targetHost.email,
        role: targetHost.role,
        host: targetHost.host,
        isImpersonating: true,
        impersonatedBy: actualSuperadminId,
        originalRole: 'superadmin',
        originalEmail: actualSuperadmin.email || req.user.originalEmail,
      }
    });
    
  } catch (error) {
    console.error('Impersonation error:', error);
    res.status(500).json({ 
      error: 'Failed to impersonate user',
      details: error.message 
    });
  }
};
```

---

## 🔑 Key Changes Explained

### 1. **Permission Check**
```javascript
// OLD (only checks current role)
if (req.user.role !== 'superadmin') { ... }

// NEW (checks both current and original role)
const isSuperAdmin = req.user.role === 'superadmin' || 
                     req.user.originalRole === 'superadmin';
if (!isSuperAdmin) { ... }
```

### 2. **Preserve Original Superadmin**
```javascript
// Get the ACTUAL superadmin ID
// If already impersonating, use the original superadmin
// Otherwise, use current user
const actualSuperadminId = req.user.impersonatedBy || req.user.userId;
```

**Why this matters:**
- First impersonation: `superadmin_123` → `host_456`
  - `impersonatedBy` = `superadmin_123`
- Switch to another host: `host_456` → `host_789`
  - Must keep `impersonatedBy` = `superadmin_123` (not `host_456`!)

### 3. **Maintain Original Email**
```javascript
originalEmail: actualSuperadmin.email || req.user.originalEmail
```

This ensures the original superadmin email is preserved across multiple switches.

---

## 🧪 Testing the Fix

### Test Scenario 1: Direct Impersonation (Should Already Work)
```
1. Login as superadmin_123
2. Impersonate host_456
3. Token should have:
   - userId: host_456
   - role: host
   - impersonatedBy: superadmin_123
   - originalRole: superadmin
```

### Test Scenario 2: Switch Hosts (The Fix)
```
1. Already impersonating host_456
2. Impersonate host_789
3. Token should have:
   - userId: host_789  ← Changed
   - role: host
   - impersonatedBy: superadmin_123  ← PRESERVED (not host_456!)
   - originalRole: superadmin  ← PRESERVED
```

### Test Scenario 3: Multiple Switches
```
1. superadmin_123 → host_456
2. host_456 → host_789
3. host_789 → host_101
4. All tokens should have impersonatedBy: superadmin_123
```

---

## 🔒 Security Considerations

### 1. **Validate Target User is a Host**
```javascript
if (!targetHost.host && !targetHost.isHost) {
  return res.status(400).json({ error: 'User is not a host' });
}
```

### 2. **Verify Original Superadmin Exists**
```javascript
if (req.user.impersonatedBy) {
  const originalSuperadmin = await User.findById(req.user.impersonatedBy);
  if (!originalSuperadmin || originalSuperadmin.role !== 'superadmin') {
    return res.status(403).json({ 
      error: 'Invalid impersonation token' 
    });
  }
}
```

### 3. **Audit Logging**
```javascript
await AuditLog.create({
  action: 'HOST_SWITCH',
  performedBy: actualSuperadminId,  // The real superadmin
  fromUser: req.user.userId,         // Previous host (or superadmin)
  toUser: targetHost._id,            // New host
  timestamp: new Date(),
  ipAddress: req.ip,
});
```

---

## 📋 Complete Implementation

Here's the complete updated function:

```javascript
/**
 * Impersonate a host account
 * Allows superadmins to switch between hosts seamlessly
 */
exports.impersonateHost = async (req, res) => {
  try {
    // Check if user has superadmin privileges (current OR original role)
    const isSuperAdmin = req.user.role === 'superadmin' || 
                         req.user.originalRole === 'superadmin';
    
    if (!isSuperAdmin) {
      return res.status(403).json({ 
        error: 'Only superadmins can impersonate users' 
      });
    }
    
    const { hostId } = req.params;
    
    // Validate target host
    const targetHost = await User.findById(hostId);
    if (!targetHost) {
      return res.status(404).json({ error: 'Host not found' });
    }
    
    if (!targetHost.host && !targetHost.isHost) {
      return res.status(400).json({ 
        error: 'Target user is not a host' 
      });
    }
    
    // Get the actual superadmin ID (preserve original when switching)
    const actualSuperadminId = req.user.impersonatedBy || req.user.userId;
    
    // Get original superadmin info
    let actualSuperadmin;
    if (req.user.impersonatedBy) {
      // Already impersonating, fetch original superadmin
      actualSuperadmin = await User.findById(req.user.impersonatedBy);
      if (!actualSuperadmin || actualSuperadmin.role !== 'superadmin') {
        return res.status(403).json({ 
          error: 'Invalid impersonation token' 
        });
      }
    } else {
      // First time impersonating, use current user
      actualSuperadmin = {
        _id: req.user.userId,
        email: req.user.email,
        name: req.user.name,
      };
    }
    
    // Generate new impersonation token
    const impersonationToken = jwt.sign(
      {
        userId: targetHost._id.toString(),
        role: targetHost.role,
        email: targetHost.email,
        name: targetHost.name,
        host: targetHost.host || targetHost.isHost,
        // Preserve original superadmin identity
        impersonatedBy: actualSuperadminId,
        originalRole: 'superadmin',
        originalEmail: actualSuperadmin.email,
        isImpersonating: true,
      },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );
    
    // Audit log
    await AuditLog.create({
      action: req.user.isImpersonating ? 'HOST_SWITCH' : 'IMPERSONATE_START',
      performedBy: actualSuperadminId,
      fromUser: req.user.userId,
      toUser: targetHost._id,
      timestamp: new Date(),
      ipAddress: req.ip,
    });
    
    // Return response
    res.json({
      success: true,
      token: impersonationToken,
      user: {
        id: targetHost._id,
        name: targetHost.name,
        email: targetHost.email,
        role: targetHost.role,
        host: targetHost.host || targetHost.isHost,
        isImpersonating: true,
        impersonatedBy: actualSuperadminId,
        originalRole: 'superadmin',
        originalEmail: actualSuperadmin.email,
      },
      message: req.user.isImpersonating 
        ? `Switched to ${targetHost.name}` 
        : `Now viewing as ${targetHost.name}`
    });
    
  } catch (error) {
    console.error('Impersonation error:', error);
    res.status(500).json({ 
      error: 'Failed to impersonate user',
      details: error.message 
    });
  }
};
```

---

## ✅ Verification Checklist

After implementing the fix, verify:

- [ ] Can impersonate Host A from superadmin dashboard
- [ ] Can switch from Host A to Host B without stopping impersonation
- [ ] Token preserves `impersonatedBy` as original superadmin ID
- [ ] Can switch between multiple hosts (A → B → C → D)
- [ ] Original superadmin email is preserved
- [ ] Audit logs show correct superadmin ID for all switches
- [ ] Stop impersonation works correctly from any host
- [ ] No security issues (can't impersonate as non-superadmin)

---

## 🐛 Common Issues After Fix

### Issue: "Invalid impersonation token"
**Cause:** Original superadmin ID doesn't exist or isn't superadmin anymore.  
**Fix:** Add validation to check original superadmin exists.

### Issue: Switches work but audit logs show wrong user
**Cause:** Using `req.user.userId` instead of `actualSuperadminId`.  
**Fix:** Always use `actualSuperadminId` for audit logs.

### Issue: Token keeps growing in size
**Cause:** Adding nested impersonation data on each switch.  
**Fix:** Only include flat fields, don't nest previous token data.

---

## 📊 Expected Token Evolution

### Initial Login (Superadmin)
```json
{
  "userId": "superadmin_123",
  "role": "superadmin",
  "email": "admin@example.com"
}
```

### First Impersonation (superadmin → host_456)
```json
{
  "userId": "host_456",
  "role": "host",
  "email": "host456@example.com",
  "impersonatedBy": "superadmin_123",
  "originalRole": "superadmin",
  "originalEmail": "admin@example.com",
  "isImpersonating": true
}
```

### Second Switch (host_456 → host_789)
```json
{
  "userId": "host_789",          ← Changed
  "role": "host",
  "email": "host789@example.com", ← Changed
  "impersonatedBy": "superadmin_123",  ← PRESERVED
  "originalRole": "superadmin",         ← PRESERVED
  "originalEmail": "admin@example.com", ← PRESERVED
  "isImpersonating": true
}
```

**Key Point:** `impersonatedBy` and `originalEmail` NEVER change during switches!

---

## 🚀 Deployment Steps

1. Update `impersonationController.js` with the fixed code
2. Test locally with multiple host switches
3. Check audit logs are correct
4. Deploy to staging
5. Test end-to-end in staging
6. Deploy to production
7. Monitor for any issues

---

## 📞 Need Help?

If the issue persists after this fix:
1. Check server logs for error messages
2. Verify the token payload (decode with jwt.io)
3. Check if `originalRole` is being passed correctly
4. Verify middleware is checking both roles
5. Share the error message with the dev team

---

**Expected Outcome After Fix:**  
✅ Seamless switching between hosts while impersonating  
✅ Original superadmin identity preserved  
✅ Correct audit logging  
✅ No security vulnerabilities  

---

**Version:** 1.1  
**Last Updated:** January 2, 2025  
**Status:** 🔧 Backend Fix Required


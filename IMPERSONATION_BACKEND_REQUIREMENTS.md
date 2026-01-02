# Backend Requirements: Impersonation System

## Problem Statement

When a superadmin impersonates a host, they currently cannot access superadmin-only endpoints (like `/superadmin/hosts`) because the impersonation token represents the host user, not the superadmin.

**Current Issue:**
- Superadmin impersonates Host A
- Superadmin wants to switch to Host B
- Frontend tries to fetch hosts list from `/superadmin/hosts`
- Backend denies access because current token has `role: "host"`
- User must stop impersonation, switch hosts, then impersonate again

**Desired Behavior:**
- Superadmin should be able to switch between hosts seamlessly while impersonating
- Original superadmin permissions should be retained during impersonation

---

## Solution: Enhanced JWT Token Structure

### Current Token Structure (Before Impersonation)
```json
{
  "userId": "superadmin_123",
  "role": "superadmin",
  "email": "admin@example.com",
  "exp": 1234567890
}
```

### Proposed Token Structure (During Impersonation)
```json
{
  "userId": "host_456",
  "role": "host",
  "email": "host@example.com",
  "impersonatedBy": "superadmin_123",
  "originalRole": "superadmin",
  "originalEmail": "admin@example.com",
  "isImpersonating": true,
  "exp": 1234567890
}
```

---

## Backend Implementation

### 1. Update Impersonation Endpoint

**Endpoint:** `POST /api/superadmin/impersonate/:hostId`

```javascript
// When creating impersonation token, include original user info
const impersonationToken = jwt.sign(
  {
    userId: hostUser._id,
    role: hostUser.role,
    email: hostUser.email,
    name: hostUser.name,
    // Original superadmin information
    impersonatedBy: superadminUser._id,
    originalRole: superadminUser.role,
    originalEmail: superadminUser.email,
    isImpersonating: true,
  },
  JWT_SECRET,
  { expiresIn: '8h' }
);
```

### 2. Create Permission Checking Middleware

```javascript
// middleware/checkPermission.js

/**
 * Check if user has specific permission, considering impersonation
 * @param {string} requiredRole - The role required for access
 */
function checkPermission(requiredRole) {
  return (req, res, next) => {
    const user = req.user; // Decoded JWT token
    
    // Check current role
    const hasCurrentRole = user.role === requiredRole;
    
    // Check original role (during impersonation)
    const hasOriginalRole = user.isImpersonating && 
                           user.originalRole === requiredRole;
    
    if (hasCurrentRole || hasOriginalRole) {
      next();
    } else {
      res.status(403).json({ 
        error: 'Forbidden: Insufficient permissions' 
      });
    }
  };
}

// Usage example:
router.get('/superadmin/hosts', 
  authenticateToken, 
  checkPermission('superadmin'), 
  getAllHosts
);
```

### 3. Alternative: Helper Function Approach

```javascript
// utils/permissions.js

/**
 * Check if user is superadmin (including impersonating superadmins)
 */
function isSuperAdmin(user) {
  // Direct superadmin
  if (user.role === 'superadmin') {
    return true;
  }
  
  // Impersonating superadmin
  if (user.isImpersonating && user.originalRole === 'superadmin') {
    return true;
  }
  
  return false;
}

/**
 * Get the actual user ID to use for audit logs
 */
function getActualUserId(user) {
  return user.isImpersonating ? user.impersonatedBy : user.userId;
}

// Usage in routes:
router.get('/superadmin/hosts', authenticateToken, (req, res) => {
  if (!isSuperAdmin(req.user)) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  
  // Log action with actual superadmin ID
  auditLog.create({
    action: 'VIEW_HOSTS_LIST',
    userId: getActualUserId(req.user),
    impersonatedUser: req.user.isImpersonating ? req.user.userId : null,
  });
  
  // Return hosts
  // ...
});
```

---

## Endpoints That Need Updates

All superadmin-only endpoints should allow access when `originalRole === 'superadmin'`:

### Critical Endpoints
1. ✅ **`GET /api/superadmin/hosts`** - Fetch hosts list for switching
2. ✅ **`POST /api/superadmin/impersonate/:hostId`** - Switch to another host
3. ✅ **`POST /api/superadmin/stop-impersonation`** - Return to superadmin view

### Other Superadmin Endpoints (Optional but Recommended)
4. `GET /api/superadmin/statistics` - Dashboard stats
5. `GET /api/superadmin/hosts/:id` - Host details
6. `GET /api/superadmin/hosts/:id/users` - Host's team members
7. `GET /api/superadmin/hosts/:id/properties` - Host's properties
8. Any other `/api/superadmin/*` routes

---

## Security Considerations

### 1. Audit Logging
Always log the **actual superadmin** who performed the action, not the impersonated user:

```javascript
const auditEntry = {
  action: 'UPDATE_BOOKING',
  performedBy: req.user.impersonatedBy || req.user.userId,
  asUser: req.user.isImpersonating ? req.user.userId : null,
  timestamp: new Date(),
  details: { /* ... */ }
};
```

### 2. Token Expiration
Impersonation tokens should have shorter expiration times:
```javascript
// Regular token: 24 hours
// Impersonation token: 8 hours (suggested)
```

### 3. Validate Impersonation Permission
Always verify the original user is actually a superadmin:

```javascript
if (req.body.hostId) {
  // Verify requester is superadmin
  if (req.user.role !== 'superadmin') {
    return res.status(403).json({ error: 'Only superadmins can impersonate' });
  }
  
  // Verify target user is a host
  const targetUser = await User.findById(req.body.hostId);
  if (!targetUser || !targetUser.host) {
    return res.status(400).json({ error: 'Invalid host ID' });
  }
  
  // Create impersonation token
  // ...
}
```

### 4. Restrict Sensitive Operations
Some operations should be blocked during impersonation:

```javascript
// Block sensitive operations while impersonating
const BLOCKED_DURING_IMPERSONATION = [
  'DELETE_HOST_ACCOUNT',
  'TRANSFER_OWNERSHIP',
  'UPDATE_BILLING',
  'CHANGE_PASSWORD',
];

if (req.user.isImpersonating && BLOCKED_DURING_IMPERSONATION.includes(action)) {
  return res.status(403).json({ 
    error: 'This action cannot be performed while impersonating. Please stop impersonation first.' 
  });
}
```

---

## Testing Checklist

### Backend Tests
- [ ] Superadmin can impersonate a host
- [ ] While impersonating, can access superadmin endpoints
- [ ] While impersonating, can fetch hosts list
- [ ] While impersonating, can switch to another host
- [ ] While impersonating, can stop impersonation
- [ ] Non-superadmins cannot access superadmin endpoints (even with manipulated token)
- [ ] Impersonation token expires correctly
- [ ] Audit logs show correct superadmin ID

### Frontend Tests (Once Backend is Updated)
- [ ] Superadmin can see "View as Host" button
- [ ] Can switch to Host A
- [ ] While viewing as Host A, can see hosts list
- [ ] Can switch to Host B without stopping impersonation
- [ ] Can return to superadmin view
- [ ] Host switcher is not visible to regular hosts

---

## Example API Responses

### Impersonation Success Response
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "host_456",
    "name": "Host User",
    "email": "host@example.com",
    "role": "host",
    "impersonatedBy": "superadmin_123",
    "originalRole": "superadmin",
    "isImpersonating": true
  }
}
```

### Hosts List Response (While Impersonating)
```json
{
  "hosts": [
    {
      "id": "host_456",
      "name": "Current Host",
      "email": "host@example.com",
      "properties": ["prop1", "prop2"]
    },
    {
      "id": "host_789",
      "name": "Another Host",
      "email": "host2@example.com",
      "properties": ["prop3"]
    }
  ]
}
```

---

## Migration Plan

### Phase 1: Update Token Structure
1. Update impersonation endpoint to include original user info in token
2. Deploy backend changes
3. No frontend changes needed yet (backward compatible)

### Phase 2: Update Permission Checks
1. Create `checkPermission()` middleware
2. Update all superadmin routes to use new middleware
3. Test thoroughly with impersonation scenarios
4. Deploy backend changes

### Phase 3: Update Frontend
1. Update Topbar to show host switcher during impersonation
2. Update user state to recognize `isImpersonating` flag
3. Deploy frontend changes

### Phase 4: Testing & Rollout
1. Test end-to-end impersonation flow
2. Monitor audit logs
3. Gather feedback from superadmins
4. Address any edge cases

---

## Alternative Solution: Dual Token System

If modifying the token structure is complex, you can implement a dual-token system:

### Frontend Stores Two Tokens
```javascript
localStorage.setItem('luxeboard.authToken', impersonationToken);
localStorage.setItem('luxeboard.originalToken', superadminToken);
```

### Backend Accepts Two Tokens
```javascript
// Frontend sends both tokens
headers: {
  'Authorization': `Bearer ${impersonationToken}`,
  'X-Original-Authorization': `Bearer ${superadminToken}`
}

// Backend validates both
const mainToken = verifyToken(req.headers.authorization);
const originalToken = req.headers['x-original-authorization'] 
  ? verifyToken(req.headers['x-original-authorization'])
  : null;

// Check permissions based on original token for superadmin endpoints
if (originalToken && originalToken.role === 'superadmin') {
  // Allow access
}
```

This approach is more complex and not recommended, but it's an option if token structure changes are not feasible.

---

## Questions?

If you need clarification on any of these requirements or want to discuss alternative approaches, please reach out. The key principle is: **the original superadmin's permissions should be preserved during impersonation for administrative actions.**

---

**Document Version:** 1.0  
**Last Updated:** January 2, 2025  
**Contact:** Frontend Team


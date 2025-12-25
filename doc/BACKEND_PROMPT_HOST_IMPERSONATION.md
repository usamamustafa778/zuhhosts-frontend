# Backend Implementation Task: Superadmin Host Impersonation API

## Overview
Implement a host impersonation feature that allows superadmin users to switch into any host's account for troubleshooting and support purposes. This feature requires 2 new API endpoints with proper authentication, authorization, and audit logging.

## Required Endpoints

### 1. Impersonate Host Endpoint

**Endpoint:** `POST /api/superadmin/impersonate/:hostId`

**Purpose:** Allow a superadmin to switch their session to view the platform as a specific host

**Authorization:** 
- Only users with `role: "superadmin"` can access this endpoint
- Requires valid JWT token in Authorization header

**Request:**
```http
POST /api/superadmin/impersonate/507f1f77bcf86cd799439011
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json
```

**Success Response (200):**
```json
{
  "success": true,
  "token": "new-jwt-token-representing-host-session",
  "user": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "John Smith",
    "email": "john@example.com",
    "role": "host",
    "host": true,
    "hostId": null,
    "impersonatedBy": "superadmin-user-id-here",
    "profilePicture": "https://example.com/photo.jpg",
    "createdAt": "2024-01-15T10:30:00.000Z"
  }
}
```

**Error Responses:**

403 Forbidden:
```json
{
  "success": false,
  "error": "Unauthorized. Superadmin access required."
}
```

404 Not Found:
```json
{
  "success": false,
  "error": "Host not found"
}
```

400 Bad Request:
```json
{
  "success": false,
  "error": "Cannot impersonate non-host users"
}
```

---

### 2. Stop Impersonation Endpoint

**Endpoint:** `POST /api/superadmin/stop-impersonation`

**Purpose:** Return from an impersonated host session back to the original superadmin session

**Authorization:** 
- Requires a valid impersonated session token
- Token must have `impersonatedBy` field set

**Request:**
```http
POST /api/superadmin/stop-impersonation
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json
```

**Success Response (200):**
```json
{
  "success": true,
  "token": "original-superadmin-jwt-token",
  "user": {
    "_id": "superadmin-user-id",
    "name": "Admin User",
    "email": "admin@zuhahosts.com",
    "role": "superadmin",
    "permissions": ["all"],
    "createdAt": "2023-06-01T08:00:00.000Z"
  }
}
```

**Error Responses:**

400 Bad Request:
```json
{
  "success": false,
  "error": "Not currently impersonating any user"
}
```

401 Unauthorized:
```json
{
  "success": false,
  "error": "Invalid or expired token"
}
```

---

## Implementation Requirements

### Token Strategy (Choose One)

#### Option A: Embedded Token Approach (Recommended for Stateless)

When creating the impersonation token, embed the original superadmin token inside the new JWT:

```javascript
// Pseudo-code example
async function impersonateHost(req, res) {
  const { hostId } = req.params;
  const superadmin = req.user; // From auth middleware
  
  // Verify superadmin permission
  if (superadmin.role !== 'superadmin') {
    return res.status(403).json({ error: 'Unauthorized' });
  }
  
  // Fetch host user
  const host = await User.findById(hostId);
  if (!host || !host.host) {
    return res.status(404).json({ error: 'Host not found' });
  }
  
  // Create new token with embedded original token
  const impersonatedToken = jwt.sign(
    {
      userId: host._id,
      role: 'host',
      host: true,
      impersonation: true,
      impersonatedBy: superadmin._id,
      originalToken: req.token, // Store original token
      // Optional: Add expiry for security
      exp: Math.floor(Date.now() / 1000) + (8 * 60 * 60) // 8 hours
    },
    JWT_SECRET
  );
  
  // Add impersonatedBy field to user object for frontend
  const userResponse = {
    ...host.toObject(),
    impersonatedBy: superadmin._id
  };
  
  // Log the impersonation action
  await AuditLog.create({
    action: 'IMPERSONATION_START',
    superadminId: superadmin._id,
    targetUserId: host._id,
    ipAddress: req.ip,
    userAgent: req.headers['user-agent'],
    timestamp: new Date()
  });
  
  res.json({
    success: true,
    token: impersonatedToken,
    user: userResponse
  });
}

async function stopImpersonation(req, res) {
  const tokenData = req.user; // From auth middleware
  
  // Verify this is an impersonated session
  if (!tokenData.impersonation || !tokenData.originalToken) {
    return res.status(400).json({ 
      error: 'Not currently impersonating any user' 
    });
  }
  
  // Verify and decode original token
  const originalTokenData = jwt.verify(tokenData.originalToken, JWT_SECRET);
  const superadmin = await User.findById(originalTokenData.userId);
  
  if (!superadmin) {
    return res.status(401).json({ error: 'Invalid original session' });
  }
  
  // Log the action
  await AuditLog.create({
    action: 'IMPERSONATION_END',
    superadminId: superadmin._id,
    targetUserId: tokenData.userId,
    ipAddress: req.ip,
    userAgent: req.headers['user-agent'],
    timestamp: new Date()
  });
  
  res.json({
    success: true,
    token: tokenData.originalToken,
    user: superadmin
  });
}
```

#### Option B: Server-Side Session Storage

Store impersonation sessions in database:

```javascript
// Pseudo-code example
const ImpersonationSession = new Schema({
  superadminId: { type: ObjectId, required: true },
  hostId: { type: ObjectId, required: true },
  originalToken: { type: String, required: true },
  sessionToken: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  expiresAt: { type: Date, required: true }
});

async function impersonateHost(req, res) {
  // ... validation code ...
  
  // Create session record
  const session = await ImpersonationSession.create({
    superadminId: superadmin._id,
    hostId: host._id,
    originalToken: req.token,
    sessionToken: newToken,
    expiresAt: new Date(Date.now() + 8 * 60 * 60 * 1000)
  });
  
  // Create token with session reference
  const impersonatedToken = jwt.sign({
    userId: host._id,
    role: 'host',
    sessionId: session._id,
    impersonation: true,
    impersonatedBy: superadmin._id
  }, JWT_SECRET);
  
  // ... rest of code ...
}

async function stopImpersonation(req, res) {
  const tokenData = req.user;
  
  // Find session
  const session = await ImpersonationSession.findById(tokenData.sessionId);
  if (!session) {
    return res.status(400).json({ error: 'Session not found' });
  }
  
  // Delete session
  await ImpersonationSession.deleteOne({ _id: session._id });
  
  // Return original token
  res.json({
    success: true,
    token: session.originalToken,
    user: await User.findById(session.superadminId)
  });
}
```

---

## Security Requirements

### 1. Permission Verification
```javascript
// Middleware or inline check
if (req.user.role !== 'superadmin') {
  return res.status(403).json({ 
    success: false,
    error: 'Unauthorized. Superadmin access required.' 
  });
}
```

### 2. Audit Logging (CRITICAL)
Create audit logs for all impersonation actions:

```javascript
const auditLogSchema = {
  action: String, // 'IMPERSONATION_START' | 'IMPERSONATION_END'
  superadminId: ObjectId,
  superadminEmail: String,
  targetUserId: ObjectId,
  targetUserEmail: String,
  ipAddress: String,
  userAgent: String,
  timestamp: Date,
  duration: Number // For IMPERSONATION_END
};
```

### 3. Rate Limiting
Implement rate limiting to prevent abuse:
```javascript
// Example: Max 20 impersonations per hour per superadmin
rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20,
  keyGenerator: (req) => req.user._id
})
```

### 4. Token Expiration
- Impersonation tokens should expire faster than regular tokens
- Recommended: 8 hours maximum
- Original superadmin token should not be expired

### 5. Host Validation
```javascript
// Ensure target user is actually a host
const host = await User.findById(hostId);
if (!host || host.host !== true || host.hostId !== null) {
  return res.status(400).json({ 
    error: 'Invalid host ID or user is not a host' 
  });
}
```

---

## Middleware Updates

### Update Authentication Middleware

Your existing JWT verification middleware should handle impersonated tokens:

```javascript
async function authenticateToken(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // If impersonating, log all actions
    if (decoded.impersonation) {
      // Optional: Log impersonated actions
      logImpersonatedAction({
        superadminId: decoded.impersonatedBy,
        action: req.method + ' ' + req.path,
        timestamp: new Date()
      });
    }
    
    req.user = decoded;
    req.token = token;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}
```

---

## Testing Checklist

### Unit Tests
- [ ] Superadmin can successfully impersonate a valid host
- [ ] Non-superadmin users receive 403 when attempting impersonation
- [ ] Invalid host ID returns 404
- [ ] Attempting to impersonate non-host user returns 400
- [ ] Impersonation token contains correct host data
- [ ] Impersonation token includes `impersonatedBy` field
- [ ] Stop impersonation returns original superadmin token
- [ ] Stop impersonation fails when not impersonating
- [ ] Audit logs are created for both start and stop actions

### Integration Tests
- [ ] Impersonated token works for host-specific API endpoints
- [ ] Host's data is returned correctly (properties, bookings, etc.)
- [ ] Superadmin can switch between multiple hosts
- [ ] Token expiration works correctly
- [ ] Rate limiting prevents abuse
- [ ] Original superadmin token still works after impersonation

### Security Tests
- [ ] Cannot impersonate with expired token
- [ ] Cannot reuse stopped impersonation token
- [ ] Audit logs capture IP address and user agent
- [ ] Only hosts can be impersonated (not team members or other superadmins)

---

## Database Schema Updates (if using Option B)

### Impersonation Sessions Collection
```javascript
const impersonationSessionSchema = new mongoose.Schema({
  superadminId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  hostId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  originalToken: {
    type: String,
    required: true
  },
  sessionToken: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  expiresAt: {
    type: Date,
    required: true,
    index: true
  },
  active: {
    type: Boolean,
    default: true
  }
});

// Auto-cleanup expired sessions
impersonationSessionSchema.index(
  { expiresAt: 1 },
  { expireAfterSeconds: 0 }
);
```

### Audit Logs Collection
```javascript
const auditLogSchema = new mongoose.Schema({
  action: {
    type: String,
    required: true,
    enum: ['IMPERSONATION_START', 'IMPERSONATION_END', 'IMPERSONATION_ACTION']
  },
  superadminId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  targetUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  ipAddress: String,
  userAgent: String,
  endpoint: String, // For action logs
  method: String, // For action logs
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  },
  duration: Number // Duration in milliseconds (for END actions)
});
```

---

## API Routes to Add

```javascript
// routes/superadmin.js
const express = require('express');
const router = express.Router();
const { authenticateToken, requireSuperadmin } = require('../middleware/auth');

router.post(
  '/impersonate/:hostId',
  authenticateToken,
  requireSuperadmin,
  impersonateHost
);

router.post(
  '/stop-impersonation',
  authenticateToken,
  stopImpersonation
);

module.exports = router;
```

---

## Environment Variables

Add these to your `.env` file if needed:

```bash
# Impersonation Settings
IMPERSONATION_TOKEN_EXPIRY=8h
IMPERSONATION_RATE_LIMIT=20
ENABLE_IMPERSONATION_LOGGING=true
```

---

## Expected Behavior

### Happy Path
1. Superadmin clicks "View as Host" in frontend
2. Frontend fetches list of hosts from `GET /api/users/hosts/list`
3. Superadmin selects a host from dropdown
4. Frontend calls `POST /api/superadmin/impersonate/:hostId`
5. Backend validates superadmin, creates impersonation token, logs action
6. Backend returns new token and host user data
7. Frontend stores new token and navigates to host dashboard
8. All subsequent API calls use impersonation token
9. Frontend shows "Viewing as Host" banner
10. Superadmin clicks "Return to Superadmin"
11. Frontend calls `POST /api/superadmin/stop-impersonation`
12. Backend validates impersonation, logs action, returns original token
13. Frontend stores original token and navigates to superadmin dashboard

### Error Handling
- Invalid host ID: Return 404 with clear error message
- Non-host user: Return 400 with explanation
- Unauthorized user: Return 403 with permission error
- Expired token: Return 401 with token expired message
- Already stopped impersonation: Return 400 with not impersonating message

---

## Additional Notes

1. **Frontend expects these exact field names:**
   - `token` - The JWT token
   - `user` - User object with all fields
   - `user.impersonatedBy` - The superadmin ID (critical for frontend detection)
   - `success` - Boolean flag
   - `error` - Error message string

2. **The existing `/api/users/hosts/list` endpoint is used** for fetching hosts list. Ensure it returns:
   ```json
   {
     "hosts": [
       {
         "_id": "...",
         "name": "...",
         "email": "...",
         "properties": [...],
         "host": true
       }
     ]
   }
   ```

3. **All host-scoped API calls must respect impersonation**. When a superadmin is impersonating a host, all data queries should be scoped to that host's data only.

4. **Consider implementing a cleanup job** to remove old audit logs after 90 days (or your retention policy).

---

## Questions or Clarifications Needed?

- Do you want to restrict any specific actions during impersonation?
- What should be the maximum impersonation session duration?
- Should we send email notifications to hosts when impersonation occurs?
- Do you need real-time tracking of active impersonation sessions?

---

## Reference

Frontend PR/Branch: [Add your branch name here]
Frontend Implementation: `/src/components/layout/Topbar.js`
Frontend API Client: `/src/lib/api.js` (functions: `impersonateHost`, `stopImpersonation`)
Documentation: `/doc/HOST_IMPERSONATION.md`


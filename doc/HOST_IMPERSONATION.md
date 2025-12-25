# Host Impersonation Feature - Documentation

## Overview
This feature allows superadmin users to switch into any host's account to view and manage their data as if they were that host. This is useful for troubleshooting, support, and administrative purposes.

## Frontend Changes

### Files Modified

#### 1. `/src/components/layout/Topbar.js`
**Changes:**
- Removed the role dropdown (Admin, Manager, Staff)
- Added host switcher dropdown (visible only to superadmin users)
- Added impersonation banner to show when viewing as a host
- Implemented host switching logic with loading states
- Added "Return to Superadmin" button when impersonating

**New Features:**
- Fetches list of all hosts from backend
- Displays hosts with their name, email, and property count
- Allows clicking on a host to switch to their account
- Shows visual indicator when impersonating (amber banner)
- Provides easy way to return to superadmin view

#### 2. `/src/components/layout/DashboardShell.js`
**Changes:**
- Removed `role` state management
- Removed role-related props passed to Topbar and Sidebar
- Simplified context value

#### 3. `/src/components/layout/Sidebar.js`
**Changes:**
- Removed `role` prop dependency
- Now relies entirely on user type from `useAuth()` hook
- Automatically switches menu items based on current user type

#### 4. `/src/lib/api.js`
**New Functions Added:**
```javascript
// Impersonate a host account (Superadmin only)
export async function impersonateHost(hostId)

// Stop impersonating and return to superadmin view
export async function stopImpersonation()
```

## Backend API Requirements

### 1. Impersonate Host Endpoint

**Endpoint:** `POST /api/superadmin/impersonate/:hostId`

**Purpose:** Allow superadmin to switch into a host's account

**Authorization:** Bearer token (superadmin only)

**Request:**
```http
POST /api/superadmin/impersonate/507f1f77bcf86cd799439011
Authorization: Bearer <superadmin-jwt-token>
Content-Type: application/json
```

**Response (Success - 200):**
```json
{
  "success": true,
  "token": "new-jwt-token-with-host-context",
  "user": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "John Smith",
    "email": "john@example.com",
    "role": "host",
    "host": true,
    "hostId": null,
    "impersonatedBy": "superadmin-user-id",
    "profilePicture": "https://...",
    "properties": ["prop1", "prop2"]
  }
}
```

**Response (Error - 403):**
```json
{
  "success": false,
  "error": "Unauthorized. Superadmin access required."
}
```

**Response (Error - 404):**
```json
{
  "success": false,
  "error": "Host not found"
}
```

---

### 2. Stop Impersonation Endpoint

**Endpoint:** `POST /api/superadmin/stop-impersonation`

**Purpose:** Return from impersonated host account to superadmin view

**Authorization:** Bearer token (from impersonated session)

**Request:**
```http
POST /api/superadmin/stop-impersonation
Authorization: Bearer <impersonated-session-token>
Content-Type: application/json
```

**Response (Success - 200):**
```json
{
  "success": true,
  "token": "original-superadmin-jwt-token",
  "user": {
    "_id": "superadmin-user-id",
    "name": "Admin User",
    "email": "admin@zuhahosts.com",
    "role": "superadmin",
    "permissions": ["all"]
  }
}
```

**Response (Error - 400):**
```json
{
  "success": false,
  "error": "Not currently impersonating any user"
}
```

---

### 3. Get Hosts List Endpoint

**Endpoint:** `GET /api/users/hosts/list`

**Purpose:** Get list of all hosts with their basic information

**Note:** This endpoint already exists and is used by the frontend. Ensure it returns:

**Response:**
```json
{
  "success": true,
  "hosts": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "name": "John Smith",
      "email": "john@example.com",
      "host": true,
      "profilePicture": "https://...",
      "properties": ["prop1", "prop2"],
      "createdAt": "2024-01-15T10:30:00Z",
      "status": "active"
    },
    // ... more hosts
  ],
  "total": 25
}
```

## Backend Implementation Guidelines

### Token Management Strategy

There are **two recommended approaches** for implementing impersonation:

#### Option 1: Dual Token Storage (Recommended)
Store the original superadmin token in the impersonated token's payload:

```javascript
// When impersonating
const impersonatedToken = jwt.sign({
  userId: hostId,
  role: 'host',
  impersonatedBy: superadminUserId,
  originalToken: superadminToken, // Encrypted
  impersonation: true
}, SECRET);

// When stopping impersonation
// Decode and return the originalToken
```

**Pros:**
- No server-side session storage needed
- Stateless and scalable
- Easy to implement

**Cons:**
- Slightly larger token size
- Need to encrypt the original token within the new token

#### Option 2: Server-Side Session Storage
Store the original session in a sessions table:

```javascript
// When impersonating
await db.sessions.create({
  superadminId: superadminUserId,
  originalToken: superadminToken,
  impersonatedHostId: hostId,
  createdAt: new Date()
});

const impersonatedToken = jwt.sign({
  userId: hostId,
  role: 'host',
  impersonatedBy: superadminUserId,
  sessionId: session._id,
  impersonation: true
}, SECRET);

// When stopping impersonation
const session = await db.sessions.findOne({ sessionId });
return session.originalToken;
```

**Pros:**
- Smaller token size
- Can track active impersonation sessions
- Can force-end impersonation sessions

**Cons:**
- Requires database storage
- Needs session cleanup logic

### Security Considerations

1. **Permission Verification:**
   ```javascript
   // Verify only superadmins can impersonate
   if (req.user.role !== 'superadmin') {
     return res.status(403).json({ error: 'Unauthorized' });
   }
   ```

2. **Audit Logging:**
   ```javascript
   // Log all impersonation actions
   await AuditLog.create({
     action: 'HOST_IMPERSONATION_START',
     superadminId: req.user._id,
     targetHostId: hostId,
     timestamp: new Date(),
     ipAddress: req.ip
   });
   ```

3. **Token Marking:**
   Always include `impersonatedBy` field in the user object returned with the token so frontend can display appropriate UI indicators.

4. **Rate Limiting:**
   Consider rate limiting these endpoints to prevent abuse.

5. **Restricted Actions:**
   Optionally, restrict certain sensitive actions during impersonation (e.g., changing passwords, deleting accounts).

### Middleware Example

```javascript
// middleware/verifyImpersonation.js
const verifyImpersonation = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  const decoded = jwt.verify(token, SECRET);
  
  if (decoded.impersonation) {
    // Log the action
    logImpersonatedAction(decoded.impersonatedBy, decoded.userId, req.path);
  }
  
  req.user = decoded;
  next();
};
```

## Testing Checklist

### Frontend Testing
- [ ] Superadmin can see the "View as Host" dropdown
- [ ] Non-superadmin users don't see the host switcher
- [ ] Clicking the dropdown shows loading state while fetching hosts
- [ ] All hosts are displayed with correct information
- [ ] Clicking a host triggers the impersonation
- [ ] After switching, user sees host dashboard
- [ ] Impersonation banner is visible when viewing as host
- [ ] "Return to Superadmin" button works correctly
- [ ] After returning, user sees superadmin dashboard
- [ ] Sidebar menu updates correctly based on current user type

### Backend Testing
- [ ] Only superadmins can access impersonation endpoints
- [ ] Invalid host ID returns 404
- [ ] Impersonation returns correct host data and token
- [ ] Impersonated token works for host-specific API calls
- [ ] Stop impersonation returns correct superadmin data
- [ ] Audit logs are created for impersonation actions
- [ ] Token expiration is handled correctly
- [ ] Attempting to stop impersonation without active impersonation fails gracefully

## UI Flow

```
┌─────────────────────────────────────────────────────────┐
│ Superadmin Dashboard                                     │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ Topbar: [🏠 View as Host ▼] [👁️ Bell] [Profile]   │ │
│ └─────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
                     │
                     │ Click "View as Host"
                     ▼
┌─────────────────────────────────────────────────────────┐
│ Host Selection Dropdown                                  │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ Switch to Host                          [Close]     │ │
│ ├─────────────────────────────────────────────────────┤ │
│ │ [JD] John Doe                                       │ │
│ │      john@example.com                               │ │
│ │      3 properties                                   │ │
│ ├─────────────────────────────────────────────────────┤ │
│ │ [JS] Jane Smith                                     │ │
│ │      jane@example.com                               │ │
│ │      7 properties                                   │ │
│ └─────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
                     │
                     │ Select a host
                     ▼
┌─────────────────────────────────────────────────────────┐
│ Host Dashboard (Impersonated)                           │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ [🏠 Switch Host ▼] [👁️ Viewing as Host] [Profile] │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                          │
│ Host's properties, bookings, etc. are visible here      │
└─────────────────────────────────────────────────────────┘
                     │
                     │ Click "Switch Host" dropdown
                     ▼
┌─────────────────────────────────────────────────────────┐
│ Host Selection Dropdown (While Impersonating)           │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ [⬅️ Return to Superadmin]                          │ │
│ ├─────────────────────────────────────────────────────┤ │
│ │ [Other hosts listed here...]                        │ │
│ └─────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
                     │
                     │ Click "Return to Superadmin"
                     ▼
┌─────────────────────────────────────────────────────────┐
│ Superadmin Dashboard (Back to normal)                   │
└─────────────────────────────────────────────────────────┘
```

## Future Enhancements

1. **Impersonation History:** Track and display recent impersonations
2. **Time Limits:** Auto-expire impersonation sessions after X hours
3. **Restricted Mode:** Show visual indicator throughout all pages during impersonation
4. **Action Restrictions:** Prevent certain dangerous actions during impersonation
5. **Search Hosts:** Add search/filter functionality in the host dropdown
6. **Recent Hosts:** Show recently impersonated hosts at the top
7. **Host Details:** Show more host information (subscription status, last login, etc.)


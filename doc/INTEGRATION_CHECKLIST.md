# Frontend-Backend Integration Checklist
## Host Impersonation Feature

---

## ✅ Integration Status

### Backend Implementation
✅ **Complete** - All endpoints implemented and documented

### Frontend Implementation  
✅ **Complete** - UI and API integration ready

---

## 🔄 Integration Points Verification

### 1. API Endpoints Alignment

| Feature | Frontend Expects | Backend Provides | Status |
|---------|-----------------|------------------|--------|
| Get Hosts List | `GET /api/users/hosts/list` | `GET /api/users/hosts/list` | ✅ Match |
| Impersonate Host | `POST /api/superadmin/impersonate/:hostId` | `POST /api/superadmin/impersonate/:hostId` | ✅ Match |
| Stop Impersonation | `POST /api/superadmin/stop-impersonation` | `POST /api/superadmin/stop-impersonation` | ✅ Match |

### 2. Response Format Alignment

**Impersonate Host Response:**

Frontend Expects:
```json
{
  "success": true,
  "token": "jwt-token",
  "user": {
    "_id": "...",
    "impersonatedBy": "superadmin-id",
    ...
  }
}
```

Backend Provides:
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "_id": "507f1f77bcf86cd799439011",
    "impersonatedBy": "superadmin",
    ...
  }
}
```

✅ **Status:** Perfect match

**Stop Impersonation Response:**

Frontend Expects:
```json
{
  "success": true,
  "token": "original-token",
  "user": { ... }
}
```

Backend Provides:
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "_id": "superadmin",
    "role": "superadmin",
    ...
  }
}
```

✅ **Status:** Perfect match

### 3. Error Handling Alignment

| Error Case | Frontend Handles | Backend Returns | Status |
|------------|------------------|-----------------|--------|
| Not Superadmin | Shows error message | 403 Forbidden | ✅ Match |
| Host Not Found | Shows error message | 404 Not Found | ✅ Match |
| Invalid Host ID | Shows error message | 400 Bad Request | ✅ Match |
| Not Impersonating | Shows error message | 400 Bad Request | ✅ Match |
| Token Expired | Shows error message | 401 Unauthorized | ✅ Match |

---

## 🧪 Testing Checklist

### Pre-Testing Setup

1. **Environment Variables**
   ```bash
   # Backend .env
   IMPERSONATION_TOKEN_EXPIRY=8h
   ENABLE_IMPERSONATION_LOGGING=false
   JWT_SECRET=your-secret-key
   ```

2. **Frontend .env**
   ```bash
   NEXT_PUBLIC_API_BASE_URL=http://localhost:5001/api
   ```

3. **Ensure Backend is Running**
   ```bash
   # In backend directory
   npm start
   # Should see: Server running on port 5001
   ```

4. **Ensure Frontend is Running**
   ```bash
   # In frontend directory
   npm run dev
   # Should see: Ready on http://localhost:3000
   ```

### Test Scenarios

#### ✅ Test 1: Superadmin Can View Host Dropdown

**Steps:**
1. Login as superadmin (`admin@zuhahosts.com`)
2. Navigate to superadmin dashboard
3. Look for "🏠 View as Host" dropdown in topbar

**Expected Result:**
- Dropdown button visible in topbar
- Button shows "View as Host" text
- Clicking opens dropdown with host list

**Status:** [ ]

---

#### ✅ Test 2: Host List Loads Successfully

**Steps:**
1. As superadmin, click "View as Host" dropdown
2. Observe loading state

**Expected Result:**
- "Loading hosts..." shown briefly
- List of hosts appears with:
  - Host initials or profile picture
  - Host name
  - Host email
  - Property count (if available)

**Status:** [ ]

---

#### ✅ Test 3: Successfully Impersonate a Host

**Steps:**
1. Click on a host from the dropdown
2. Observe transition

**Expected Result:**
- "Switching..." state shown
- Redirect to `/host/dashboard`
- Topbar shows:
  - "Switch Host" button (changed text)
  - "👁️ Viewing as Host" amber banner
- Sidebar menu changes to host menu items
- All data shown is for the impersonated host

**Console Check:**
```javascript
// In browser console
const user = JSON.parse(localStorage.getItem('luxeboard.authUser'));
console.log(user.impersonatedBy); // Should show superadmin ID
```

**Status:** [ ]

---

#### ✅ Test 4: Host Data Isolation

**Steps:**
1. While impersonating, check various pages:
   - Properties page
   - Bookings page
   - Guests page
   - Tasks page

**Expected Result:**
- All pages show only the impersonated host's data
- No data from other hosts visible
- All API calls use impersonation token

**Network Tab Check:**
- All requests have `Authorization: Bearer <impersonation-token>`
- Decoded token has `impersonation: true` flag

**Status:** [ ]

---

#### ✅ Test 5: Switch Between Multiple Hosts

**Steps:**
1. While impersonating Host A, click "Switch Host" dropdown
2. Select Host B from the list
3. Observe transition

**Expected Result:**
- Successfully switches to Host B
- Dashboard shows Host B's data
- Banner still shows "Viewing as Host"
- "Return to Superadmin" button still available

**Status:** [ ]

---

#### ✅ Test 6: Return to Superadmin View

**Steps:**
1. While impersonating, click "Switch Host" dropdown
2. Click "⬅️ Return to Superadmin" button
3. Observe transition

**Expected Result:**
- "Switching..." state shown
- Redirect to `/superadmin/dashboard`
- Impersonation banner disappears
- "View as Host" button returns
- Sidebar shows superadmin menu items

**Console Check:**
```javascript
// In browser console
const user = JSON.parse(localStorage.getItem('luxeboard.authUser'));
console.log(user.impersonatedBy); // Should be undefined
console.log(user.role); // Should be "superadmin"
```

**Status:** [ ]

---

#### ✅ Test 7: Non-Superadmin Cannot See Host Switcher

**Steps:**
1. Logout
2. Login as regular host or team member
3. Check topbar

**Expected Result:**
- "View as Host" dropdown NOT visible
- Only regular user controls shown

**Status:** [ ]

---

#### ✅ Test 8: Error Handling - Invalid Host ID

**Steps:**
1. Using browser console or API client, try to impersonate with invalid ID:
   ```javascript
   fetch('http://localhost:5001/api/superadmin/impersonate/invalid-id', {
     method: 'POST',
     headers: {
       'Authorization': `Bearer ${localStorage.getItem('luxeboard.authToken')}`,
       'Content-Type': 'application/json'
     }
   }).then(r => r.json()).then(console.log);
   ```

**Expected Result:**
- 400 Bad Request error
- Error message: "Invalid host ID format"
- Alert shown to user

**Status:** [ ]

---

#### ✅ Test 9: Error Handling - Host Not Found

**Steps:**
1. Try to impersonate non-existent host ID:
   ```javascript
   fetch('http://localhost:5001/api/superadmin/impersonate/507f1f77bcf86cd799439011', {
     method: 'POST',
     headers: {
       'Authorization': `Bearer ${localStorage.getItem('luxeboard.authToken')}`,
       'Content-Type': 'application/json'
     }
   }).then(r => r.json()).then(console.log);
   ```

**Expected Result:**
- 404 Not Found error
- Error message: "Host not found"
- Alert shown to user

**Status:** [ ]

---

#### ✅ Test 10: Audit Logs Created

**Steps:**
1. After impersonating and stopping, check MongoDB:
   ```javascript
   // In MongoDB shell or Compass
   db.auditlogs.find({ 
     action: { $in: ['IMPERSONATION_START', 'IMPERSONATION_END'] } 
   }).sort({ timestamp: -1 }).limit(10)
   ```

**Expected Result:**
- IMPERSONATION_START log created when starting
- IMPERSONATION_END log created when stopping
- Logs include:
  - superadminId
  - superadminEmail
  - targetUserId
  - targetUserEmail
  - ipAddress
  - userAgent
  - timestamp
  - duration (for END logs)

**Status:** [ ]

---

#### ✅ Test 11: Token Persistence Across Page Refresh

**Steps:**
1. Impersonate a host
2. Refresh the page (F5)
3. Observe state

**Expected Result:**
- Still impersonating the same host
- Impersonation banner still visible
- Host dashboard still shown
- No redirect to login

**Status:** [ ]

---

#### ✅ Test 12: Mobile Responsive Design

**Steps:**
1. Open browser DevTools
2. Switch to mobile view (e.g., iPhone 12)
3. Login as superadmin
4. Test host switcher on mobile

**Expected Result:**
- Dropdown button visible and clickable
- Dropdown opens properly
- Host list scrollable
- All functionality works on mobile
- Impersonation banner visible

**Status:** [ ]

---

## 🐛 Known Issues / Edge Cases to Test

### 1. Token Expiration During Impersonation

**Scenario:** Impersonation token expires while viewing host dashboard

**Expected Behavior:** 
- User redirected to login
- Clear error message shown

**Test:** Wait 8+ hours or manually set short expiry in backend env

**Status:** [ ]

---

### 2. Original Token Expires Before Stopping

**Scenario:** Original superadmin token expires before stopping impersonation

**Expected Behavior:**
- Error: "Original session has expired. Please login again."
- User must re-authenticate as superadmin

**Test:** 
```javascript
// In backend, temporarily set JWT_EXPIRE=1m
// Wait 1+ minute
// Try to stop impersonation
```

**Status:** [ ]

---

### 3. Concurrent Impersonations

**Scenario:** Superadmin opens multiple browser tabs, impersonates different hosts

**Expected Behavior:**
- Each tab maintains its own impersonation state
- Tokens don't conflict
- Each tab can stop independently

**Test:** Open 2 browser tabs, impersonate different hosts in each

**Status:** [ ]

---

## 📊 Performance Testing

### Load Test: Multiple Impersonations

**Test:**
```bash
# Use Apache Bench or similar
ab -n 100 -c 10 \
  -H "Authorization: Bearer <superadmin-token>" \
  -H "Content-Type: application/json" \
  -m POST \
  http://localhost:5001/api/superadmin/impersonate/HOST_ID
```

**Expected:** All requests succeed, response time < 500ms

**Status:** [ ]

---

### Token Size Test

**Test:**
```javascript
// Decode impersonation token
const jwt = require('jsonwebtoken');
const token = "..."; // Your impersonation token
const decoded = jwt.decode(token);
const tokenSize = Buffer.from(token).length;

console.log('Token size:', tokenSize, 'bytes');
console.log('Token payload:', JSON.stringify(decoded, null, 2));
```

**Expected:** Token size < 2KB

**Status:** [ ]

---

## 🔒 Security Testing

### Test 1: Non-Superadmin Cannot Impersonate

**Test:**
```javascript
// Login as regular host
// Try to impersonate another host
fetch('http://localhost:5001/api/superadmin/impersonate/HOST_ID', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${hostToken}`,
    'Content-Type': 'application/json'
  }
}).then(r => r.json()).then(console.log);
```

**Expected:** 403 Forbidden

**Status:** [ ]

---

### Test 2: Cannot Impersonate Non-Host Users

**Test:**
```javascript
// Try to impersonate a team member
fetch('http://localhost:5001/api/superadmin/impersonate/TEAM_MEMBER_ID', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${superadminToken}`,
    'Content-Type': 'application/json'
  }
}).then(r => r.json()).then(console.log);
```

**Expected:** 400 Bad Request - "Cannot impersonate non-host users"

**Status:** [ ]

---

### Test 3: Expired Token Rejected

**Test:**
```javascript
// Use an expired token
fetch('http://localhost:5001/api/superadmin/impersonate/HOST_ID', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer expired-token`,
    'Content-Type': 'application/json'
  }
}).then(r => r.json()).then(console.log);
```

**Expected:** 401 Unauthorized

**Status:** [ ]

---

## 📱 Browser Compatibility

Test in multiple browsers:

- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)
- [ ] Mobile Safari (iOS)
- [ ] Mobile Chrome (Android)

---

## 🎯 Post-Integration Tasks

### Required

- [ ] Update environment variables in production
- [ ] Test on staging environment
- [ ] Monitor audit logs for first week
- [ ] Document any edge cases found
- [ ] Train superadmin users on feature

### Optional

- [ ] Set up monitoring alerts for excessive impersonation
- [ ] Create admin dashboard for viewing audit logs
- [ ] Add analytics for impersonation usage
- [ ] Consider email notifications to hosts (optional)

---

## 📞 Troubleshooting Common Issues

### Issue: "No hosts found" in dropdown

**Possible Causes:**
1. No hosts in database
2. `/api/users/hosts/list` endpoint not returning data
3. Response format mismatch

**Solution:**
```javascript
// Check API response manually
fetch('http://localhost:5001/api/users/hosts/list', {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('luxeboard.authToken')}`
  }
}).then(r => r.json()).then(console.log);
```

---

### Issue: Impersonation button not showing

**Possible Causes:**
1. User not logged in as superadmin
2. `isSuperAdmin` not detecting correctly
3. Component not rendering

**Solution:**
```javascript
// Check user role in console
const user = JSON.parse(localStorage.getItem('luxeboard.authUser'));
console.log('User role:', user.role);
console.log('Is superadmin?:', user.role === 'superadmin');
```

---

### Issue: CORS errors on API calls

**Solution:**
```javascript
// Backend needs CORS configured
// In app.js:
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));
```

---

### Issue: Token not being saved

**Solution:**
Check browser console for localStorage errors:
```javascript
// Test localStorage access
try {
  localStorage.setItem('test', 'value');
  console.log('localStorage working');
} catch (e) {
  console.error('localStorage blocked:', e);
}
```

---

## ✅ Final Verification

Before marking as complete, verify:

- [ ] All test scenarios passed
- [ ] No console errors
- [ ] No network errors
- [ ] Audit logs being created
- [ ] UI looks correct on all screen sizes
- [ ] Performance is acceptable
- [ ] Security tests passed
- [ ] Documentation is accurate

---

## 📚 Reference Documentation

- **Backend API Guide:** `IMPERSONATION_API_GUIDE.md` (in backend repo)
- **Frontend Implementation:** `src/components/layout/Topbar.js`
- **Frontend API Client:** `src/lib/api.js`
- **Feature Documentation:** `HOST_IMPERSONATION.md`
- **Backend Prompt:** `BACKEND_PROMPT_HOST_IMPERSONATION.md`

---

**Integration Date:** December 25, 2024  
**Status:** Ready for Testing  
**Version:** 1.0


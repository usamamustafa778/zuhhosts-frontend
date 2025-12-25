# Debugging Host Impersonation - Click Not Working

## Quick Debugging Steps

### Step 1: Open Browser Console

1. Open your browser DevTools (F12 or Right-click → Inspect)
2. Go to the **Console** tab
3. Click on a host in the dropdown
4. Look for any errors or messages

---

## Common Issues & Solutions

### Issue 1: No Hosts in Dropdown

**Check the Console:**
```javascript
// In browser console, check if hosts are loaded
const topbarComponent = document.querySelector('[aria-label="Profile menu"]');
console.log('Are there hosts?');
```

**Manual API Test:**
```javascript
// Test the hosts list API
fetch('http://localhost:5001/api/users/hosts/list', {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('luxeboard.authToken')}`
  }
})
.then(r => r.json())
.then(data => {
  console.log('Hosts API Response:', data);
  console.log('Number of hosts:', data.hosts?.length || 0);
})
.catch(err => console.error('API Error:', err));
```

**Expected Response:**
```json
{
  "hosts": [
    {
      "_id": "...",
      "name": "...",
      "email": "...",
      "host": true
    }
  ]
}
```

---

### Issue 2: Click Event Not Firing

**Add Debug Logging:**

Open `/src/components/layout/Topbar.js` and modify `handleHostSwitch`:

```javascript
const handleHostSwitch = async (hostId) => {
  console.log('🔵 handleHostSwitch called with hostId:', hostId);
  console.log('🔵 switchingHost state:', switchingHost);
  
  if (!hostId || switchingHost) {
    console.log('❌ Returning early. hostId:', hostId, 'switchingHost:', switchingHost);
    return;
  }
  
  setSwitchingHost(true);
  console.log('🔵 Starting impersonation for host:', hostId);
  
  try {
    console.log('🔵 Calling impersonateHost API...');
    const data = await impersonateHost(hostId);
    console.log('✅ API Response:', data);
    
    // Update auth with new token and user data
    if (data.token && data.user) {
      console.log('🔵 Updating auth with new token and user');
      login(data.token, data.user);
      setSelectedHostId(hostId);
      setIsHostSwitcherOpen(false);
      
      console.log('🔵 Navigating to /host/dashboard');
      router.push("/host/dashboard");
    } else {
      console.error('❌ Response missing token or user:', data);
    }
  } catch (error) {
    console.error("❌ Failed to switch host:", error);
    console.error("❌ Error details:", error.message, error.stack);
    alert(error.message || "Failed to switch to host account. Please try again.");
  } finally {
    console.log('🔵 Setting switchingHost back to false');
    setSwitchingHost(false);
  }
};
```

**Now click a host and check console for these logs.**

---

### Issue 3: API Call Failing

**Check Network Tab:**

1. Open DevTools → **Network** tab
2. Click on a host in the dropdown
3. Look for a request to `/api/superadmin/impersonate/...`

**If no request appears:**
- The onClick handler is not being called
- Check if button is disabled
- Check for JavaScript errors

**If request appears but fails:**
- Check the response status code
- Check the response body
- Common errors:
  - **403** - Not logged in as superadmin
  - **404** - Host not found
  - **401** - Token expired
  - **500** - Server error

---

### Issue 4: Token/User Not Being Saved

**Check the login function:**

In console:
```javascript
// Check current auth state
console.log('Token:', localStorage.getItem('luxeboard.authToken'));
console.log('User:', localStorage.getItem('luxeboard.authUser'));
```

**Test the login function manually:**
```javascript
// In console
const testToken = "test-token";
const testUser = { _id: "123", name: "Test", impersonatedBy: "superadmin" };

// This should trigger auth update
window.dispatchEvent(new Event('auth-change'));
```

---

### Issue 5: Backend Not Running

**Check if backend is accessible:**
```bash
# In terminal
curl http://localhost:5001/api/users/hosts/list
```

**Or in browser console:**
```javascript
fetch('http://localhost:5001/api/users/hosts/list')
  .then(r => {
    console.log('Backend status:', r.status);
    return r.json();
  })
  .then(console.log)
  .catch(err => console.error('Backend not accessible:', err));
```

---

## Complete Debug Script

**Copy and paste this into your browser console:**

```javascript
console.log('=== IMPERSONATION DEBUG SCRIPT ===');

// 1. Check user is superadmin
const userStr = localStorage.getItem('luxeboard.authUser');
if (!userStr) {
  console.error('❌ No user found in localStorage');
} else {
  const user = JSON.parse(userStr);
  console.log('✅ User:', user.name, user.email);
  console.log('✅ Role:', user.role);
  console.log('Is Superadmin?', user.role === 'superadmin');
  
  if (user.role !== 'superadmin') {
    console.error('❌ User is not superadmin! Impersonation will not work.');
  }
}

// 2. Check token exists
const token = localStorage.getItem('luxeboard.authToken');
if (!token) {
  console.error('❌ No auth token found');
} else {
  console.log('✅ Auth token exists:', token.substring(0, 20) + '...');
}

// 3. Test hosts list API
console.log('🔵 Testing hosts list API...');
fetch('http://localhost:5001/api/users/hosts/list', {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
})
.then(async response => {
  console.log('API Response Status:', response.status);
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error('❌ API Error:', errorText);
    throw new Error(`API returned ${response.status}`);
  }
  
  return response.json();
})
.then(data => {
  console.log('✅ Hosts API Response:', data);
  
  if (data.hosts && Array.isArray(data.hosts)) {
    console.log('✅ Number of hosts:', data.hosts.length);
    
    if (data.hosts.length > 0) {
      console.log('✅ First host:', data.hosts[0]);
      
      // 4. Test impersonation with first host
      const firstHostId = data.hosts[0]._id;
      console.log('🔵 Testing impersonation with first host:', firstHostId);
      
      return fetch(`http://localhost:5001/api/superadmin/impersonate/${firstHostId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
    } else {
      console.warn('⚠️ No hosts found in database');
    }
  } else {
    console.error('❌ Invalid response format. Expected { hosts: [...] }');
  }
})
.then(async response => {
  if (!response) return;
  
  console.log('Impersonation Response Status:', response.status);
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error('❌ Impersonation Error:', errorText);
    throw new Error(`Impersonation failed with ${response.status}`);
  }
  
  return response.json();
})
.then(data => {
  if (!data) return;
  
  console.log('✅ Impersonation Response:', data);
  
  if (data.success && data.token && data.user) {
    console.log('✅ Impersonation successful!');
    console.log('New token:', data.token.substring(0, 20) + '...');
    console.log('Impersonated user:', data.user.name);
    console.log('Impersonated by:', data.user.impersonatedBy);
    
    console.log('');
    console.log('🎉 EVERYTHING WORKS! The backend is responding correctly.');
    console.log('The issue is likely in the frontend click handler or state management.');
  } else {
    console.error('❌ Invalid impersonation response:', data);
  }
})
.catch(error => {
  console.error('❌ Test failed:', error.message);
  console.error('Full error:', error);
});

console.log('=== END DEBUG SCRIPT ===');
```

---

## Manual Test Without UI

If the debug script shows everything works, but clicking doesn't work, test manually:

```javascript
// In browser console
async function testImpersonation() {
  const token = localStorage.getItem('luxeboard.authToken');
  
  // Get first host
  const hostsRes = await fetch('http://localhost:5001/api/users/hosts/list', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const hostsData = await hostsRes.json();
  const firstHost = hostsData.hosts[0];
  
  console.log('Impersonating host:', firstHost.name);
  
  // Impersonate
  const impRes = await fetch(`http://localhost:5001/api/superadmin/impersonate/${firstHost._id}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  
  const impData = await impRes.json();
  console.log('Result:', impData);
  
  // Save to localStorage
  localStorage.setItem('luxeboard.authToken', impData.token);
  localStorage.setItem('luxeboard.authUser', JSON.stringify(impData.user));
  
  // Trigger auth change event
  window.dispatchEvent(new Event('auth-change'));
  
  // Redirect
  window.location.href = '/host/dashboard';
}

// Run it
testImpersonation();
```

---

## Check for React Component Issues

**Add this to see if component is re-rendering:**

```javascript
// In Topbar.js, add this useEffect
useEffect(() => {
  console.log('🔄 Topbar rendered/updated');
  console.log('isSuperAdmin:', isSuperAdmin);
  console.log('isHostSwitcherOpen:', isHostSwitcherOpen);
  console.log('hosts:', hosts);
  console.log('switchingHost:', switchingHost);
}, [isSuperAdmin, isHostSwitcherOpen, hosts, switchingHost]);
```

---

## Common Root Causes

### 1. User Not Actually Superadmin
```javascript
// Check in console
const user = JSON.parse(localStorage.getItem('luxeboard.authUser'));
console.log('Role:', user.role); // Must be "superadmin"
```

### 2. Backend Not Running or Different Port
```javascript
// Check API base URL
console.log('API URL:', process.env.NEXT_PUBLIC_API_BASE_URL);
// Should be: http://localhost:5001/api
```

### 3. CORS Issues
Look for CORS errors in console like:
```
Access to fetch at 'http://localhost:5001/...' from origin 'http://localhost:3000' 
has been blocked by CORS policy
```

**Solution:** Backend needs CORS enabled for `http://localhost:3000`

### 4. Token Expired
```javascript
// Decode token to check expiration
function parseJwt(token) {
  const base64Url = token.split('.')[1];
  const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => 
    '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
  ).join(''));
  return JSON.parse(jsonPayload);
}

const token = localStorage.getItem('luxeboard.authToken');
const decoded = parseJwt(token);
const isExpired = decoded.exp * 1000 < Date.now();

console.log('Token expires:', new Date(decoded.exp * 1000));
console.log('Is expired?', isExpired);
```

---

## Still Not Working?

**Share these details:**

1. **Console output** from the debug script
2. **Network tab** showing the API requests
3. **Any error messages** in console
4. **User role** - What does `localStorage.getItem('luxeboard.authUser')` show?
5. **Backend logs** - Any errors on backend when you click?

---

## Quick Fix: Add Defensive Checks

If you want to add more defensive code, update the host button in Topbar.js:

```javascript
<button
  key={host._id}
  onClick={(e) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('🔵 Host clicked:', host._id, host.name);
    handleHostSwitch(host._id);
  }}
  disabled={switchingHost}
  className="w-full text-left px-4 py-3 hover:bg-slate-50 transition-colors disabled:opacity-50"
>
```

This will:
- Prevent any default behavior
- Stop event bubbling
- Log when clicked
- Still call handleHostSwitch

---

**Run the debug script first and share the console output!**


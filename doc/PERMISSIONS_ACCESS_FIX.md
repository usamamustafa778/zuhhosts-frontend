# Permissions Page Access Fix

## Issue
Superadmin users were unable to access the `/permissions` page and other admin pages (`/roles`, `/users`, `/hosts`) even after successful login.

## Root Cause
The issue had two parts:

1. **Missing Context Values**: The `DashboardShell` component's context (`useDashboard()`) was returning an empty object without providing any `role` property.

2. **Incorrect Role Check**: The permissions and roles pages were checking for `role !== "Admin"`, which would always evaluate to true (access denied) since `role` was `undefined`.

3. **Wrong Auth Hook**: The pages were using `useRequireAuth()` which only returned `{ isAuthenticated, isLoading }`, not the full user object or helper flags like `isSuperAdmin`.

## Solution

### 1. Updated `useRequireAuth` Hook
Enhanced the hook to return user information and superadmin status:

**File**: `src/hooks/useAuth.js`

```javascript
export function useRequireAuth() {
  const router = useRouter();
  const { token, user, isAuthenticated, isLoading, isSuperAdmin } = useAuth();

  useEffect(() => {
    if (!isLoading && !token) {
      router.replace("/login");
    }
  }, [token, isLoading, router]);

  return { isAuthenticated, isLoading, user, isSuperAdmin };
}
```

### 2. Fixed Permissions Page
**File**: `src/app/permissions/page.js`

Changes:
- Removed dependency on `role` from `useDashboard()`
- Updated to use `user` from `useRequireAuth()`
- Changed access check to properly detect superadmin:
  ```javascript
  const userIsSuperadmin = user?.role === "superadmin" || user?.role?.name === "superadmin";
  ```
- Updated `useEffect` dependencies from `[role, isAuthenticated]` to `[isAuthenticated, user]`

### 3. Fixed Roles Page
**File**: `src/app/roles/page.js`

Applied the same fixes as the permissions page.

### 4. Fixed Users Page
**File**: `src/app/users/page.js`

- Removed dependency on `role` from `useDashboard()`
- Simplified access check to: `if (!isSuperAdmin && !isHost)`
- The page now correctly allows both superadmins and hosts to manage users

### 5. Fixed Hosts Page
**File**: `src/app/hosts/page.js`

- Removed unused `role` destructuring from `useDashboard()`
- The page already had correct superadmin checks using `isSuperAdmin`

## How Superadmin Detection Works

The system identifies superadmin users through the user object properties:

```javascript
// A user is superadmin if:
user.role === "superadmin" || user.role?.name === "superadmin"
```

This check is implemented in:
- `src/lib/auth.js` - `getUserType()` and `isSuperAdmin()` functions
- `src/hooks/useAuth.js` - Returns `isSuperAdmin` flag
- All admin pages - Check user role for access control

## Testing

After these fixes, superadmin users can now:
1. ✅ Login successfully using either regular login or superadmin login endpoint
2. ✅ Access `/permissions` page
3. ✅ Access `/roles` page
4. ✅ Access `/users` page
5. ✅ Access `/hosts` page

## Files Modified

1. `src/hooks/useAuth.js` - Enhanced `useRequireAuth` to return user and isSuperAdmin
2. `src/app/permissions/page.js` - Fixed role check and dependencies
3. `src/app/roles/page.js` - Fixed role check and dependencies
4. `src/app/users/page.js` - Removed invalid role check
5. `src/app/hosts/page.js` - Removed unused role variable

## Notes

- The `DashboardShell` context currently provides an empty object. If you need to share state across the dashboard, you should update the `contextValue` in `src/components/layout/DashboardShell.js`.
- All admin-level checks now properly use the `user` object from the auth hooks instead of a non-existent `role` from the dashboard context.
- The access control is now consistent across all admin pages.


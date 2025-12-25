# Guests API Documentation

## Overview
Complete API documentation for managing guests in the Airbnb management system.

**Guests are:**
- Customer contact records for people who rent properties
- Include name, phone number, and email address
- Linked to bookings (reservations)
- Belong to hosts (multi-tenant isolation)
- Essential for communication and booking management

---

## Base URL
```
http://localhost:5001/api/guests
```

## Authentication
All endpoints require authentication. Include the JWT token in the Authorization header:
```
Authorization: Bearer <your_token>
```

---

## Guest Model

```javascript
{
  "id": "string",
  "hostId": {                          // Populated host object
    "id": "string",
    "name": "string",
    "email": "string"
  },
  "name": "string",                    // Guest full name (min 2 characters)
  "phone": "string",                   // Phone number
  "email": "string",                   // Email address (unique per host)
  "createdAt": "date",
  "updatedAt": "date"
}
```

---

## Endpoints

### 1. Get All Guests
**GET** `/api/guests`

**Access:** 
- Superadmin: Can see all guests (across all hosts)
- Hosts: Can see only their guests
- Host Staff: Can see their host's guests (based on permissions)

Get a list of guest contacts filtered by access level.

**Response:**
```json
[
  {
    "id": "694c39579553cc06d11f0eb6",
    "hostId": {
      "id": "694c39579553cc06d11f0eb3",
      "name": "John Doe",
      "email": "john@example.com"
    },
    "name": "Sarah Williams",
    "phone": "+1234567893",
    "email": "sarah@example.com",
    "createdAt": "2025-12-20T10:00:00.000Z",
    "updatedAt": "2025-12-20T10:00:00.000Z"
  },
  {
    "id": "694c39579553cc06d11f0eb9",
    "hostId": {
      "id": "694c39579553cc06d11f0eb3",
      "name": "John Doe",
      "email": "john@example.com"
    },
    "name": "Michael Johnson",
    "phone": "+1234567894",
    "email": "michael@example.com",
    "createdAt": "2025-12-21T14:30:00.000Z",
    "updatedAt": "2025-12-21T14:30:00.000Z"
  }
]
```

**Notes:**
- Guests are sorted by creation date (newest first)
- Only returns guests belonging to the authenticated user's host account
- Superadmin sees all guests across all hosts

---

### 2. Get Single Guest
**GET** `/api/guests/:id`

**Access:** 
- Superadmin: Can see any guest
- Hosts: Can see only their guests
- Host Staff: Can see their host's guests (based on permissions)

Get detailed information about a specific guest.

**Response:**
```json
{
  "id": "694c39579553cc06d11f0eb6",
  "hostId": {
    "id": "694c39579553cc06d11f0eb3",
    "name": "John Doe",
    "email": "john@example.com"
  },
  "name": "Sarah Williams",
  "phone": "+1234567893",
  "email": "sarah@example.com",
  "createdAt": "2025-12-20T10:00:00.000Z",
  "updatedAt": "2025-12-20T10:00:00.000Z"
}
```

---

### 3. Create Guest
**POST** `/api/guests`

**Access:** 
- Superadmin: Can create guests for any host
- Hosts: Can create guests for their account
- Host Staff: Can create guests (based on permissions)

Create a new guest contact record.

**Request Body:**
```json
{
  "name": "Sarah Williams",
  "phone": "+1234567893",
  "email": "sarah@example.com"
}
```

**Required Fields:**
- `name` (string, minimum 2 characters)
- `phone` (string, contact phone number)
- `email` (string, valid email format)

**Validations:**
- Name must be at least 2 characters long
- Email must be in valid format (user@domain.com)
- Email must be unique per host (same email can exist for different hosts)

**Note:** The `hostId` is automatically set based on the authenticated user.

**Response:**
```json
{
  "id": "694c39579553cc06d11f0eb6",
  "hostId": "694c39579553cc06d11f0eb3",
  "name": "Sarah Williams",
  "phone": "+1234567893",
  "email": "sarah@example.com",
  "createdAt": "2025-12-20T10:00:00.000Z",
  "updatedAt": "2025-12-20T10:00:00.000Z"
}
```

---

### 4. Update Guest
**PUT** `/api/guests/:id`

**Access:** 
- Superadmin: Can update any guest
- Hosts: Can update only their guests
- Host Staff: Can update their host's guests (based on permissions)

Update guest contact information.

**Request Body:**
```json
{
  "name": "Sarah Williams-Johnson",
  "phone": "+1234567895",
  "email": "sarah.new@example.com"
}
```

**Note:** All fields are optional. Only provide fields you want to update.

**Validations:**
- If updating name, must be at least 2 characters
- If updating email, must be in valid format
- Email must remain unique per host

**Response:**
```json
{
  "id": "694c39579553cc06d11f0eb6",
  "hostId": {
    "id": "694c39579553cc06d11f0eb3",
    "name": "John Doe",
    "email": "john@example.com"
  },
  "name": "Sarah Williams-Johnson",
  "phone": "+1234567895",
  "email": "sarah.new@example.com",
  "createdAt": "2025-12-20T10:00:00.000Z",
  "updatedAt": "2025-12-25T15:30:00.000Z"
}
```

---

### 5. Delete Guest
**DELETE** `/api/guests/:id`

**Access:** 
- Superadmin: Can delete any guest
- Hosts: Can delete only their guests
- Host Staff: Can delete their host's guests (based on permissions)

Delete a guest contact record.

**Note:** ⚠️ **Warning** - Deleting a guest may impact related bookings. Consider the implications before deletion.

**Response:**
```json
{
  "message": "Guest deleted successfully"
}
```

---

## Error Responses

### 400 Bad Request
```json
{
  "error": "Name, phone, and email are required"
}
```

```json
{
  "error": "Please enter a valid email address"
}
```

```json
{
  "error": "Email already exists for this host"
}
```

```json
{
  "error": "Email already exists"
}
```

### 401 Unauthorized
```json
{
  "error": "Not authorized to access this route"
}
```

### 404 Not Found
```json
{
  "error": "Guest not found"
}
```

### 500 Internal Server Error
```json
{
  "error": "Error message here"
}
```

---

## Usage Examples

### Example 1: Create Guest (Host)
```bash
curl -X POST http://localhost:5001/api/guests \
  -H "Authorization: Bearer <host_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Sarah Williams",
    "phone": "+1234567893",
    "email": "sarah@example.com"
  }'
```

### Example 2: Get All Guests (Host)
```bash
curl -X GET http://localhost:5001/api/guests \
  -H "Authorization: Bearer <host_token>"
```

### Example 3: Get Single Guest
```bash
curl -X GET http://localhost:5001/api/guests/694c39579553cc06d11f0eb6 \
  -H "Authorization: Bearer <host_token>"
```

### Example 4: Update Guest Contact Info
```bash
curl -X PUT http://localhost:5001/api/guests/694c39579553cc06d11f0eb6 \
  -H "Authorization: Bearer <host_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "+1234567895",
    "email": "sarah.new@example.com"
  }'
```

### Example 5: Update Only Guest Name
```bash
curl -X PUT http://localhost:5001/api/guests/694c39579553cc06d11f0eb6 \
  -H "Authorization: Bearer <host_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Sarah Williams-Johnson"
  }'
```

### Example 6: Delete Guest
```bash
curl -X DELETE http://localhost:5001/api/guests/694c39579553cc06d11f0eb6 \
  -H "Authorization: Bearer <host_token>"
```

---

## Access Control Summary

| Action | Superadmin | Host | Host Staff |
|--------|------------|------|------------|
| **List Guests** | All guests | Own guests | Host's guests |
| **View Guest** | Any guest | Own guests | Host's guests |
| **Create Guest** | ✅ Yes | ✅ Yes | ⚠️ If permitted |
| **Update Guest** | Any guest | Own guests | ⚠️ If permitted |
| **Delete Guest** | Any guest | Own guests | ⚠️ If permitted |

---

## Complete Guest Workflow

### Step 1: Create Guest Contact
```bash
POST /api/guests
{
  "name": "Sarah Williams",
  "email": "sarah@example.com",
  "phone": "+1234567893"
}
# Returns: { id: "694c39579553cc06d11f0eb6", ... }
```

### Step 2: Create Property (if needed)
```bash
POST /api/properties
{
  "title": "Beautiful Beach House",
  "description": "Stunning beach house",
  "price": 250,
  "location": "123 Ocean Drive",
  "area": 2000
}
# Returns: { id: "694c39579553cc06d11f0eb7", ... }
```

### Step 3: Create Booking with Guest
```bash
POST /api/bookings
{
  "property_id": "694c39579553cc06d11f0eb7",
  "guest_id": "694c39579553cc06d11f0eb6",
  "start_date": "2025-12-30",
  "end_date": "2026-01-05",
  "amount": 1500
}
# Guest information is automatically populated in the booking
```

### Step 4: View Guest Booking History
```bash
# Get all bookings and filter by guest_id
GET /api/bookings
# Filter bookings where guest_id matches the guest
```

---

## Common Scenarios

### Scenario 1: New Guest Registration
```javascript
// Guest contacts you for the first time
POST /api/guests
{
  "name": "Sarah Williams",
  "phone": "+1234567893",
  "email": "sarah@example.com"
}

// Use returned guest ID for booking
POST /api/bookings
{
  "guest_id": "694c39579553cc06d11f0eb6",
  "property_id": "...",
  "start_date": "2025-12-30",
  "end_date": "2026-01-05",
  "amount": 1500
}
```

### Scenario 2: Returning Guest
```javascript
// Search for existing guest
GET /api/guests
// Find guest by email or name

// Create new booking with existing guest ID
POST /api/bookings
{
  "guest_id": "694c39579553cc06d11f0eb6",
  ...
}
```

### Scenario 3: Update Guest Contact Info
```javascript
// Guest changes phone number
PUT /api/guests/694c39579553cc06d11f0eb6
{
  "phone": "+1987654321"
}
```

### Scenario 4: Guest Changes Email
```javascript
// Guest updates email address
PUT /api/guests/694c39579553cc06d11f0eb6
{
  "email": "sarah.newemail@example.com"
}
```

### Scenario 5: Search for Guest by Email
```javascript
// Get all guests
GET /api/guests

// Frontend filters by email
const guest = guests.find(g => g.email === "sarah@example.com");
```

### Scenario 6: View All Guest Bookings
```javascript
// Get all bookings
GET /api/bookings

// Frontend filters by guest_id
const guestBookings = bookings.filter(b => b.guest_id.id === "694c39579553cc06d11f0eb6");

// Calculate total revenue from this guest
const totalRevenue = guestBookings.reduce((sum, booking) => sum + booking.amount, 0);
```

---

## Best Practices

### Creating Guests
1. **Check for Duplicates:** Search existing guests before creating to avoid duplicates
2. **Valid Contact Info:** Ensure email and phone are accurate for communication
3. **Consistent Naming:** Use full names for better record keeping
4. **Email Verification:** Consider verifying email addresses before first booking
5. **Data Privacy:** Handle guest information in compliance with privacy regulations

### Managing Guests
1. **Keep Information Updated:** Promptly update contact info when guests provide changes
2. **Merge Duplicates:** If duplicate guests exist, merge records carefully
3. **Booking History:** Track guest history for loyalty and reference
4. **Communication Records:** Link guest records to communication logs
5. **Notes Field:** Consider adding a notes field for special guest preferences

### Deleting Guests
1. **Check Bookings:** Review if guest has existing or past bookings
2. **Archive Instead:** Consider archiving instead of deleting for historical records
3. **Data Retention:** Comply with legal requirements for data retention
4. **Guest Request:** Only delete if guest explicitly requests data removal
5. **Related Records:** Understand impact on bookings and payment records

---

## Validation Rules

| Field | Rule | Error Message |
|-------|------|---------------|
| name | Required, min 2 chars | "Name, phone, and email are required" |
| phone | Required, string | "Name, phone, and email are required" |
| email | Required, valid format, unique per host | "Please enter a valid email address" |

---

## Email Uniqueness

The system enforces **email uniqueness per host**:

- ✅ **Allowed:** Different hosts can have guests with the same email
  - Host A: sarah@example.com
  - Host B: sarah@example.com

- ❌ **Not Allowed:** Same host cannot have duplicate guest emails
  - Host A: sarah@example.com
  - Host A: sarah@example.com (DUPLICATE ERROR)

This design allows the platform to support multiple hosts while preventing duplicate guest records within each host's account.

---

## Related APIs

- **Bookings API:** Create reservations for guests
- **Properties API:** Manage properties that guests can book
- **Payments API:** Track payments from guests
- **Tasks API:** Assign tasks related to guest arrivals and departures

---

## Integration Examples

### Guest Lifecycle in Booking System

```javascript
// 1. Guest contacts you
const newGuest = await fetch('/api/guests', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    name: "Sarah Williams",
    email: "sarah@example.com",
    phone: "+1234567893"
  })
});

// 2. Create booking for guest
const booking = await fetch('/api/bookings', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    guest_id: newGuest.id,
    property_id: "...",
    start_date: "2025-12-30",
    end_date: "2026-01-05",
    amount: 1500
  })
});

// 3. Create payment record
const payment = await fetch('/api/payments', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    bookingId: booking.id,
    amount: 1500,
    paymentMethod: "credit_card",
    status: "completed"
  })
});
```

---

## Future Enhancements

Potential features to consider:

### 1. Guest Notes/Preferences
Add a notes field to track guest preferences:
```javascript
{
  notes: "Prefers ground floor rooms. Allergic to pets.",
  preferences: {
    bedType: "king",
    floor: "ground",
    smoking: false
  }
}
```

### 2. Guest Search/Filter
```bash
GET /api/guests/search?query=sarah
GET /api/guests?email=sarah@example.com
GET /api/guests?phone=+1234567893
```

### 3. Guest Booking History
```bash
GET /api/guests/:id/bookings

# Response
{
  "guest": { ... },
  "bookings": [ ... ],
  "totalBookings": 5,
  "totalSpent": 7500,
  "lastBooking": "2025-12-30"
}
```

### 4. Guest Statistics
```bash
GET /api/guests/:id/stats

# Response
{
  "totalBookings": 5,
  "totalSpent": 7500,
  "averageStayDuration": 4.5,
  "favoriteProperty": { ... },
  "lastBookingDate": "2025-12-30"
}
```

### 5. Guest Loyalty/Rating
```javascript
{
  loyaltyTier: "gold",
  rating: 4.8,
  totalStays: 12,
  memberSince: "2024-01-15"
}
```

### 6. Guest Communication Log
```bash
GET /api/guests/:id/communications

# Track emails, messages, calls
[
  {
    type: "email",
    subject: "Booking Confirmation",
    date: "2025-12-25",
    content: "..."
  }
]
```

### 7. Guest Merge Feature
```bash
POST /api/guests/merge
{
  "sourceGuestId": "...",
  "targetGuestId": "...",
  "keepData": "target"
}
```

### 8. Guest Tags/Categories
```javascript
{
  tags: ["vip", "frequent", "corporate"],
  category: "business",
  source: "website"
}
```

### 9. Guest Verification
```javascript
{
  verified: true,
  verifiedEmail: true,
  verifiedPhone: true,
  identityVerified: true,
  verificationDate: "2025-01-15"
}
```

### 10. Bulk Guest Import
```bash
POST /api/guests/import
Content-Type: multipart/form-data

# Upload CSV with guest data
```

---

## Security Considerations

### Data Protection
1. **PII Handling:** Guest information contains personally identifiable information (PII)
2. **Access Control:** Strict multi-tenant isolation prevents cross-host data access
3. **Email Privacy:** Store emails securely and use for legitimate purposes only
4. **GDPR Compliance:** Support guest data export and deletion requests
5. **Audit Logs:** Consider logging access to guest records

### Best Practices
- Never share guest information between hosts
- Encrypt sensitive data at rest
- Use HTTPS for all API communications
- Implement rate limiting to prevent data scraping
- Regular security audits of guest data access

---

## Performance Tips

### Optimizing Guest Queries
1. **Pagination:** For large guest lists, implement pagination
```javascript
GET /api/guests?page=1&limit=50
```

2. **Search Indexes:** Email and name fields are indexed for fast searching
3. **Caching:** Cache frequently accessed guest records
4. **Populate Strategy:** Only populate hostId when needed

---

## Notes

1. **Multi-Tenant Isolation:** Each host can only see and manage their own guests
2. **Superadmin Access:** Superadmin can see and manage all guests across all hosts
3. **Auto-Assignment:** The `hostId` is automatically set based on the authenticated user
4. **Email Uniqueness:** Emails must be unique per host (not globally)
5. **Populated Objects:** Guests return with fully populated host objects
6. **Sorting:** Guests are returned sorted by creation date (newest first)
7. **Case Sensitivity:** Email addresses are stored in lowercase

---

## Summary

The Guests API provides complete CRUD operations for managing guest contacts with:
- ✅ Multi-tenant isolation (hosts see only their guests)
- ✅ Email uniqueness per host
- ✅ Comprehensive validation (email format, required fields)
- ✅ Populated host objects
- ✅ Integration with bookings and payments
- ✅ Superadmin platform-wide access
- ✅ Automatic lowercase email conversion
- ✅ Duplicate prevention within host accounts

---

## Quick Reference

| Method | Endpoint | Purpose | Auth Required |
|--------|----------|---------|---------------|
| GET | `/api/guests` | List all guests | ✅ Yes |
| GET | `/api/guests/:id` | Get single guest | ✅ Yes |
| POST | `/api/guests` | Create guest | ✅ Yes |
| PUT | `/api/guests/:id` | Update guest | ✅ Yes |
| DELETE | `/api/guests/:id` | Delete guest | ✅ Yes |


# Bookings API Documentation

## Overview
Complete API documentation for managing bookings in the Airbnb management system.

**Bookings are:**
- Reservations linking guests to properties for specific dates
- Include check-in and check-out dates
- Track rental amounts
- Belong to hosts (multi-tenant isolation)
- Core business records for revenue tracking

---

## Base URL
```
http://localhost:5001/api/bookings
```

## Authentication
All endpoints require authentication. Include the JWT token in the Authorization header:
```
Authorization: Bearer <your_token>` 
```

---

## Booking Model

```javascript
{
  "id": "string",
  "hostId": {                          // Populated host object
    "id": "string",
    "name": "string",
    "email": "string"
  },
  "property_id": {                     // Populated property object
    "id": "string",
    "title": "string",
    "location": "string",
    "price": number
  },
  "guest_id": {                        // Populated guest object
    "id": "string",
    "name": "string",
    "phone": "string",
    "email": "string"
  },
  "start_date": "date",                // Check-in date
  "end_date": "date",                  // Check-out date (must be after start_date)
  "amount": number,                    // Total booking amount (>= 0)
  "createdAt": "date",
  "updatedAt": "date"
}
```

---

## Endpoints

### 1. Get All Bookings
**GET** `/api/bookings`

**Access:** 
- Superadmin: Can see all bookings (across all hosts)
- Hosts: Can see only their bookings
- Host Staff: Can see their host's bookings (based on permissions)

Get a list of bookings filtered by access level.

**Query Parameters (Optional):**
- `period` - Filter by time period: `today`, `week`, `15days`, `month`, `6months`, `year`
- `startDate` - Filter bookings from this date (YYYY-MM-DD)
- `endDate` - Filter bookings until this date (YYYY-MM-DD)

**Examples:**
```
GET /api/bookings                           # All bookings
GET /api/bookings?period=week               # Last 7 days
GET /api/bookings?period=month              # Last 30 days
GET /api/bookings?startDate=2025-12-01&endDate=2025-12-31  # Custom range
```

**Response:**
```json
[
  {
    "id": "694c39579553cc06d11f0eb8",
    "hostId": {
      "id": "694c39579553cc06d11f0eb3",
      "name": "John Doe",
      "email": "john@example.com"
    },
    "property_id": {
      "id": "694c39579553cc06d11f0eb7",
      "title": "Beautiful Beach House",
      "location": "123 Ocean Drive, Miami, FL",
      "price": 250
    },
    "guest_id": {
      "id": "694c39579553cc06d11f0eb6",
      "name": "Sarah Williams",
      "phone": "+1234567893",
      "email": "sarah@example.com"
    },
    "start_date": "2025-12-30T00:00:00.000Z",
    "end_date": "2026-01-05T00:00:00.000Z",
    "amount": 1500,
    "createdAt": "2025-12-24T20:00:00.000Z",
    "updatedAt": "2025-12-24T20:00:00.000Z"
  }
]
```

---

### 2. Get Single Booking
**GET** `/api/bookings/:id`

**Access:** 
- Superadmin: Can see any booking
- Hosts: Can see only their bookings
- Host Staff: Can see their host's bookings (based on permissions)

Get detailed information about a specific booking.

**Response:**
```json
{
  "id": "694c39579553cc06d11f0eb8",
  "hostId": {
    "id": "694c39579553cc06d11f0eb3",
    "name": "John Doe",
    "email": "john@example.com"
  },
  "property_id": {
    "id": "694c39579553cc06d11f0eb7",
    "title": "Beautiful Beach House",
    "location": "123 Ocean Drive, Miami, FL",
    "price": 250
  },
  "guest_id": {
    "id": "694c39579553cc06d11f0eb6",
    "name": "Sarah Williams",
    "phone": "+1234567893",
    "email": "sarah@example.com"
  },
  "start_date": "2025-12-30T00:00:00.000Z",
  "end_date": "2026-01-05T00:00:00.000Z",
  "amount": 1500,
  "createdAt": "2025-12-24T20:00:00.000Z",
  "updatedAt": "2025-12-24T20:00:00.000Z"
}
```

---

### 3. Create Booking
**POST** `/api/bookings`

**Access:** 
- Superadmin: Can create bookings for any host
- Hosts: Can create bookings for their properties
- Host Staff: Can create bookings (based on permissions)

Create a new booking reservation.

**Request Body:**
```json
{
  "property_id": "694c39579553cc06d11f0eb7",
  "guest_id": "694c39579553cc06d11f0eb6",
  "start_date": "2025-12-30",
  "end_date": "2026-01-05",
  "amount": 1500
}
```

**Required Fields:**
- `property_id` (string, valid Property ObjectId)
- `guest_id` (string, valid Guest ObjectId)
- `start_date` (string, date format: YYYY-MM-DD)
- `end_date` (string, date format: YYYY-MM-DD, must be after start_date)
- `amount` (number, >= 0)

**Validations:**
- Property must exist and belong to the host
- Guest must exist and belong to the host
- End date must be after start date
- Amount must be positive

**Note:** The `hostId` is automatically set based on the authenticated user.

**Response:**
```json
{
  "id": "694c39579553cc06d11f0eb8",
  "hostId": {
    "id": "694c39579553cc06d11f0eb3",
    "name": "John Doe",
    "email": "john@example.com"
  },
  "property_id": {
    "id": "694c39579553cc06d11f0eb7",
    "title": "Beautiful Beach House",
    "location": "123 Ocean Drive, Miami, FL",
    "price": 250
  },
  "guest_id": {
    "id": "694c39579553cc06d11f0eb6",
    "name": "Sarah Williams",
    "phone": "+1234567893",
    "email": "sarah@example.com"
  },
  "start_date": "2025-12-30T00:00:00.000Z",
  "end_date": "2026-01-05T00:00:00.000Z",
  "amount": 1500,
  "createdAt": "2025-12-24T20:00:00.000Z",
  "updatedAt": "2025-12-24T20:00:00.000Z"
}
```

---

### 4. Update Booking
**PUT** `/api/bookings/:id`

**Access:** 
- Superadmin: Can update any booking
- Hosts: Can update only their bookings
- Host Staff: Can update their host's bookings (based on permissions)

Update booking information.

**Request Body:**
```json
{
  "start_date": "2025-12-31",
  "end_date": "2026-01-06",
  "amount": 1650
}
```

**Note:** All fields are optional. Only provide fields you want to update.

**Validations:**
- If updating property_id, property must exist
- If updating guest_id, guest must exist
- If updating dates, end_date must be after start_date
- If updating amount, it must be >= 0

**Response:**
```json
{
  "id": "694c39579553cc06d11f0eb8",
  "hostId": {
    "id": "694c39579553cc06d11f0eb3",
    "name": "John Doe",
    "email": "john@example.com"
  },
  "property_id": {
    "id": "694c39579553cc06d11f0eb7",
    "title": "Beautiful Beach House",
    "location": "123 Ocean Drive, Miami, FL",
    "price": 250
  },
  "guest_id": {
    "id": "694c39579553cc06d11f0eb6",
    "name": "Sarah Williams",
    "phone": "+1234567893",
    "email": "sarah@example.com"
  },
  "start_date": "2025-12-31T00:00:00.000Z",
  "end_date": "2026-01-06T00:00:00.000Z",
  "amount": 1650,
  "createdAt": "2025-12-24T20:00:00.000Z",
  "updatedAt": "2025-12-25T10:30:00.000Z"
}
```

---

### 5. Delete Booking
**DELETE** `/api/bookings/:id`

**Access:** 
- Superadmin: Can delete any booking
- Hosts: Can delete only their bookings
- Host Staff: Can delete their host's bookings (based on permissions)

Delete a booking reservation.

**Note:** Consider business implications before deleting bookings. You may want to implement a "cancelled" status instead.

**Response:**
```json
{
  "message": "Booking deleted successfully"
}
```

---

## Error Responses

### 400 Bad Request
```json
{
  "error": "property_id, guest_id, start_date, end_date, and amount are required"
}
```

```json
{
  "error": "Amount must be a positive number"
}
```

```json
{
  "error": "Invalid start_date format"
}
```

```json
{
  "error": "Invalid end_date format"
}
```

```json
{
  "error": "End date must be after start date"
}
```

```json
{
  "error": "Invalid property_id"
}
```

```json
{
  "error": "Invalid guest_id"
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
  "error": "Booking not found"
}
```

```json
{
  "error": "Property not found"
}
```

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

### Example 1: Create Booking (Host)
```bash
curl -X POST http://localhost:5001/api/bookings \
  -H "Authorization: Bearer <host_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "property_id": "694c39579553cc06d11f0eb7",
    "guest_id": "694c39579553cc06d11f0eb6",
    "start_date": "2025-12-30",
    "end_date": "2026-01-05",
    "amount": 1500
  }'
```

### Example 2: Get All Bookings (Host)
```bash
curl -X GET http://localhost:5001/api/bookings \
  -H "Authorization: Bearer <host_token>"
```

### Example 3: Get Bookings for This Month
```bash
curl -X GET "http://localhost:5001/api/bookings?period=month" \
  -H "Authorization: Bearer <host_token>"
```

### Example 4: Get Bookings for Custom Date Range
```bash
curl -X GET "http://localhost:5001/api/bookings?startDate=2025-12-01&endDate=2025-12-31" \
  -H "Authorization: Bearer <host_token>"
```

### Example 5: Get Single Booking
```bash
curl -X GET http://localhost:5001/api/bookings/694c39579553cc06d11f0eb8 \
  -H "Authorization: Bearer <host_token>"
```

### Example 6: Update Booking Dates
```bash
curl -X PUT http://localhost:5001/api/bookings/694c39579553cc06d11f0eb8 \
  -H "Authorization: Bearer <host_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "start_date": "2025-12-31",
    "end_date": "2026-01-06",
    "amount": 1650
  }'
```

### Example 7: Delete Booking
```bash
curl -X DELETE http://localhost:5001/api/bookings/694c39579553cc06d11f0eb8 \
  -H "Authorization: Bearer <host_token>"
```

---

## Access Control Summary

| Action | Superadmin | Host | Host Staff |
|--------|------------|------|------------|
| **List Bookings** | All bookings | Own bookings | Host's bookings |
| **View Booking** | Any booking | Own bookings | Host's bookings |
| **Create Booking** | ✅ Yes | ✅ Yes | ⚠️ If permitted |
| **Update Booking** | Any booking | Own bookings | ⚠️ If permitted |
| **Delete Booking** | Any booking | Own bookings | ⚠️ If permitted |
| **Filter by Date** | ✅ Yes | ✅ Yes | ✅ Yes |

---

## Filtering by Date Period

### Available Periods

| Period | Description | Calculation |
|--------|-------------|-------------|
| `today` | Today's bookings | From 00:00:00 today |
| `week` | Last 7 days | Current date - 7 days |
| `15days` | Last 15 days | Current date - 15 days |
| `month` | Last 30 days | Current date - 1 month |
| `6months` | Last 6 months | Current date - 6 months |
| `year` | Last 12 months | Current date - 1 year |

### Custom Date Range
```
GET /api/bookings?startDate=2025-01-01&endDate=2025-12-31
```

---

## Complete Booking Workflow

### Step 1: Create Guest (if new)
```bash
POST /api/guests
{
  "name": "Sarah Williams",
  "email": "sarah@example.com",
  "phone": "+1234567893"
}
# Returns: { id: "694c39579553cc06d11f0eb6", ... }
```

### Step 2: Create Property (if new)
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

### Step 3: Create Booking
```bash
POST /api/bookings
{
  "property_id": "694c39579553cc06d11f0eb7",
  "guest_id": "694c39579553cc06d11f0eb6",
  "start_date": "2025-12-30",
  "end_date": "2026-01-05",
  "amount": 1500
}
# Returns: Complete booking with populated property and guest
```

### Step 4: Optionally Update Property Status
```bash
PUT /api/properties/694c39579553cc06d11f0eb7
{
  "status": "rented"
}
```

### Step 5: Create Payment Record
```bash
POST /api/payments
{
  "bookingId": "694c39579553cc06d11f0eb8",
  "amount": 1500,
  "paymentMethod": "credit_card",
  "status": "completed"
}
```

---

## Calculating Booking Amount

The `amount` field should be calculated based on:
- Property price per night
- Number of nights
- Any additional fees or discounts

### Example Calculation
```javascript
const property = { price: 250 };  // $250 per night
const start_date = new Date('2025-12-30');
const end_date = new Date('2026-01-05');

// Calculate number of nights
const nights = Math.ceil((end_date - start_date) / (1000 * 60 * 60 * 24));
// nights = 6

// Calculate total amount
const amount = nights * property.price;
// amount = 1500

// Create booking
POST /api/bookings
{
  "property_id": "...",
  "guest_id": "...",
  "start_date": "2025-12-30",
  "end_date": "2026-01-05",
  "amount": 1500
}
```

---

## Common Scenarios

### Scenario 1: Guest Books a Property
```javascript
// Host receives booking request
POST /api/bookings
{
  "property_id": "694c39579553cc06d11f0eb7",
  "guest_id": "694c39579553cc06d11f0eb6",
  "start_date": "2025-12-30",
  "end_date": "2026-01-05",
  "amount": 1500
}
```

### Scenario 2: Guest Extends Stay
```javascript
// Update end date and amount
PUT /api/bookings/694c39579553cc06d11f0eb8
{
  "end_date": "2026-01-07",
  "amount": 2000
}
```

### Scenario 3: Booking Cancelled
```javascript
// Delete booking
DELETE /api/bookings/694c39579553cc06d11f0eb8

// Or consider implementing status field instead
// PUT /api/bookings/694c39579553cc06d11f0eb8
// { "status": "cancelled" }
```

### Scenario 4: View This Month's Revenue
```javascript
// Get all bookings for the month
GET /api/bookings?period=month

// Calculate total revenue
const totalRevenue = bookings.reduce((sum, booking) => sum + booking.amount, 0);
```

### Scenario 5: Check Property Availability
```javascript
// Get all bookings for a property
GET /api/bookings
// Filter by property_id in frontend

// Check if dates overlap with existing bookings
function isAvailable(requestedStart, requestedEnd, bookings) {
  return !bookings.some(booking => {
    const start = new Date(booking.start_date);
    const end = new Date(booking.end_date);
    
    return (requestedStart >= start && requestedStart < end) ||
           (requestedEnd > start && requestedEnd <= end) ||
           (requestedStart <= start && requestedEnd >= end);
  });
}
```

---

## Best Practices

### Creating Bookings
1. **Validate Availability:** Check for overlapping bookings before creating
2. **Calculate Amount:** Accurately calculate total based on dates and price
3. **Verify Guest Info:** Ensure guest contact information is up to date
4. **Property Status:** Consider updating property status to "rented"
5. **Payment Record:** Create corresponding payment record

### Managing Bookings
1. **Date Validation:** Always ensure end_date > start_date
2. **Guest Communication:** Notify guests of booking confirmations and changes
3. **Property Updates:** Keep property status in sync with bookings
4. **Payment Tracking:** Link bookings to payment records
5. **Cancellation Policy:** Implement clear cancellation procedures

### Deleting Bookings
1. **Check Dates:** Don't delete past bookings for historical records
2. **Payment Status:** Check if refunds are needed
3. **Property Status:** Update property back to "available" if needed
4. **Guest Notification:** Inform guests of cancellations
5. **Audit Trail:** Consider soft delete (status: "cancelled") instead

---

## Validation Rules

| Field | Rule | Error Message |
|-------|------|---------------|
| property_id | Required, valid ObjectId | "Property not found" |
| guest_id | Required, valid ObjectId | "Guest not found" |
| start_date | Required, valid date | "Invalid start_date format" |
| end_date | Required, valid date, > start_date | "End date must be after start date" |
| amount | Required, >= 0 | "Amount must be a positive number" |

---

## Related APIs

- **Properties API:** Manage properties available for booking
- **Guests API:** Manage guest contact information
- **Payments API:** Track payments for bookings
- **Tasks API:** Assign tasks related to bookings (cleaning, check-in, etc.)

---

## Future Enhancements

Potential features to consider:

### 1. Booking Status
Add a status field to track booking lifecycle:
```javascript
status: ['pending', 'confirmed', 'checked_in', 'checked_out', 'cancelled']
```

### 2. Availability Check Endpoint
```bash
GET /api/properties/:id/availability?start_date=2025-12-30&end_date=2026-01-05
```

### 3. Booking Statistics
```bash
GET /api/bookings/stats

# Response
{
  "totalBookings": 125,
  "totalRevenue": 50000,
  "averageBookingValue": 400,
  "occupancyRate": 75,
  "upcomingBookings": 15,
  "completedBookings": 110
}
```

### 4. Guest Booking History
```bash
GET /api/guests/:id/bookings
```

### 5. Property Booking History
```bash
GET /api/properties/:id/bookings
```

### 6. Conflict Detection
Automatically detect and prevent overlapping bookings for the same property.

### 7. Pricing Calculator
```bash
POST /api/bookings/calculate-price
{
  "property_id": "...",
  "start_date": "2025-12-30",
  "end_date": "2026-01-05"
}
```

### 8. Booking Notifications
Automatic email/SMS notifications for:
- Booking confirmation
- Check-in reminders
- Check-out reminders
- Booking modifications
- Cancellations

---

## Notes

1. **Multi-Tenant Isolation:** Each host can only see and manage their own bookings
2. **Superadmin Access:** Superadmin can see and manage all bookings across all hosts
3. **Auto-Assignment:** The `hostId` is automatically set based on the authenticated user
4. **Date Validation:** System enforces that end_date must be after start_date
5. **Populated Objects:** Bookings return with fully populated property, guest, and host objects
6. **Filtering Support:** Built-in support for date range filtering
7. **Revenue Tracking:** Core component for business analytics and reporting

---

## Summary

The Bookings API provides complete CRUD operations for managing property reservations with:
- ✅ Multi-tenant isolation (hosts see only their bookings)
- ✅ Date range filtering for analytics
- ✅ Comprehensive validation
- ✅ Populated property and guest objects
- ✅ Integration with properties, guests, and payments
- ✅ Superadmin platform-wide access
- ✅ Built-in date validation


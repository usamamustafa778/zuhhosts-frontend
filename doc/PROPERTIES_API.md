# Properties API Documentation

## Overview
Complete API documentation for managing properties in the Airbnb management system.

**Properties are:**
- Rental listings (houses, apartments, villas, etc.)
- Owned by hosts
- Can be available, sold, or rented
- Used for creating bookings

---

## Base URL
```
http://localhost:5001/api/properties
```

## Authentication
All endpoints require authentication. Include the JWT token in the Authorization header:
```
Authorization: Bearer <your_token>
```

---

## Property Model

```javascript
{
  "id": "string",
  "hostId": {                          // Populated host object
    "id": "string",
    "name": "string",
    "email": "string"
  },
  "title": "string",                   // Min 3 characters
  "description": "string",             // Min 10 characters
  "price": number,                     // Per night/month (>= 0)
  "location": "string",                // Address/location
  "propertyType": "string",            // house, apartment, villa, land, commercial
  "bedrooms": number,                  // Number of bedrooms (>= 0)
  "bathrooms": number,                 // Number of bathrooms (>= 0)
  "area": number,                      // Area in sq ft/m (>= 0)
  "status": "string",                  // available, sold, rented
  "createdAt": "date",
  "updatedAt": "date"
}
```

### Property Types
- `house` - Single family house (default)
- `apartment` - Apartment/flat
- `villa` - Luxury villa
- `land` - Land/plot
- `commercial` - Commercial property

### Property Statuses
- `available` - Available for rent/sale (default)
- `sold` - Property has been sold
- `rented` - Property is currently rented

---

## Endpoints

### 1. Get All Properties
**GET** `/api/properties`

**Access:** 
- Superadmin: Can see all properties (across all hosts)
- Hosts: Can see only their properties
- Host Staff: Can see their host's properties (based on permissions)

Get a list of properties filtered by access level.

**Response:**
```json
[
  {
    "id": "694c39579553cc06d11f0eb7",
    "hostId": {
      "id": "694c39579553cc06d11f0eb3",
      "name": "John Doe",
      "email": "john@example.com"
    },
    "title": "Beautiful Beach House",
    "description": "Stunning 3-bedroom beach house with ocean views",
    "price": 250,
    "location": "123 Ocean Drive, Miami, FL",
    "propertyType": "house",
    "bedrooms": 3,
    "bathrooms": 2,
    "area": 2000,
    "status": "available",
    "createdAt": "2025-12-24T20:00:00.000Z",
    "updatedAt": "2025-12-24T20:00:00.000Z"
  }
]
```

---

### 2. Get Single Property
**GET** `/api/properties/:id`

**Access:** 
- Superadmin: Can see any property
- Hosts: Can see only their properties
- Host Staff: Can see their host's properties (based on permissions)

Get detailed information about a specific property.

**Response:**
```json
{
  "id": "694c39579553cc06d11f0eb7",
  "hostId": {
    "id": "694c39579553cc06d11f0eb3",
    "name": "John Doe",
    "email": "john@example.com"
  },
  "title": "Beautiful Beach House",
  "description": "Stunning 3-bedroom beach house with ocean views. Features include modern kitchen, spacious living areas, and private beach access.",
  "price": 250,
  "location": "123 Ocean Drive, Miami, FL",
  "propertyType": "house",
  "bedrooms": 3,
  "bathrooms": 2,
  "area": 2000,
  "status": "available",
  "createdAt": "2025-12-24T20:00:00.000Z",
  "updatedAt": "2025-12-24T20:00:00.000Z"
}
```

---

### 3. Create Property
**POST** `/api/properties`

**Access:** 
- Superadmin: Can create properties for any host
- Hosts: Can create properties for themselves
- Host Staff: Can create properties (based on permissions)

Create a new property listing.

**Request Body:**
```json
{
  "title": "Beautiful Beach House",
  "description": "Stunning 3-bedroom beach house with ocean views",
  "price": 250,
  "location": "123 Ocean Drive, Miami, FL",
  "propertyType": "house",
  "bedrooms": 3,
  "bathrooms": 2,
  "area": 2000,
  "status": "available"
}
```

**Required Fields:**
- `title` (string, min 3 characters)
- `description` (string, min 10 characters)
- `price` (number, >= 0)
- `location` (string)
- `area` (number, >= 0)

**Optional Fields:**
- `propertyType` (string, enum: house, apartment, villa, land, commercial) - Default: `house`
- `bedrooms` (number, >= 0) - Default: `0`
- `bathrooms` (number, >= 0) - Default: `0`
- `status` (string, enum: available, sold, rented) - Default: `available`

**Note:** The `hostId` is automatically set based on the authenticated user (host or their staff).

**Response:**
```json
{
  "id": "694c39579553cc06d11f0eb7",
  "hostId": "694c39579553cc06d11f0eb3",
  "title": "Beautiful Beach House",
  "description": "Stunning 3-bedroom beach house with ocean views",
  "price": 250,
  "location": "123 Ocean Drive, Miami, FL",
  "propertyType": "house",
  "bedrooms": 3,
  "bathrooms": 2,
  "area": 2000,
  "status": "available",
  "createdAt": "2025-12-24T20:00:00.000Z",
  "updatedAt": "2025-12-24T20:00:00.000Z"
}
```

---

### 4. Update Property
**PUT** `/api/properties/:id`

**Access:** 
- Superadmin: Can update any property
- Hosts: Can update only their properties
- Host Staff: Can update their host's properties (based on permissions)

Update property information.

**Request Body:**
```json
{
  "title": "Beautiful Beach House - Updated",
  "price": 275,
  "bedrooms": 4,
  "status": "rented"
}
```

**Note:** All fields are optional. Only provide fields you want to update.

**Response:**
```json
{
  "id": "694c39579553cc06d11f0eb7",
  "hostId": {
    "id": "694c39579553cc06d11f0eb3",
    "name": "John Doe",
    "email": "john@example.com"
  },
  "title": "Beautiful Beach House - Updated",
  "description": "Stunning 3-bedroom beach house with ocean views",
  "price": 275,
  "location": "123 Ocean Drive, Miami, FL",
  "propertyType": "house",
  "bedrooms": 4,
  "bathrooms": 2,
  "area": 2000,
  "status": "rented",
  "createdAt": "2025-12-24T20:00:00.000Z",
  "updatedAt": "2025-12-25T10:30:00.000Z"
}
```

---

### 5. Delete Property
**DELETE** `/api/properties/:id`

**Access:** 
- Superadmin: Can delete any property
- Hosts: Can delete only their properties
- Host Staff: Can delete their host's properties (based on permissions)

Delete a property listing.

**Note:** Consider the implications of deleting properties with existing bookings.

**Response:**
```json
{
  "message": "Property deleted successfully"
}
```

---

## Error Responses

### 400 Bad Request
```json
{
  "error": "Title, description, price, location, and area are required"
}
```

```json
{
  "error": "Price must be a positive number"
}
```

```json
{
  "error": "Area must be a positive number"
}
```

```json
{
  "error": "Invalid property type. Must be one of: house, apartment, villa, land, commercial"
}
```

```json
{
  "error": "Invalid status. Must be one of: available, sold, rented"
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
  "error": "Property not found"
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

### Example 1: Create Property (Host)
```bash
curl -X POST http://localhost:5001/api/properties \
  -H "Authorization: Bearer <host_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Beautiful Beach House",
    "description": "Stunning 3-bedroom beach house with ocean views",
    "price": 250,
    "location": "123 Ocean Drive, Miami, FL",
    "propertyType": "house",
    "bedrooms": 3,
    "bathrooms": 2,
    "area": 2000
  }'
```

### Example 2: Get All Properties (Host)
```bash
curl -X GET http://localhost:5001/api/properties \
  -H "Authorization: Bearer <host_token>"
```

### Example 3: Get Single Property
```bash
curl -X GET http://localhost:5001/api/properties/694c39579553cc06d11f0eb7 \
  -H "Authorization: Bearer <host_token>"
```

### Example 4: Update Property Status
```bash
curl -X PUT http://localhost:5001/api/properties/694c39579553cc06d11f0eb7 \
  -H "Authorization: Bearer <host_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "rented",
    "price": 275
  }'
```

### Example 5: Delete Property
```bash
curl -X DELETE http://localhost:5001/api/properties/694c39579553cc06d11f0eb7 \
  -H "Authorization: Bearer <host_token>"
```

---

## Access Control Summary

| Action | Superadmin | Host | Host Staff |
|--------|------------|------|------------|
| **List Properties** | All properties | Own properties | Host's properties |
| **View Property** | Any property | Own properties | Host's properties |
| **Create Property** | ✅ Yes | ✅ Yes | ⚠️ If permitted |
| **Update Property** | Any property | Own properties | ⚠️ If permitted |
| **Delete Property** | Any property | Own properties | ⚠️ If permitted |

---

## Notes

1. **Multi-Tenant Isolation:** Each host can only see and manage their own properties
2. **Superadmin Access:** Superadmin can see and manage all properties across all hosts
3. **Auto-Assignment:** The `hostId` is automatically set based on the authenticated user
4. **Property Types:** Choose from 5 predefined property types
5. **Status Management:** Track whether properties are available, sold, or rented
6. **Validation:** Price and area must be positive numbers
7. **Flexible Updates:** Update any field independently
8. **Booking Integration:** Properties are linked to bookings via the Booking model

---

## Property Status Workflow

### Typical Status Flow
```
available → rented → available
available → sold
```

### Status Meanings
- **available**: Property is ready for new bookings
- **rented**: Property is currently occupied (existing booking)
- **sold**: Property has been sold and is no longer available for rent

---

## Integration with Bookings

### Creating a Booking for a Property
First, ensure the property exists and is available:

```bash
# Get property
GET /api/properties/694c39579553cc06d11f0eb7

# Response shows status: "available"
```

Then create a booking:
```bash
POST /api/bookings
{
  "propertyId": "694c39579553cc06d11f0eb7",
  "guestId": "694c39579553cc06d11f0eb6",
  "checkIn": "2025-12-30",
  "checkOut": "2026-01-05",
  "numberOfGuests": 4,
  "totalAmount": 1500
}
```

Optionally update property status:
```bash
PUT /api/properties/694c39579553cc06d11f0eb7
{
  "status": "rented"
}
```

---

## Filtering & Search (Future Enhancements)

Potential features to consider:

1. **Filter by Property Type:**
   ```
   GET /api/properties?propertyType=apartment
   ```

2. **Filter by Status:**
   ```
   GET /api/properties?status=available
   ```

3. **Filter by Price Range:**
   ```
   GET /api/properties?minPrice=100&maxPrice=300
   ```

4. **Filter by Location:**
   ```
   GET /api/properties?location=Miami
   ```

5. **Filter by Bedrooms/Bathrooms:**
   ```
   GET /api/properties?bedrooms=3&bathrooms=2
   ```

6. **Sort Options:**
   ```
   GET /api/properties?sortBy=price&order=asc
   ```

7. **Pagination:**
   ```
   GET /api/properties?page=1&limit=10
   ```

8. **Search:**
   ```
   GET /api/properties?search=beach house
   ```

---

## Property Statistics (Future Enhancement)

Example endpoint for property statistics:

```bash
GET /api/properties/:id/stats

# Response
{
  "property": { /* property details */ },
  "stats": {
    "totalBookings": 25,
    "totalRevenue": 6250,
    "averageRating": 4.5,
    "occupancyRate": 75,
    "upcomingBookings": 3,
    "completedBookings": 22
  }
}
```

---

## Best Practices

### Creating Properties
1. **Descriptive Titles:** Use clear, descriptive titles that include key features
2. **Detailed Descriptions:** Include all important information (amenities, rules, etc.)
3. **Accurate Pricing:** Set competitive pricing based on market rates
4. **Complete Information:** Fill in all relevant fields (bedrooms, bathrooms, area)
5. **Status Updates:** Keep property status current

### Managing Properties
1. **Regular Updates:** Update property information when changes occur
2. **Status Management:** Update status when properties are rented or sold
3. **Pricing Adjustments:** Adjust prices based on seasonality and demand
4. **Property Maintenance:** Mark properties as unavailable during maintenance

### Deleting Properties
1. **Check Bookings:** Ensure no active or upcoming bookings exist
2. **Archive Option:** Consider archiving instead of deleting for historical records
3. **Backup Data:** Export property data before deletion if needed

---

## Common Scenarios

### Scenario 1: Listing a New Property
```javascript
// Host adds a new property to their portfolio
POST /api/properties
{
  "title": "Cozy Downtown Apartment",
  "description": "Modern 2-bedroom apartment in the heart of downtown",
  "price": 150,
  "location": "456 Main St, Downtown",
  "propertyType": "apartment",
  "bedrooms": 2,
  "bathrooms": 1,
  "area": 1000
}
```

### Scenario 2: Updating Property After Renovation
```javascript
// Host updates property after adding a bedroom
PUT /api/properties/694c39579553cc06d11f0eb7
{
  "title": "Beautiful Beach House - Newly Renovated",
  "bedrooms": 4,
  "bathrooms": 3,
  "price": 300,
  "description": "Recently renovated 4-bedroom beach house..."
}
```

### Scenario 3: Marking Property as Rented
```javascript
// After a booking is confirmed
PUT /api/properties/694c39579553cc06d11f0eb7
{
  "status": "rented"
}
```

### Scenario 4: Property Sold
```javascript
// When property is sold
PUT /api/properties/694c39579553cc06d11f0eb7
{
  "status": "sold"
}
```

---

## Validation Rules

| Field | Rule | Error Message |
|-------|------|---------------|
| title | Required, min 3 chars | "Title is required" |
| description | Required, min 10 chars | "Description is required" |
| price | Required, >= 0 | "Price must be a positive number" |
| location | Required | "Location is required" |
| area | Required, >= 0 | "Area must be a positive number" |
| propertyType | Enum: house, apartment, villa, land, commercial | "Invalid property type" |
| status | Enum: available, sold, rented | "Invalid status" |
| bedrooms | >= 0 | Auto-validated by schema |
| bathrooms | >= 0 | Auto-validated by schema |

---

## Related APIs

- **Bookings API:** Create bookings for properties
- **Payments API:** Track payments related to property bookings
- **Guests API:** Manage guests who book properties
- **Tasks API:** Assign maintenance tasks for properties

---

## Summary

The Properties API provides complete CRUD operations for managing rental properties with:
- ✅ Multi-tenant isolation (hosts see only their properties)
- ✅ Flexible property types and statuses
- ✅ Automatic host assignment
- ✅ Comprehensive validation
- ✅ Integration with bookings system
- ✅ Superadmin platform-wide access


# Backend: Property Module — Complete API Specification

> **Purpose**: This is the single source of truth for the backend agent to update the Property module. It covers every endpoint, every field, every model, and every edge case the frontend depends on.

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Property Model — Full Schema](#2-property-model--full-schema)
3. [Room Type Model (NEW)](#3-room-type-model-new)
4. [Room Model — Updates](#4-room-model--updates)
5. [Unit Model — No Changes](#5-unit-model--no-changes)
6. [Complete API Endpoint Reference](#6-complete-api-endpoint-reference)
7. [Amenity Values Reference](#7-amenity-values-reference)
8. [Validation Rules](#8-validation-rules)
9. [API Response Examples](#9-api-response-examples)
10. [Public API Endpoints](#10-public-api-endpoints)
11. [Frontend API Client Reference](#11-frontend-api-client-reference)
12. [Migration Checklist](#12-migration-checklist)
13. [Backward Compatibility](#13-backward-compatibility)

---

## 1. Architecture Overview

The system supports two property models:

```
┌─────────────────────────────────────────────────────────────────┐
│                        PROPERTY                                 │
│  modelType: "hotel" | "airbnb"                                  │
│                                                                 │
│  Shared: title, description, location, address, amenities,      │
│          images, status, isPubliclyVisible, currency             │
│                                                                 │
│  ┌──────────────────────┐    ┌──────────────────────────────┐  │
│  │   HOTEL model        │    │   AIRBNB model               │  │
│  │                      │    │                              │  │
│  │  starRating          │    │  placeType (apartment, etc)  │  │
│  │  checkInTime         │    │  guestPlaceType              │  │
│  │  checkOutTime        │    │  maxGuests, beds             │  │
│  │  smokingPolicy       │    │  price (base nightly)        │  │
│  │  petPolicy           │    │  weekendPremiumPercent       │  │
│  │  cancellationPolicy  │    │  discounts {}                │  │
│  │                      │    │  safetyFeatures {}           │  │
│  │  ┌────────────────┐  │    │  highlights []               │  │
│  │  │  RoomType (N)  │  │    │                              │  │
│  │  │  ├─ name       │  │    │  ┌────────────────┐          │  │
│  │  │  ├─ bedType    │  │    │  │  Unit (N)      │          │  │
│  │  │  ├─ price      │  │    │  │  (optional)    │          │  │
│  │  │  ├─ inventory  │  │    │  └────────────────┘          │  │
│  │  │  └─► Room (N)  │  │    │                              │  │
│  │  └────────────────┘  │    └──────────────────────────────┘  │
│  └──────────────────────┘                                       │
└─────────────────────────────────────────────────────────────────┘
```

**Key concept**: Hotels sell **Room Types** (categories like "Deluxe King" with 12 rooms), not individual rooms. The backend should support creating room types that auto-generate inventory.

---

## 2. Property Model — Full Schema

Every field the frontend reads or writes. Fields marked `NEW` do not exist in the current backend.

```js
{
  // ─── Identity ──────────────────────────────────────────────
  _id:                  ObjectId,     // auto-generated
  tenant:               ObjectId,     // ref → Tenant, auto from auth
  createdBy:            ObjectId,     // ref → User, auto from auth
  createdAt:            Date,
  updatedAt:            Date,

  // ─── Core (shared) ────────────────────────────────────────
  title:                String,       // required, min 3, max 100
  description:          String,       // optional, max 500
  location:             String,       // required (city/region)
  address:              String,       // optional (full street address)
  modelType:            String,       // required: "hotel" | "airbnb"
  propertyType:         String,       // "hotel" | "apartment" | "house" | "villa" | etc.
  images:               [String],     // array of image paths/URLs
  amenities:            [String],     // free-form string array
  status:               String,       // "available" | "unavailable" | "maintenance"
  isPubliclyVisible:    Boolean,      // default false
  currency:             String,       // default "USD"

  // ─── Dimensions (shared, optional) ────────────────────────
  bedrooms:             Number,       // optional
  bathrooms:            Number,       // optional
  area:                 Number,       // sq ft, optional

  // ─── Airbnb-specific ──────────────────────────────────────
  placeType:            String,       // NEW — "apartment" | "house" | "villa" | "cabin" | etc.
  guestPlaceType:       String,       // NEW — "entire_place" | "room" | "shared_room"
  maxGuests:            Number,       // NEW — min 1
  beds:                 Number,       // NEW — min 0
  price:                Number,       // base nightly rate (airbnb); 0 for hotel
  weekendPremiumPercent: Number,      // NEW — 0–99, default 0
  discounts: {                        // NEW — all default false
    newListing:         Boolean,      // 20% off first 3 bookings
    lastMinute:         Boolean,      // discount for bookings ≤14 days out
    weekly:             Boolean,      // 10% off for 7+ nights
    monthly:            Boolean,      // 20% off for 28+ nights
  },
  safetyFeatures: {                   // NEW — all default false
    exteriorCamera:     Boolean,
    noiseMonitor:       Boolean,
    weapons:            Boolean,
  },
  highlights:           [String],     // NEW — max 2 items, e.g. ["Peaceful", "Spacious"]

  // ─── Hotel-specific ───────────────────────────────────────
  starRating:           Number,       // 1–5, optional
  checkInTime:          String,       // NEW — "HH:mm" format, default "14:00"
  checkOutTime:         String,       // NEW — "HH:mm" format, default "11:00"
  smokingPolicy:        String,       // NEW — "no_smoking" | "designated_areas" | "allowed"
  petPolicy:            String,       // NEW — "no_pets" | "pets_allowed" | "on_request"
  cancellationPolicy:   String,       // NEW — "flexible" | "moderate" | "strict" | "non_refundable"
}
```

---

## 3. Room Type Model (NEW)

**This is a new model/collection**. It replaces the pattern of adding rooms one-by-one.

### Schema

```js
{
  _id:            ObjectId,
  property:       ObjectId,     // ref → Property, required
  tenant:         ObjectId,     // ref → Tenant, auto from auth
  name:           String,       // required — "Deluxe King", "Standard Twin"
  bedType:        String,       // "King" | "Queen" | "Twin" | "Double" | "Single" | "Bunk"
  bedCount:       Number,       // default 1
  maxOccupancy:   Number,       // default 2
  size:           Number,       // sq ft, optional
  price:          Number,       // required, nightly rate
  inventory:      Number,       // required, how many rooms of this type
  amenities:      [String],     // room-level amenities (see section 7.3)
  images:         [String],     // optional, room-type-specific photos (future use)
  createdAt:      Date,
  updatedAt:      Date,
}
```

### Behavior

When a `RoomType` is created, the backend should auto-generate `inventory` number of individual `Room` documents:

```
RoomType { name: "Deluxe King", inventory: 5 }
  → Room { roomNumber: "Deluxe King-1", roomType: "Deluxe King", roomTypeId: <rtId>, ... }
  → Room { roomNumber: "Deluxe King-2", ... }
  → Room { roomNumber: "Deluxe King-3", ... }
  → Room { roomNumber: "Deluxe King-4", ... }
  → Room { roomNumber: "Deluxe King-5", ... }
```

When a `RoomType` is updated (e.g., inventory changed from 5 → 8), add 3 more rooms. If inventory reduced (8 → 5), delete 3 rooms **only if they have no active bookings**.

When a `RoomType` is deleted, delete all its associated rooms **only if none have active bookings**.

---

## 4. Room Model — Updates

Existing `Room` model. Add new fields marked `NEW`.

```js
{
  _id:            ObjectId,
  property:       ObjectId,     // ref → Property
  tenant:         ObjectId,     // ref → Tenant

  // Existing
  roomNumber:     String,       // required
  roomType:       String,       // keep for backward compat — "Deluxe King"
  price:          Number,       // nightly rate
  maxOccupancy:   Number,       // default 2
  status:         String,       // "available" | "occupied" | "maintenance" | "blocked"
  floor:          ObjectId,     // ref → Floor (optional)

  // NEW — link to RoomType
  roomTypeId:     ObjectId,     // NEW — ref → RoomType (null for legacy rooms)
  bedType:        String,       // NEW — inherited from RoomType
  bedCount:       Number,       // NEW — inherited from RoomType
  size:           Number,       // NEW — inherited from RoomType
  amenities:      [String],     // NEW — inherited from RoomType, overridable per room
}
```

---

## 5. Unit Model — No Changes

The `Unit` model (for Airbnb properties) remains unchanged:

```js
{
  _id:            ObjectId,
  property:       ObjectId,
  tenant:         ObjectId,
  unitName:       String,
  price:          Number,
  maxOccupancy:   Number,
  status:         String,
}
```

---

## 6. Complete API Endpoint Reference

### 6.1 Property CRUD

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/api/properties` | Yes | List all properties for tenant |
| `GET` | `/api/properties/:id` | Yes | Get single property with full details |
| `POST` | `/api/properties` | Yes | Create property (supports `multipart/form-data` for images) |
| `PUT` | `/api/properties/:id` | Yes | Update property (supports `multipart/form-data`) |
| `DELETE` | `/api/properties/:id` | Yes | Delete property + all rooms/units/room types |

#### `GET /api/properties` — List Properties

**What the frontend expects in the response**:

```json
[
  {
    "_id": "...",
    "title": "Grand Plaza Hotel",
    "modelType": "hotel",
    "propertyType": "hotel",
    "location": "Dubai, UAE",
    "address": "Sheikh Zayed Road",
    "starRating": 5,
    "price": 0,
    "currency": "USD",
    "status": "available",
    "isPubliclyVisible": true,
    "images": ["uploads/properties/img1.webp"],
    "amenities": ["Wifi", "Pool", "Gym"],
    "bedrooms": null,
    "bathrooms": null,
    "area": null,
    "checkInTime": "14:00",
    "checkOutTime": "11:00",
    "smokingPolicy": "no_smoking",
    "petPolicy": "on_request",
    "createdAt": "2025-01-15T...",
    "updatedAt": "2025-01-15T..."
  },
  {
    "_id": "...",
    "title": "Cozy Downtown Apartment",
    "modelType": "airbnb",
    "propertyType": "apartment",
    "placeType": "apartment",
    "guestPlaceType": "entire_place",
    "location": "Islamabad, Pakistan",
    "maxGuests": 4,
    "beds": 2,
    "bedrooms": 2,
    "bathrooms": 1,
    "price": 60,
    "weekendPremiumPercent": 10,
    "currency": "USD",
    "status": "available",
    "isPubliclyVisible": false,
    "images": ["uploads/properties/img2.webp"],
    "amenities": ["Wifi", "TV", "Kitchen"],
    "discounts": { "newListing": true, "weekly": true },
    "safetyFeatures": { "exteriorCamera": false },
    "highlights": ["Spacious", "Central"],
    "createdAt": "2025-02-01T...",
    "updatedAt": "2025-02-01T..."
  }
]
```

**The frontend uses these fields for**:

| Field | Used in |
|-------|---------|
| `title` | List card title, table row, detail page header |
| `modelType` | Determines if rooms or units tab shows |
| `propertyType` | Filter dropdown, display label |
| `location` | Card subtitle, filter |
| `price` | Card price display, filter range |
| `status` | StatusPill badge, filter |
| `images[0]` | Card thumbnail, carousel cover |
| `isPubliclyVisible` | Toggle switch on detail page |
| `starRating` | Star display (hotel) |
| `bedrooms` | Filter, card detail |
| `amenities` | Detail page, review screen |

#### `GET /api/properties/:id` — Single Property

Must return the full property object. For hotel properties, also include `roomTypes` (populated) if the RoomType model is added:

```json
{
  "_id": "...",
  "title": "Grand Plaza Hotel",
  "modelType": "hotel",
  "...all fields from schema...",
  "roomTypes": [
    {
      "_id": "rt1",
      "name": "Deluxe King",
      "bedType": "King",
      "bedCount": 1,
      "maxOccupancy": 2,
      "price": 250,
      "inventory": 12,
      "size": 450,
      "amenities": ["TV", "Mini fridge", "Balcony", "City view"]
    },
    {
      "_id": "rt2",
      "name": "Standard Twin",
      "bedType": "Twin",
      "bedCount": 2,
      "maxOccupancy": 3,
      "price": 150,
      "inventory": 20,
      "size": 300,
      "amenities": ["TV", "Air conditioning"]
    }
  ]
}
```

#### `POST /api/properties` — Create Property

**Request**: `multipart/form-data` when images attached, `application/json` otherwise.

When `multipart/form-data`:
- All non-file fields appended as form fields
- Object fields (like `discounts`, `safetyFeatures`, `amenities`) sent as `JSON.stringify(value)`
- Files under field name `images`

**The frontend currently sends these fields**:

```js
{
  title, description, location, address, modelType, propertyType,
  bedrooms, bathrooms, area, maxGuests, beds, price, currency,
  starRating, amenities, status, isPubliclyVisible
}
```

**NEW fields the backend must also accept**:

```js
{
  placeType, guestPlaceType, weekendPremiumPercent,
  discounts, safetyFeatures, highlights,
  checkInTime, checkOutTime, smokingPolicy, petPolicy, cancellationPolicy
}
```

#### `PUT /api/properties/:id` — Update Property

Same field set as `POST`. Supports `multipart/form-data` for image additions. Also accepts `imagesToRemove` (JSON stringified array of image paths to delete). **Should return the updated property object** (including the new `images` array after add/remove) so the frontend can refresh state after step 3 save. Partial updates must be supported (only fields sent are updated).

**Multipart field names (fix for "Unexpected field"):**  
The frontend sends **exactly** these field names when updating with photos (Step 3):

| Field name        | Type        | Description |
|-------------------|-------------|-------------|
| `images`          | **File[]**  | Multiple file parts, **same name** `images` (one per file). Not `image` (singular). |
| `imagesToRemove`  | **string**  | JSON stringified array of image paths to remove, e.g. `"[\"path/1.jpg\"]"`. |
| `description`    | string      | Optional. |
| `amenities`       | string      | JSON stringified array, e.g. `"[\"Wifi\",\"TV\"]"`. |
| `highlights`      | string      | JSON stringified array. |
| `discounts`       | string      | JSON stringified object. |
| `safetyFeatures`  | string      | JSON stringified object. |

**Backend multer config:** Use **`.array('images', 15)`** (or `multer.fields([{ name: 'images', maxCount: 15 }])`). Do **not** use `.single('image')` — the frontend sends the field name **`images`** (plural) and multiple files. Other fields (`imagesToRemove`, `description`, etc.) are normal form fields and must be allowed (they go to `req.body`); if your middleware rejects unknown fields, whitelist these names.

#### Save-each-step (draft) flow — backend requirements ✅ DONE

The frontend property wizard **saves each step to the backend** so the user can refresh or leave and resume without losing progress.

**Backend implementation (done):**
- **Property model:** `location` is no longer `required: true`; it defaults to `''`, so a draft can be created without it in step 1 and filled in via PUT in step 2.
- **Property controller `createProperty`:** Only `title` is required on create. The location check and the min-length-3 title check (Mongoose already enforces title minlength) were removed from the controller guard so a minimal draft `{ title: "New property", modelType, propertyType, status, isPubliclyVisible }` passes.
- **PUT:** Already returns the full updated property (`findOneAndUpdate` with `{ new: true }`, `res.json(updatedProperty)`), so the frontend gets the updated `images` array after step 3 without any change.

1. **Step 1 → `POST /api/properties` (minimal create)** — Frontend sends title, modelType, propertyType, status, isPubliclyVisible (no location/images). Backend accepts it.
2. **Step 2 → `PUT /api/properties/:id`** — Full details. Partial PUT supported.
3. **Step 3 → `PUT /api/properties/:id`** — multipart with description, amenities, new images, imagesToRemove. Response includes updated property with `images` array.
4. **Step 4 →** Hotel: `POST .../room-types`; Airbnb: `PUT` (price, etc.). No change needed.
5. **Step 5 →** No API call (frontend clears draft and redirects).

#### `DELETE /api/properties/:id` — Delete Property

Must cascade-delete all associated:
- Room Types (if RoomType model is used)
- Rooms
- Units
- Associated bookings should be handled (cancel/archive)

---

### 6.2 Room Type CRUD (NEW)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/api/properties/:id/room-types` | Yes | Create room type + auto-generate rooms |
| `GET` | `/api/properties/:id/room-types` | Yes | List all room types for property |
| `PUT` | `/api/properties/:id/room-types/:rtId` | Yes | Update room type, sync inventory |
| `DELETE` | `/api/properties/:id/room-types/:rtId` | Yes | Delete room type + rooms (if no active bookings) |

#### `POST /api/properties/:id/room-types`
Done. The checklist now reflects the actual backend implementation status:
All schema changes — marked complete
All endpoints — marked complete
Public endpoints — marked complete
Testing — remains TODO (checklist for QA)
Frontend updates — new section added with the remaining frontend tasks:
Add room type API functions to api.js
Update property detail page for room types
Update list page for new fields
Update public site
Would you like me to start on those frontend updates now — specifically adding the room type API functions and updating the property detail page to use them?
**Request body**:

```json
{
  "name": "Deluxe King",
  "bedType": "King",
  "bedCount": 1,
  "maxOccupancy": 2,
  "size": 450,
  "price": 250,
  "inventory": 12,
  "amenities": ["TV", "Mini fridge", "Balcony", "City view"]
}
```

**Behavior**:
1. Validate fields
2. Create `RoomType` document
3. Auto-generate 12 `Room` documents with `roomNumber: "Deluxe King-1"` through `"Deluxe King-12"`
4. Return created `RoomType` object

#### `GET /api/properties/:id/room-types`

**Response**: Array of room type objects.

#### `PUT /api/properties/:id/room-types/:rtId`

**Important**: If `inventory` changes, sync rooms:
- Inventory increased: create additional rooms
- Inventory decreased: delete excess rooms (only those without active bookings)
- Price changed: update price on all associated rooms

#### `DELETE /api/properties/:id/room-types/:rtId`

- Check for active bookings on any associated room
- If bookings exist, return `400` with error message
- Otherwise, delete all rooms + the room type

---

### 6.3 Room CRUD (existing — keep as-is)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/api/properties/:id/rooms` | Yes | Add individual room |
| `GET` | `/api/properties/:id/rooms` | Yes | List rooms (supports `?startDate=&endDate=` for availability) |
| `PUT` | `/api/properties/:id/rooms/:roomId` | Yes | Update room |
| `DELETE` | `/api/properties/:id/rooms/:roomId` | Yes | Delete room |

Keep these endpoints working. The frontend uses them on the property detail page for manual room management.

---

### 6.4 Unit CRUD (existing — keep as-is)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/api/properties/:id/units` | Yes | Add unit |
| `GET` | `/api/properties/:id/units` | Yes | List units (supports `?startDate=&endDate=`) |
| `PUT` | `/api/properties/:id/units/:unitId` | Yes | Update unit |
| `DELETE` | `/api/properties/:id/units/:unitId` | Yes | Delete unit |

---

### 6.5 Floor Management (existing — keep as-is)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/api/properties/:id/floors` | Yes | Add floor |

---

## 7. Amenity Values Reference

The backend stores amenities as `[String]` — no enum validation. These are the values the frontend currently sends.

### 7.1 Property-level — Airbnb

| Category | Values |
|----------|--------|
| Essential | `Wifi`, `TV`, `Kitchen`, `Washer`, `Free parking`, `Paid parking`, `Air conditioning`, `Workspace` |
| Features | `Pool`, `Hot tub`, `Patio`, `BBQ grill`, `Fire pit`, `Pool table`, `Indoor fireplace`, `Piano`, `Gym equipment`, `Lake access`, `Beach access` |
| Safety | `Smoke alarm`, `First aid kit`, `Fire extinguisher`, `Carbon monoxide alarm` |

### 7.2 Property-level — Hotel

| Category | Values |
|----------|--------|
| General | `Wifi`, `Breakfast included`, `Room service`, `Front desk 24/7`, `Airport shuttle`, `Concierge`, `Laundry service`, `Luggage storage` |
| Facilities | `Pool`, `Gym`, `Spa`, `Restaurant`, `Bar/Lounge`, `Business center`, `Conference rooms`, `Parking` |
| Safety | `Smoke alarm`, `Fire extinguisher`, `CCTV in common areas`, `Security guard`, `First aid kit`, `Emergency exits` |

### 7.3 Room-level — Hotel rooms

`TV`, `Air conditioning`, `Mini fridge`, `Safe`, `Balcony`, `City view`, `Sea view`, `Bathtub`, `Walk-in shower`, `Hair dryer`, `Iron`, `Coffee maker`, `Desk`, `Closet`, `Blackout curtains`

---

## 8. Validation Rules

### Property

| Field | Type | Rule |
|-------|------|------|
| `title` | String | Required, min 3, max 100 |
| `location` | String | Required |
| `modelType` | String | Required, enum `["hotel", "airbnb"]` |
| `propertyType` | String | Required for airbnb; default `"hotel"` for hotel |
| `price` | Number | Required for airbnb (min 1); default 0 for hotel |
| `currency` | String | Default `"USD"` |
| `status` | String | Enum `["available", "unavailable", "maintenance"]`, default `"available"` |
| `isPubliclyVisible` | Boolean | Default `false` |
| `starRating` | Number | Optional, 1–5 integer, hotel only |
| `maxGuests` | Number | Airbnb only, min 1 |
| `beds` | Number | Airbnb only, min 0 |
| `weekendPremiumPercent` | Number | 0–99, default 0 |
| `guestPlaceType` | String | Enum `["entire_place", "room", "shared_room"]` |
| `checkInTime` | String | `HH:mm` format |
| `checkOutTime` | String | `HH:mm` format |
| `smokingPolicy` | String | Enum `["no_smoking", "designated_areas", "allowed"]` |
| `petPolicy` | String | Enum `["no_pets", "pets_allowed", "on_request"]` |
| `cancellationPolicy` | String | Enum `["flexible", "moderate", "strict", "non_refundable"]` |
| `amenities` | [String] | No enum validation, store as-is |
| `highlights` | [String] | Max 2 items |
| `discounts` | Object | All fields boolean, default false |
| `safetyFeatures` | Object | All fields boolean, default false |

### Room Type

| Field | Type | Rule |
|-------|------|------|
| `name` | String | Required, min 1 |
| `bedType` | String | Enum `["King", "Queen", "Twin", "Double", "Single", "Bunk"]` |
| `bedCount` | Number | Default 1, min 1 |
| `maxOccupancy` | Number | Default 2, min 1 |
| `price` | Number | Required, min 0 |
| `inventory` | Number | Required, min 1 |
| `size` | Number | Optional, min 0 |
| `amenities` | [String] | No enum validation |

### Room

| Field | Type | Rule |
|-------|------|------|
| `roomNumber` | String | Required |
| `roomType` | String | Required |
| `price` | Number | Required, min 0 |
| `maxOccupancy` | Number | Default 2, min 1 |
| `status` | String | Enum `["available", "occupied", "maintenance", "blocked"]` |

---

## 9. API Response Examples

### 9.1 Hotel property with room types

```json
{
  "_id": "665a1b2c3d4e5f6a7b8c9d0e",
  "title": "Grand Plaza Hotel",
  "description": "A 5-star luxury hotel in the heart of Dubai.",
  "modelType": "hotel",
  "propertyType": "hotel",
  "location": "Dubai, UAE",
  "address": "Sheikh Zayed Road, Downtown Dubai",
  "starRating": 5,
  "amenities": ["Wifi", "Breakfast included", "Pool", "Gym", "Spa", "Restaurant", "Parking"],
  "checkInTime": "14:00",
  "checkOutTime": "11:00",
  "smokingPolicy": "no_smoking",
  "petPolicy": "on_request",
  "cancellationPolicy": "moderate",
  "price": 0,
  "currency": "USD",
  "images": ["uploads/properties/hotel1.webp", "uploads/properties/hotel2.webp"],
  "status": "available",
  "isPubliclyVisible": true,
  "roomTypes": [
    {
      "_id": "rt001",
      "name": "Deluxe King",
      "bedType": "King",
      "bedCount": 1,
      "maxOccupancy": 2,
      "price": 250,
      "inventory": 12,
      "size": 450,
      "amenities": ["TV", "Mini fridge", "Balcony", "City view", "Bathtub"]
    },
    {
      "_id": "rt002",
      "name": "Standard Twin",
      "bedType": "Twin",
      "bedCount": 2,
      "maxOccupancy": 3,
      "price": 150,
      "inventory": 20,
      "size": 300,
      "amenities": ["TV", "Air conditioning", "Desk"]
    }
  ],
  "createdAt": "2025-01-15T10:00:00Z",
  "updatedAt": "2025-02-01T12:00:00Z"
}
```

### 9.2 Airbnb property

```json
{
  "_id": "665b2c3d4e5f6a7b8c9d1e2f",
  "title": "Cozy Downtown Apartment with City Views",
  "description": "A spacious and unique apartment in the heart of the city.",
  "modelType": "airbnb",
  "propertyType": "apartment",
  "placeType": "Apartment",
  "guestPlaceType": "entire_place",
  "location": "Islamabad, Pakistan",
  "address": "F-11 Markaz, Islamabad",
  "maxGuests": 4,
  "beds": 2,
  "bedrooms": 2,
  "bathrooms": 1,
  "area": 1200,
  "price": 60,
  "weekendPremiumPercent": 10,
  "currency": "USD",
  "amenities": ["Wifi", "TV", "Kitchen", "Air conditioning", "Free parking", "Pool"],
  "discounts": {
    "newListing": true,
    "lastMinute": false,
    "weekly": true,
    "monthly": false
  },
  "safetyFeatures": {
    "exteriorCamera": false,
    "noiseMonitor": false,
    "weapons": false
  },
  "highlights": ["Spacious", "Central"],
  "images": ["uploads/properties/apt1.webp", "uploads/properties/apt2.webp"],
  "status": "available",
  "isPubliclyVisible": false,
  "createdAt": "2025-02-01T08:00:00Z",
  "updatedAt": "2025-02-05T14:00:00Z"
}
```

### 9.3 Error responses

```json
// 400 — Validation error
{
  "success": false,
  "message": "Property title must be at least 3 characters"
}

// 400 — Cannot delete room type with active bookings
{
  "success": false,
  "message": "Cannot delete room type: 3 rooms have active bookings"
}

// 404
{
  "success": false,
  "message": "Property not found"
}
```

---

## 10. Public API Endpoints

These are **unauthenticated** endpoints used by the public-facing booking website. They must return the new fields so the public site can display them.

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/public/:slug/properties` | List all **publicly visible** properties for the tenant identified by `slug` |
| `GET` | `/public/:slug/properties/:id` | Get single property details (must be that tenant’s and publicly visible) |
| `GET` | `/public/:slug/properties/:id/rooms` | List rooms for hotel property |
| `GET` | `/public/:slug/properties/:id/units` | List units for airbnb property |
| `GET` | `/public/:slug/properties/:id/availability` | Check availability by date range |

---

### 10.1 Backend changes for tenant website (showing properties)

For the tenant’s live website (e.g. `zuha-stays.zuhahost.com/properties`) to show properties, the backend must implement the following.

#### 1. `GET /public/:slug/properties` — list properties

**Behavior:**

1. Resolve the **tenant** by `slug` (e.g. Tenant model: `slug === req.params.slug`). If no tenant found, return `404` (or `{ success: false, message: "Tenant not found" }`).
2. Query **properties** where:
   - `tenantId` (or equivalent) equals that tenant’s `_id`, **and**
   - `isPubliclyVisible === true`.
3. Return a **200** body: array of property documents (no auth required).

**Do not return** properties that:

- Belong to a different tenant.
- Have `isPubliclyVisible === false` (or missing/undefined; treat as private).

**Response shape:** Array of objects. Each object must include at least:

```
id or _id, title, modelType, propertyType, placeType, location, address, price, currency,
images, amenities, starRating, maxGuests, beds, bedrooms, bathrooms, area,
guestPlaceType, weekendPremiumPercent, highlights,
status, isPubliclyVisible
```

Optional but recommended for list cards: `description` (truncated if needed).

**Example implementation (pseudo):**

```js
// Resolve tenant by slug
const tenant = await Tenant.findOne({ slug: req.params.slug });
if (!tenant) return res.status(404).json({ success: false, message: "Tenant not found" });

// Only publicly visible properties for this tenant
const properties = await Property.find({
  tenantId: tenant._id,
  isPubliclyVisible: true,
})
  .select("-__v") // omit internal fields if desired
  .lean();

return res.json(properties);
```

---

#### 2. `GET /public/:slug/properties/:id` — single property detail

**Behavior:**

1. Resolve the **tenant** by `slug`. If not found, return 404.
2. Find the **property** by `id` (or `_id`) where:
   - `tenantId` equals that tenant’s `_id`, **and**
   - `isPubliclyVisible === true`.
3. If no such property, return **404** (e.g. `{ success: false, message: "Property not found" }`).
4. For **hotels**, populate `roomTypes` (or attach room types so the frontend can show them).
5. Return **200** with the full property object (including new fields and `roomTypes` for hotels).

**Response must include** everything from the list response PLUS:

`description`, `address`, `discounts`, `safetyFeatures`, `checkInTime`, `checkOutTime`, `cancellationPolicy`, `roomTypes` (for hotels).

---

#### 3. `GET /public/:slug/properties/:id/rooms` and `GET /public/:slug/properties/:id/units`

**Behavior:**

- Resolve tenant by `slug`; find property by `id` for that tenant and with `isPubliclyVisible === true`.
- If tenant or property not found or not public, return **404**.
- Return rooms (or units) for that property only. Optionally filter by `status` (e.g. exclude `blocked`) for availability semantics.

---

#### 4. `GET /public/:slug/properties/:id/availability`

**Behavior:**

- Same tenant + property resolution and visibility check as above. Return 404 if not found or not public.
- Return availability (and optionally pricing) for the requested date range.

---

### 10.2 Public list/detail response fields (summary)

**List** (`GET /public/:slug/properties`):  
`title`, `modelType`, `propertyType`, `placeType`, `location`, `price`, `images`, `amenities`, `starRating`, `maxGuests`, `beds`, `bedrooms`, `bathrooms`, `guestPlaceType`, `weekendPremiumPercent`, `highlights`, plus `id`/`_id`.

**Detail** (`GET /public/:slug/properties/:id`):  
All of the above PLUS: `description`, `address`, `discounts`, `safetyFeatures`, `checkInTime`, `checkOutTime`, `cancellationPolicy`, `roomTypes` (for hotels).

---

## 11. Frontend API Client Reference

These are the functions in `src/lib/api.js` that call the backend. The backend must support every endpoint listed.

| Frontend Function | Method | Endpoint | Notes |
|-------------------|--------|----------|-------|
| `getAllProperties()` | GET | `/api/properties` | Returns array |
| `getPropertyById(id)` | GET | `/api/properties/:id` | Returns single object |
| `createProperty(data, images)` | POST | `/api/properties` | multipart or JSON |
| `updateProperty(id, data, images, imagesToRemove)` | PUT | `/api/properties/:id` | multipart or JSON |
| `deleteProperty(id)` | DELETE | `/api/properties/:id` | Cascade delete |
| `addRoom(propertyId, data)` | POST | `/api/properties/:id/rooms` | JSON body |
| `getRooms(propertyId, startDate?, endDate?)` | GET | `/api/properties/:id/rooms` | Optional date filter |
| `updateRoom(propertyId, roomId, data)` | PUT | `/api/properties/:id/rooms/:roomId` | JSON body |
| `deleteRoom(propertyId, roomId)` | DELETE | `/api/properties/:id/rooms/:roomId` | — |
| `addUnit(propertyId, data)` | POST | `/api/properties/:id/units` | JSON body |
| `getUnits(propertyId, startDate?, endDate?)` | GET | `/api/properties/:id/units` | Optional date filter |
| `updateUnit(propertyId, unitId, data)` | PUT | `/api/properties/:id/units/:unitId` | JSON body |
| `deleteUnit(propertyId, unitId)` | DELETE | `/api/properties/:id/units/:unitId` | — |
| `addFloor(propertyId, data)` | POST | `/api/properties/:id/floors` | JSON body |
| `getPublicProperties(slug)` | GET | `/public/:slug/properties` | No auth |
| `getPublicPropertyDetails(slug, id)` | GET | `/public/:slug/properties/:id` | No auth |
| `getPublicRooms(slug, id)` | GET | `/public/:slug/properties/:id/rooms` | No auth |
| `getPublicUnits(slug, id)` | GET | `/public/:slug/properties/:id/units` | No auth |
| `checkAvailability(slug, id, params)` | GET | `/public/:slug/properties/:id/availability` | No auth |

### NEW endpoints to add to frontend after backend is ready:

| Frontend Function (to create) | Method | Endpoint |
|-------------------------------|--------|----------|
| `addRoomType(propertyId, data)` | POST | `/api/properties/:id/room-types` |
| `getRoomTypes(propertyId)` | GET | `/api/properties/:id/room-types` |
| `updateRoomType(propertyId, rtId, data)` | PUT | `/api/properties/:id/room-types/:rtId` |
| `deleteRoomType(propertyId, rtId)` | DELETE | `/api/properties/:id/room-types/:rtId` |

---

## 12. Implementation Status

> Updated: Feb 2026 — Backend changes have been completed.

### Schema changes — DONE

- [x] Add new fields to Property model: `address`, `amenities`, `placeType`, `guestPlaceType`, `maxGuests`, `beds`, `weekendPremiumPercent`, `discounts`, `safetyFeatures`, `highlights`, `checkInTime`, `checkOutTime`, `smokingPolicy`, `petPolicy`, `cancellationPolicy`
- [x] Set defaults for all new fields (backward compatible)
- [x] Status enum updated: `['available', 'unavailable', 'maintenance']`
- [x] `description` changed from required to optional (max 500)
- [x] `area`, `bedrooms`, `bathrooms` defaults changed to `null`
- [x] `isPubliclyVisible` default changed to `false`
- [x] Create `RoomType` model with unique index on `(property, name)`
- [x] Add `roomTypeId`, `bedType`, `bedCount`, `size` to Room model
- [x] Room status enum expanded with `blocked`

### Endpoints — DONE

- [x] `POST /api/properties` — accepts all new fields (with `parseJsonField` for FormData)
- [x] `PUT /api/properties/:id` — accepts all new fields
- [x] `GET /api/properties` — returns new fields
- [x] `GET /api/properties/:id` — returns new fields + populates `roomTypes` for hotels
- [x] `POST /api/properties/:id/room-types` — creates room type + auto-generates rooms
- [x] `GET /api/properties/:id/room-types` — lists room types
- [x] `PUT /api/properties/:id/room-types/:rtId` — updates + syncs inventory + cascades price
- [x] `DELETE /api/properties/:id/room-types/:rtId` — checks bookings first, then cascade deletes
- [x] `DELETE /api/properties/:id` — cascade deletes RoomTypes, Rooms, Units, cancels pending bookings

### Public endpoints — DONE (§10.1 already implemented)

- [x] `GET /public/:slug/properties` — filters by `tenantId` (tenant from slug) and `isPubliclyVisible: true`; returns all fields (`.select('-tenantId')` so new fields included)
- [x] `GET /public/:slug/properties/:id` — same tenant + visibility; includes `roomTypes` for hotels; returns all fields (description, address, discounts, safetyFeatures, checkInTime, checkOutTime, cancellationPolicy, etc.)
- [x] Rooms, units, availability — resolve tenant by slug, verify property + `isPubliclyVisible: true`, 404 if not found
- [x] Room availability filter excludes `blocked` status
- [x] All new fields returned automatically (only `tenantId` excluded from response)
- [x] **Tenant website (§10.1):** List and detail scope to tenant (from slug) and require `isPubliclyVisible: true`. Public booking controller implements this; `.select('-tenantId')` ensures all new fields are included. Detail endpoint attaches `roomTypes` for hotels.

### Testing — TODO

- [ ] Create hotel with all new fields — verify response shape
- [ ] Create airbnb with all new fields — verify response shape
- [ ] Create room type with inventory — verify rooms auto-generated
- [ ] Update room type inventory up/down — verify rooms synced
- [ ] Delete room type with no bookings — verify cascade
- [ ] Delete room type with active bookings — verify 400 error
- [ ] Delete property — verify all children deleted
- [ ] Load existing properties — verify no errors (backward compat)
- [ ] Public endpoint returns new fields for public site
- [ ] FormData multipart upload with nested JSON fields (discounts, safetyFeatures, amenities)

### Frontend updates — DONE

- [x] Add `addRoomType`, `getRoomTypes`, `updateRoomType`, `deleteRoomType` to `src/lib/api.js`
- [x] Update property detail page (`/properties/[id]`) to show room types for hotels (add/edit/delete room types; legacy Add Room modal kept)
- [x] Update property list page to display new fields (starRating, maxGuests, placeType)
- [x] Update public site property card/detail to use new fields (maxGuests, starRating, placeType, checkIn/checkOut, roomTypes, amenities)

---

## 13. Backward Compatibility

| Concern | Mitigation |
|---------|------------|
| Existing properties missing new fields | All new fields have defaults or are optional. Frontend handles `undefined`/`null`. |
| Old `POST /api/properties/:id/rooms` still used | Keep it working. The property detail page still uses it for manual room management. |
| `roomType` string field on Room | Keep it. `roomTypeId` is additive — not a replacement. |
| `propertyType` vs `modelType` | Frontend sends both. `modelType` is the canonical discriminator. `propertyType` is display-only. |
| `discounts` / `safetyFeatures` not set on old docs | Treat missing as `{}`. Frontend defaults all sub-fields to `false`. |
| `placeType` missing on old airbnb properties | Frontend falls back to `propertyType` for display. |
| Room auto-generation | Only happens via the new `POST /room-types` endpoint. Legacy `POST /rooms` does not trigger it. |

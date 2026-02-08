// ─── Property-level amenities ───────────────────────────────────
export const AIRBNB_AMENITIES = {
  essential: ["Wifi", "TV", "Kitchen", "Washer", "Free parking", "Paid parking", "Air conditioning", "Workspace"],
  features: ["Pool", "Hot tub", "Patio", "BBQ grill", "Fire pit", "Pool table", "Indoor fireplace", "Piano", "Gym equipment", "Lake access", "Beach access"],
  safety: ["Smoke alarm", "First aid kit", "Fire extinguisher", "Carbon monoxide alarm"],
};

export const HOTEL_AMENITIES = {
  general: ["Wifi", "Breakfast included", "Room service", "Front desk 24/7", "Airport shuttle", "Concierge", "Laundry service", "Luggage storage"],
  facilities: ["Pool", "Gym", "Spa", "Restaurant", "Bar/Lounge", "Business center", "Conference rooms", "Parking"],
  safety: ["Smoke alarm", "Fire extinguisher", "CCTV in common areas", "Security guard", "First aid kit", "Emergency exits"],
};

export const AIRBNB_AMENITY_LABELS = { essential: "Essential", features: "Features", safety: "Safety" };
export const HOTEL_AMENITY_LABELS = { general: "General Services", facilities: "Facilities", safety: "Safety" };

// ─── Room-level amenities (hotel) ───────────────────────────────
export const ROOM_AMENITIES = [
  "TV", "Air conditioning", "Mini fridge", "Safe", "Balcony", "City view", "Sea view", "Bathtub",
  "Walk-in shower", "Hair dryer", "Iron", "Coffee maker", "Desk", "Closet", "Blackout curtains",
];

// ─── Discount options (airbnb) ──────────────────────────────────
export const DISCOUNT_OPTIONS = [
  { key: "newListing", pct: "20%", label: "New listing promotion", desc: "First 3 bookings" },
  { key: "lastMinute", pct: "0%", label: "Last-minute discount", desc: "Booked ≤ 14 days before" },
  { key: "weekly", pct: "10%", label: "Weekly discount", desc: "7+ nights" },
  { key: "monthly", pct: "20%", label: "Monthly discount", desc: "28+ nights" },
];

// ─── Safety disclosure items (airbnb) ───────────────────────────
export const SAFETY_DISCLOSURES = [
  { key: "exteriorCamera", label: "Exterior security camera present" },
  { key: "noiseMonitor", label: "Noise decibel monitor present" },
  { key: "weapons", label: "Weapon(s) on the property" },
];

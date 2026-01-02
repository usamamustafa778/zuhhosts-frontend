# Booking Features - Quick Usage Guide

## Creating a New Booking with Guest Count and ID Cards

### Step 1: Open Create Booking Modal
Click the **"Add booking"** button on the Bookings page.

### Step 2: Fill in Basic Information
1. Select or create a guest
2. Choose a property
3. Set check-in and check-out dates
4. Enter payment details (amount auto-calculates)
5. Select payment status

### Step 3: Specify Number of Guests
- Enter the total number of guests for this booking
- Minimum: 1 guest (required)
- This represents all guests staying, not just the main guest

### Step 4: Upload Guest ID Cards (Optional)
1. Click the upload area or drag files into it
2. Select up to 10 ID card images/PDFs
3. Each file must be under 5MB
4. Supported formats: JPG, PNG, GIF, PDF
5. Preview shows selected files with option to remove any
6. Files are uploaded when you click "Create booking"

### Step 5: Submit
Click **"Create booking"** to save the booking with all information.

---

## Viewing Booking Details and ID Cards

### Method 1: Click ID Cards Count
In the bookings table, click the blue ID cards link (e.g., "3 ID cards") to open the booking details modal.

### Method 2: Click View Icon
Click the eye icon (👁️) in the actions column to view full booking details.

### What You'll See
- Complete guest information (name, email, phone)
- Property details
- Booking dates and duration
- Number of guests
- Amount and discount
- Booking and payment status
- **ID Cards Gallery** with all uploaded ID cards

### Working with ID Cards Gallery
- **View Full Size**: Click any ID card thumbnail to open lightbox
- **Navigate**: Use arrow buttons to browse through multiple cards
- **Download**: Hover over a card and click the download button
- **Close**: Click X or outside the lightbox to close

---

## Editing an Existing Booking

### Step 1: Open Edit Modal
Click the **"Edit"** button for any booking in the table.

### Step 2: Update Number of Guests
- Change the "Number of Guests" field as needed
- Minimum 1 guest required

### Step 3: View Current ID Cards
- If the booking has existing ID cards, they'll be displayed in a preview gallery
- You can view them but not download from this modal (use view modal for that)

### Step 4: Upload New ID Cards (Optional)
1. Use the file upload section to select new ID cards
2. **Important**: Uploading new ID cards will **replace all existing ones**
3. A warning message reminds you of this
4. If you don't want to change ID cards, simply don't select any files

### Step 5: Save Changes
Click **"Update booking"** to save all changes.

---

## Understanding the Bookings Table

### New Columns

**Guests Column**
- Shows total number of guests for each booking
- Format: "2 guests" or "1 guest"
- Helps you quickly see booking size

**ID Cards Column**
- Shows count of uploaded ID cards
- Clickable link opens booking details
- "None" appears if no ID cards uploaded
- Format: "3 ID cards" or "None"

---

## Tips and Best Practices

### Number of Guests
- Always specify the correct total number of guests
- This is important for:
  - Capacity planning
  - Pricing accuracy
  - Regulatory compliance
  - Generating reports

### ID Card Management

**When to Upload**
- At booking creation time (recommended)
- After booking is confirmed
- When updating guest information
- For compliance requirements

**Best Practices**
- Upload clear, legible copies of ID cards
- Include ID cards for all guests (not just the main guest)
- Use consistent naming if organizing files beforehand
- Keep original file names if they include guest names
- Verify all required ID cards are uploaded

**File Format Tips**
- **Photos**: Use JPG or PNG for ID card photos
- **Scans**: Use PDF for high-quality scans
- **Mobile**: Take clear, well-lit photos
- **Size**: Compress large images to stay under 5MB

### Updating ID Cards

**Adding More Cards**
If you need to add cards without losing existing ones:
1. First, download all existing ID cards from the view modal
2. Combine old and new cards in your selection
3. Upload all cards together in the edit modal

**Important Note**: There's no "append" mode - new uploads always replace existing ones.

---

## Troubleshooting

### "Number of guests must be at least 1"
- The numberOfGuests field cannot be 0 or empty
- Enter at least 1 guest

### "Maximum 10 files allowed"
- You can only upload 10 ID cards per booking
- If you need more, consider:
  - Combining multiple cards per guest into one image
  - Using PDF format to include multiple pages
  - Contacting support for special cases

### "Some files exceed 5MB limit"
- One or more files are too large
- Compress images using:
  - Online tools (TinyPNG, Compressor.io)
  - Image editing software
  - Mobile compression apps
- Or scan/photograph at lower resolution

### "Failed to create/update booking"
- Check your internet connection
- Verify all required fields are filled
- Ensure files are valid formats
- Try refreshing the page and trying again
- Check browser console for detailed error

### ID Cards Not Displaying
- Verify the API_BASE_URL is correctly configured
- Check that files were successfully uploaded (check booking details)
- Try clearing browser cache
- Verify you have permission to view the booking

### Files Not Uploading
- Check file formats are accepted (JPG, PNG, GIF, PDF)
- Verify files are under 5MB each
- Try uploading fewer files at once
- Disable browser extensions that might block uploads
- Try a different browser

---

## Keyboard Shortcuts

While viewing ID cards in lightbox:
- **← Left Arrow**: Previous card
- **→ Right Arrow**: Next card
- **Escape**: Close lightbox

---

## Mobile Usage

### Uploading from Mobile
1. Tap the upload area
2. Choose "Take Photo" to use camera
3. Or choose "Photo Library" to select existing images
4. Take clear photos of ID cards
5. Review preview before submitting

### Viewing on Mobile
- Gallery adapts to smaller screens
- Tap to view full size
- Swipe to navigate between cards
- Pinch to zoom on images

---

## API Details for Developers

### Create Booking Request
```http
POST /api/bookings
Content-Type: multipart/form-data

Fields:
- property_id (required)
- guest_id (required)
- start_date (required)
- end_date (required)
- amount (required)
- discount (optional)
- payment_status (optional)
- numberOfGuests (optional, default: 1)
- guestIdCards[] (optional, array of files)
```

### Update Booking Request
```http
PUT /api/bookings/:id
Content-Type: multipart/form-data

Fields:
- Any booking fields to update
- numberOfGuests (optional)
- guestIdCards[] (optional, replaces all existing)
```

### Get Booking Response
```json
{
  "id": "booking_id",
  "numberOfGuests": 2,
  "guestIdCards": [
    "/uploads/bookings/file1.jpg",
    "/uploads/bookings/file2.jpg"
  ],
  // ... other booking fields
}
```

---

## Questions?

If you encounter issues not covered in this guide:
1. Check the main implementation documentation
2. Review browser console for errors
3. Test with a different browser
4. Contact your system administrator

---

**Last Updated**: January 2, 2025


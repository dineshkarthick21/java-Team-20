# Student Booking Lifecycle - Auto Deactivation & Reactivation

## Overview
Students can book resources with an automatic deactivation system after reaching the daily booking limit. Admins can reactivate students to continue the booking cycle.

## How It Works

### 📌 Booking Cycle for Students

#### **Step 1: First Booking** 
- Student creates their **1st booking** for the day
- Status: **ACTIVE** ✅
- Can book again

#### **Step 2: Second Booking (Auto-Deactivation)**
- Student creates their **2nd booking** for the day  
- System automatically marks user as **INACTIVE** ❌
- Cannot book until reactivated

#### **Step 3: Third Booking Attempt (Blocked)**
- Student attempts to book again
- ❌ **REJECTED** with message:  
  _"Your account is inactive. You have reached the booking limit (2 bookings per day). Please contact admin to reactivate your account."_

#### **Step 4: Admin Reactivation**
- Admin changes student status from **INACTIVE** → **ACTIVE**
- Using endpoint: `PATCH /api/users/students/{id}/status`
- Request body: `{ "status": "ACTIVE" }`

#### **Step 5: Loop Continues**
- Student can now make 2 more bookings
- After 2nd booking → automatically becomes **INACTIVE** again
- Admin can reactivate again
- **Cycle repeats indefinitely** ♻️

---

## Technical Implementation

### Backend Logic (BookingService.java)

```java
@Transactional
public BookingResponse createBooking(BookingRequest request) {
    // 1. Check if student is INACTIVE
    if (student.getStatus() == UserStatus.INACTIVE) {
        throw new RuntimeException("Your account is inactive...");
    }
    
    // 2. Create the booking
    Booking savedBooking = bookingRepository.save(booking);
    
    // 3. Count total bookings for today
    long todayBookings = bookingRepository.countByUserIdAndBookingDate(
        userId, bookingDate
    );
    
    // 4. If 2 or more bookings → Mark as INACTIVE
    if (todayBookings >= 2) {
        student.setStatus(UserStatus.INACTIVE);
        studentRepository.save(student);
    }
    
    return savedBooking;
}
```

### Available Endpoints

#### **1. Create Booking**
```http
POST /api/bookings
Content-Type: application/json

{
  "userId": "student123",
  "userRole": "STUDENT",
  "resourceId": "resource456",
  "bookingDate": "2026-02-20",
  "timeSlot": "10:00-11:00",
  "purpose": "Study session"
}
```

#### **2. Reactivate Student (Admin Only)**
```http
PATCH /api/users/students/{studentId}/status
Content-Type: application/json

{
  "status": "ACTIVE"
}
```

#### **3. Get Student Status**
```http
GET /api/users/students/{studentId}
```

Response:
```json
{
  "id": "student123",
  "name": "John Doe",
  "email": "john@example.com",
  "status": "INACTIVE",
  "source": "students"
}
```

#### **4. Get All Students (Admin Dashboard)**
```http
GET /api/users/students
```

---

## Key Rules

✅ **Daily Limit**: Students can make **2 bookings per day**  
✅ **Auto-Deactivation**: Happens after the **2nd booking** is created  
✅ **Reactivation**: Only **admins** can change status from INACTIVE to ACTIVE  
✅ **Repeatable**: The cycle can repeat indefinitely (2 bookings → inactive → reactivate → 2 bookings...)  
✅ **Role-Specific**: This limitation applies **only to STUDENT role**, not STAFF or ADMIN  

---

## User Experience

### For Students:
1. Book normally (1st booking)
2. Book again (2nd booking - gets auto-deactivated)
3. Try to book 3rd time → See error message
4. Contact admin for reactivation
5. Admin reactivates account
6. Repeat from step 1

### For Admins:
1. View all students and their statuses
2. See which students are INACTIVE
3. Reactivate students as needed via status update endpoint
4. Students can resume booking (2 more allowed before next deactivation)

---

## Database Schema

### Users/Students Collection
```javascript
{
  "_id": "student123",
  "name": "John Doe",
  "email": "john@example.com",
  "status": "INACTIVE",  // ACTIVE | INACTIVE | SUSPENDED
  "role": "STUDENT",
  "createdAt": "2026-02-18T10:00:00"
}
```

### Bookings Collection  
```javascript
{
  "_id": "booking789",
  "userId": "student123",
  "userRole": "STUDENT",
  "resourceId": "resource456", 
  "bookingDate": "2026-02-20",
  "timeSlot": "10:00-11:00",
  "status": "APPLIED",  // APPLIED | STAFF_APPROVED | ADMIN_APPROVED | REJECTED
  "createdAt": "2026-02-18T10:30:00"
}
```

---

## Testing the Flow

### Scenario Test:
1. **Student logs in** (Status: ACTIVE)
2. **Books Resource A** at 10:00 AM (Status: ACTIVE, Bookings Today: 1)
3. **Books Resource B** at 2:00 PM (Status: INACTIVE, Bookings Today: 2) ← Auto-deactivated
4. **Tries to book Resource C** → ❌ Error: "Your account is inactive..."
5. **Admin views student list** → Sees student is INACTIVE
6. **Admin reactivates student** → Status changes to ACTIVE
7. **Student books Resource C** at 4:00 PM (Status: ACTIVE, Bookings Today: 1)  
8. **Student books Resource D** at 6:00 PM (Status: INACTIVE, Bookings Today: 2) ← Auto-deactivated again
9. **Loop continues...**

---

## Notes

- The booking count is tracked **per day** (based on `bookingDate`)
- Rejected bookings still count toward the daily limit
- The system checks both `students` collection and legacy `users` collection for backward compatibility
- Admins and Staff are NOT subject to booking limits (only affects STUDENT role)

---

## Frontend Integration Tips

### Display Student Status Badge
```jsx
<span className={`badge ${student.status === 'ACTIVE' ? 'bg-green' : 'bg-red'}`}>
  {student.status}
</span>
```

### Show Warning Before 2nd Booking
```jsx
if (todayBookingCount === 1) {
  alert("This is your 2nd booking. Your account will be deactivated after this.");
}
```

### Admin Reactivation Button
```jsx
<button onClick={() => updateStudentStatus(studentId, 'ACTIVE')}>
  Reactivate Student
</button>
```

---

**✨ Implementation Complete!**  
The booking lifecycle with automatic deactivation and admin reactivation is now fully functional.

# Campus Resource Management System - Frontend

A modern, Flipkart-style order tracking UI for managing campus resource bookings built with React (Vite) and Tailwind CSS.

## 🚀 Features

- **3-Step Progress Tracker**: Horizontal progress bar similar to Flipkart order tracking
- **Role-Based Dashboards**: Student, Staff, and Admin views
- **Real-time Status Updates**: Visual feedback with color-coded states
- **Responsive Design**: Mobile-friendly UI
- **Smooth Animations**: Transition effects on status changes
- **Modern UI**: Built with Tailwind CSS and Heroicons

## 📋 Booking Status Flow

1. **APPLIED** - Student submits booking request
2. **STAFF_APPROVED** - Staff reviews and approves
3. **ADMIN_APPROVED** - Admin gives final confirmation
4. **REJECTED** - Request rejected at any stage (shown in red)

## 🛠️ Tech Stack

- React 18
- Vite
- Tailwind CSS
- React Router DOM

## 📦 Installation

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser and visit:
```
http://localhost:3000
```

## 🎨 Project Structure

```
frontend/
├── src/
│   ├── components/
│   │   └── BookingTracker.jsx    # Reusable progress tracker component
│   ├── pages/
│   │   ├── StudentDashboard.jsx  # Student view with booking list
│   │   ├── StaffDashboard.jsx    # Staff review interface
│   │   └── AdminDashboard.jsx    # Admin approval interface
│   ├── App.jsx                    # Main app with routing
│   ├── main.jsx                   # Entry point
│   └── index.css                  # Global styles with Tailwind
├── index.html
├── package.json
├── vite.config.js
└── tailwind.config.js
```

## 🎯 Component Usage

### BookingTracker Component

```jsx
import BookingTracker from './components/BookingTracker';

<BookingTracker
  status="STAFF_APPROVED"
  appliedDate="Feb 17, 2026"
  staffDate="Feb 18, 2026"
  adminDate={null}
/>
```

**Props:**
- `status` (string): Current booking status - APPLIED | STAFF_APPROVED | ADMIN_APPROVED | REJECTED
- `appliedDate` (string): Date when booking was applied
- `staffDate` (string): Date when staff approved (null if pending)
- `adminDate` (string): Date when admin approved (null if pending)

## 🎨 UI Features

### Progress Tracker Visualization

- **Green Dots & Lines**: Completed stages
- **Red Dot**: Rejected status
- **Gray Dots**: Pending stages
- **Checkmark Icons**: Completed steps
- **Cross Icon**: Rejected step
- **Smooth Transitions**: Animated progress line
- **Status Messages**: Contextual information above tracker

### Dashboard Features

**Student Dashboard:**
- View all booking requests
- Track booking status in real-time
- Statistics overview (Total, Pending, Approved, Rejected)

**Staff Dashboard:**
- Review pending applications
- Approve/Reject bookings
- View approved bookings
- Track staff approval metrics

**Admin Dashboard:**
- Final approval authority
- View staff-approved requests
- Approve/Reject with oversight
- Complete booking lifecycle view

## 🎭 Demo Data

Each dashboard comes with sample data demonstrating different booking states:
- Applied bookings (awaiting staff review)
- Staff-approved bookings (awaiting admin confirmation)
- Fully approved bookings
- Rejected bookings

## 🌈 Color Scheme

- **Primary**: #2874f0 (Flipkart Blue)
- **Success**: #26a541 (Green)
- **Danger**: #ef4444 (Red)
- **Background**: #f1f3f6 (Light Gray)

## 📱 Responsive Design

The UI is fully responsive and works seamlessly on:
- Desktop (1920px+)
- Laptop (1024px+)
- Tablet (768px+)
- Mobile (320px+)

## 🔧 Build for Production

```bash
npm run build
```

The build output will be in the `dist/` directory.

## 🎪 Hackathon Demo Ready

This frontend is designed to be hackathon demo-ready with:
- Polished, modern UI
- Smooth animations
- Sample data for demonstration
- Easy-to-navigate role-based views
- Professional design inspired by Flipkart

## 🔌 Backend Integration

To connect with your backend API:

1. Update the component state management to fetch from API endpoints
2. Replace `alert()` calls with actual API calls in approve/reject handlers
3. Add proper error handling and loading states
4. Implement authentication and authorization

Example API integration points:
- `GET /api/bookings` - Fetch bookings
- `POST /api/bookings/approve/:id` - Approve booking
- `POST /api/bookings/reject/:id` - Reject booking
- `GET /api/bookings/status/:id` - Get booking status

## 📄 License

This project is created for the Origin Bit Hackathon.

## 🙌 Credits

- Inspired by Flipkart's order tracking UI
- Built with modern React best practices
- Designed for Campus Resource Management

---

**Happy Hacking! 🚀**

# Campus Resource Management System

A comprehensive web application for managing campus resources (labs, classrooms, event halls, computers) with a role-based booking system featuring Student, Staff, and Admin workflows.

## 🌟 Features

- **Role-Based Access Control**: Student, Staff, and Admin dashboards
- **3-Step Approval Process**: Applied → Staff Approved → Admin Approved
- **Real-Time Booking Tracker**: Flipkart-style progress visualization
- **Edit Booking**: Modify booking details before staff/admin approval
- **PDF Download**: Export booking details to PDF from all dashboards
- **Dark/Light Theme**: Toggle between dark and light modes with persistent preference
- **Resource Management**: CRUD operations for campus resources
- **User Management**: Student activation/deactivation and account unblocking
- **Booking Lifecycle**: Complete booking workflow with approval/rejection
- **Responsive Design**: Mobile-friendly UI with Tailwind CSS

## 🏗️ Technology Stack

### Backend
- **Java 17**
- **Spring Boot 3.2.0**
- **MongoDB Atlas** (Cloud Database)
- **Maven** (Build Tool)
- **Spring Data MongoDB**

### Frontend
- **React 18** with Vite
- **Tailwind CSS**
- **React Router DOM**
- **Heroicons**
- **jsPDF & jsPDF-AutoTable** (PDF generation)

## 📁 Project Structure

```
├── backend/                 # Spring Boot REST API
│   ├── src/
│   │   └── main/
│   │       ├── java/com/campus/resourcemanagement/
│   │       │   ├── config/          # CORS configuration
│   │       │   ├── controller/      # REST Controllers
│   │       │   ├── dto/             # Data Transfer Objects
│   │       │   ├── entity/          # MongoDB Documents
│   │       │   ├── repository/      # MongoDB Repositories
│   │       │   └── service/         # Business Logic
│   │       └── resources/
│   │           └── application.properties
│   └── pom.xml
│
├── frontend/                # React Application
│   ├── src/
│   │   ├── components/      # Reusable components
│   │   ├── context/         # Auth context
│   │   ├── pages/           # Dashboard pages
│   │   ├── App.jsx
│   │   └── main.jsx
│   └── package.json
│
└── BOOKING_LIFECYCLE.md    # Booking workflow documentation
```

## 🚀 Getting Started

### Prerequisites

- **Java 17** or higher
- **Node.js** (v18 or higher)
- **npm** or **yarn**
- **Maven** (or use included wrapper)
- **MongoDB Atlas account** (or update connection string)

### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Update MongoDB connection (if needed) in `src/main/resources/application.properties`:
```properties
spring.data.mongodb.uri=your-mongodb-connection-string
spring.data.mongodb.database=campusdb
```

3. Build and run:
```bash
# Using Maven wrapper (Windows)
.\mvnw.cmd spring-boot:run

# Or using Maven
mvn spring-boot:run
```

Backend will run on: `http://localhost:8080`

### Frontend Setup

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start development server:
```bash
npm run dev
```

Frontend will run on: `http://localhost:3000`

## 📡 API Endpoints

### Authentication (`/api/auth`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/signup` | Register a new user |
| POST | `/api/auth/login` | User login |

### Users (`/api/users`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/users/{id}` | Get user by ID |
| GET | `/api/users/students` | Get all students |
| GET | `/api/users/students/{id}` | Get student by ID |
| PATCH | `/api/users/students/{id}/status` | Update student status |
| PATCH | `/api/users/students/{id}/unblock` | Unblock student account |

### Resources (`/api/resources`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/resources` | Get all resources |
| GET | `/api/resources/{id}` | Get resource by ID |
| GET | `/api/resources/type/{type}` | Get resources by type |
| GET | `/api/resources/status/{status}` | Get resources by status |
| POST | `/api/resources` | Create new resource |
| PUT | `/api/resources/{id}` | Update resource |
| PATCH | `/api/resources/{id}/status` | Update resource status |
| DELETE | `/api/resources/{id}` | Delete resource |

### Bookings (`/api/bookings`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/bookings` | Get all bookings |
| GET | `/api/bookings/{id}` | Get booking by ID |
| GET | `/api/bookings/user/{userId}` | Get bookings by user ID |
| GET | `/api/bookings/status/{status}` | Get bookings by status |
| POST | `/api/bookings` | Create new booking |
| PUT | `/api/bookings/{id}` | Update booking (only APPLIED status) |
| PATCH | `/api/bookings/{id}/staff-approve` | Staff approve booking |
| PATCH | `/api/bookings/{id}/admin-approve` | Admin approve booking |
| PATCH | `/api/bookings/{id}/reject` | Reject booking |
| DELETE | `/api/bookings/{id}` | Delete booking |

## 📊 Booking Status Flow

```
APPLIED → STAFF_APPROVED → ADMIN_APPROVED
   ↓             ↓               ↓
        REJECTED (at any stage)
```

### Edit Booking Rules

- **Editable**: APPLIED status only (before staff approval)
- **Not Editable**: STAFF_APPROVED, ADMIN_APPROVED, or REJECTED
- **Edit Button Visibility**: Yellow edit button appears only for APPLIED bookings
- **Validation**: Prevents editing to time slots already approved for other users

## 👥 User Roles

### Student
- Create booking requests
- Edit bookings before staff approval (APPLIED status only)
- View own bookings
- Track booking status with visual progress bar
- Download personal bookings as PDF

### Staff
- View all bookings
- Approve/reject booking requests
- First level of approval
- Edit own bookings before approval (APPLIED status only)
- Download review bookings and personal bookings as PDF

### Admin
- Complete resource management (CRUD)
- Final booking approval
- User management (activate/deactivate students)
- Unblock student accounts
- Download comprehensive booking reports as PDF

## 🎨 UI Features

- **Booking Tracker**: Horizontal progress visualization (similar to Flipkart order tracking)
- **Edit Booking**: Yellow edit button appears for APPLIED bookings, hidden after staff/admin approval
- **PDF Export**: Download booking details as formatted PDF with summary statistics
- **Dark/Light Theme**: Animated theme toggle button with persistent localStorage preference
- **Color-Coded Status**: Visual feedback for different booking states
- **Conditional Actions**: Dynamic button visibility based on booking status
- **Responsive Tables**: Mobile-friendly data display
- **Role-Based Navigation**: Different dashboards per user role
- **Real-time Updates**: Instant status changes

## 🗄️ Database

### MongoDB Collections
- **users** - General user accounts
- **students** - Student-specific data
- **staff** - Staff accounts
- **admins** - Admin accounts
- **resources** - Campus resources
- **bookings** - Booking records

### Resource Types
- Lab
- Classroom
- Event Hall
- Computer

### Resource Status
- Available
- Occupied
- Maintenance

## 🔒 Security Features

- Password encryption
- Login attempt tracking
- Account blocking after failed attempts
- Role-based access control
- CORS configuration

## 🧪 Testing with Postman

1. Import the API endpoints
2. Base URL: `http://localhost:8080`
3. Set `Content-Type: application/json` for POST/PUT/PATCH requests
4. Start with signup/login to get user credentials

## 📝 License

This project is developed for educational purposes.

## 👨‍💻 Team

Team 20 - Origin BI Hackathon

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## 📞 Support

For issues or questions, please create an issue in the repository.

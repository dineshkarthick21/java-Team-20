# Campus Resource Management System - Backend

Spring Boot backend for Campus Resource Management System with REST API endpoints.

## Technology Stack

- **Java**: 17
- **Spring Boot**: 3.2.0
- **Database**: H2 (In-memory for development)
- **Build Tool**: Maven
- **ORM**: JPA/Hibernate

## Project Structure

```
backend/
├── src/
│   └── main/
│       ├── java/com/campus/resourcemanagement/
│       │   ├── config/          # Configuration files (CORS, Data Initializer)
│       │   ├── controller/      # REST Controllers
│       │   ├── dto/             # Data Transfer Objects
│       │   ├── entity/          # JPA Entities
│       │   ├── repository/      # JPA Repositories
│       │   ├── service/         # Business Logic
│       │   └── ResourceManagementApplication.java
│       └── resources/
│           └── application.properties
└── pom.xml
```

## Database Schema

### Entities

1. **User** - Student, Staff, Admin users
2. **Resource** - Labs, Classrooms, Event Halls, Computers
3. **Booking** - Resource booking records

## API Endpoints

### Authentication (`/api/auth`)
- `POST /api/auth/signup` - Register new user
- `POST /api/auth/login` - User login

### Users (`/api/users`)
- `GET /api/users/{id}` - Get user by ID

### Resources (`/api/resources`)
- `GET /api/resources` - Get all resources
- `GET /api/resources/{id}` - Get resource by ID
- `GET /api/resources/type/{type}` - Get resources by type
- `GET /api/resources/status/{status}` - Get resources by status
- `POST /api/resources` - Create new resource
- `PUT /api/resources/{id}` - Update resource
- `PATCH /api/resources/{id}/status` - Update resource status
- `DELETE /api/resources/{id}` - Delete resource

### Bookings (`/api/bookings`)
- `GET /api/bookings` - Get all bookings
- `GET /api/bookings/{id}` - Get booking by ID
- `GET /api/bookings/user/{userId}` - Get bookings by user
- `GET /api/bookings/status/{status}` - Get bookings by status
- `POST /api/bookings` - Create new booking
- `PATCH /api/bookings/{id}/approve` - Approve booking
- `PATCH /api/bookings/{id}/reject` - Reject booking

## Running the Application

### Prerequisites
- Java 17 or higher
- Maven 3.6+

### Steps

1. **Navigate to backend directory**:
   ```bash
   cd backend
   ```

2. **Build the project**:
   ```bash
   mvn clean install
   ```

3. **Run the application**:
   ```bash
   mvn spring-boot:run
   ```

4. **Application will start on**: `http://localhost:8080`

## H2 Database Console

Access H2 console at: `http://localhost:8080/h2-console`

- **JDBC URL**: `jdbc:h2:mem:campusdb`
- **Username**: `sa`
- **Password**: (leave empty)

## Sample Data

The application automatically initializes with sample data:

### Users
- **Student**: `student@campus.com` / `student123`
- **Staff**: `staff@campus.com` / `staff123`
- **Admin**: `admin@campus.com` / `admin123`

### Resources
- CSE Lab (Lab, 50 capacity)
- Academic Block Lab (Lab, 40 capacity)
- LT Lab (Classroom, 60 capacity)
- Bhumi Lab (Lab, 30 capacity) - Under Maintenance
- T&P Lab (Lab, 45 capacity)
- Main Event Hall (Event Hall, 200 capacity)
- Computer Lab 1 (Computer, 35 capacity) - Occupied

## CORS Configuration

CORS is configured to allow requests from:
- `http://localhost:3001` (React frontend)

## Features

- ✅ User Authentication (Signup/Login)
- ✅ Role-based access (Student, Staff, Admin)
- ✅ Resource Management (CRUD operations)
- ✅ Booking Management
- ✅ Double-booking prevention
- ✅ Status tracking for bookings (PENDING, APPROVED, REJECTED)
- ✅ Resource status management (AVAILABLE, OCCUPIED, MAINTENANCE)

## API Testing

You can test APIs using:
- **Postman**
- **cURL**
- **Browser** (for GET requests)

### Example: Login Request
```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"student@campus.com","password":"student123"}'
```

## Development Notes

- H2 database is used for development (in-memory)
- For production, configure MySQL in `application.properties`
- Passwords are stored in plain text (implement hashing for production)
- No JWT/security implemented (add Spring Security for production)

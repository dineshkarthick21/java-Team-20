package com.campus.resourcemanagement.service;

import com.campus.resourcemanagement.dto.BookingRequest;
import com.campus.resourcemanagement.dto.BookingResponse;
import com.campus.resourcemanagement.entity.Booking;
import com.campus.resourcemanagement.entity.Resource;
import com.campus.resourcemanagement.entity.Student;
import com.campus.resourcemanagement.entity.Staff;
import com.campus.resourcemanagement.entity.Admin;
import com.campus.resourcemanagement.entity.User;
import com.campus.resourcemanagement.repository.BookingRepository;
import com.campus.resourcemanagement.repository.ResourceRepository;
import com.campus.resourcemanagement.repository.StudentRepository;
import com.campus.resourcemanagement.repository.StaffRepository;
import com.campus.resourcemanagement.repository.AdminRepository;
import com.campus.resourcemanagement.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class BookingService {
    
    private final BookingRepository bookingRepository;
    private final StudentRepository studentRepository;
    private final StaffRepository staffRepository;
    private final AdminRepository adminRepository;
    private final UserRepository userRepository;
    private final ResourceRepository resourceRepository;
    
    public List<BookingResponse> getAllBookings() {
        return bookingRepository.findAll().stream()
            .map(this::mapToBookingResponse)
            .collect(Collectors.toList());
    }
    
    public List<BookingResponse> getBookingsByUserId(String userId) {
        return bookingRepository.findByUserId(userId).stream()
            .map(this::mapToBookingResponse)
            .collect(Collectors.toList());
    }
    
    public List<BookingResponse> getBookingsByStatus(Booking.BookingStatus status) {
        return bookingRepository.findByStatus(status).stream()
            .map(this::mapToBookingResponse)
            .collect(Collectors.toList());
    }
    
    public BookingResponse getBookingById(String id) {
        Booking booking = bookingRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Booking not found"));
        return mapToBookingResponse(booking);
    }
    
    @Transactional
    public BookingResponse createBooking(BookingRequest request) {
        // Check if student is ACTIVE (only for STUDENT role)
        if ("STUDENT".equalsIgnoreCase(request.getUserRole())) {
            // Try students collection first
            Optional<Student> studentOpt = studentRepository.findById(request.getUserId());
            if (studentOpt.isPresent()) {
                Student student = studentOpt.get();
                if (student.getStatus() == Student.UserStatus.INACTIVE) {
                    throw new RuntimeException("Your account is inactive. You have reached the booking limit (2 bookings per day). Please contact admin to reactivate your account.");
                }
            } else {
                // Try old users collection
                Optional<User> userOpt = userRepository.findById(request.getUserId());
                if (userOpt.isPresent()) {
                    User user = userOpt.get();
                    if (user.getStatus() == User.UserStatus.INACTIVE) {
                        throw new RuntimeException("Your account is inactive. You have reached the booking limit (2 bookings per day). Please contact admin to reactivate your account.");
                    }
                }
            }
        }
        
        // Verify user exists in any collection (backward compatibility)
        String userName = getUserName(request.getUserId(), request.getUserRole());
        if (userName == null) {
            // User not found in any collection
            throw new RuntimeException("User not found. User ID: " + request.getUserId());
        }
        
        Resource resource = resourceRepository.findById(request.getResourceId())
            .orElseThrow(() -> new RuntimeException("Resource not found"));
        
        // Check if user already has a booking for the same resource, date, and time slot
        List<Booking> existingBookings = bookingRepository.findByResourceIdAndBookingDateAndTimeSlot(
            request.getResourceId(), request.getBookingDate(), request.getTimeSlot());
        
        // Check if this user already has an active booking (not rejected)
        boolean userAlreadyApplied = existingBookings.stream()
            .anyMatch(b -> b.getUserId().equals(request.getUserId()) && 
                          b.getStatus() != Booking.BookingStatus.REJECTED);
        
        if (userAlreadyApplied) {
            throw new RuntimeException("Sorry! You have already applied for this resource at the same date and time slot.");
        }
        
        // Check if another user has an approved booking (ADMIN_APPROVED or STAFF_APPROVED)
        boolean isApprovedForOtherUser = existingBookings.stream()
            .anyMatch(b -> !b.getUserId().equals(request.getUserId()) && 
                          (b.getStatus() == Booking.BookingStatus.ADMIN_APPROVED || 
                           b.getStatus() == Booking.BookingStatus.STAFF_APPROVED));
        
        if (isApprovedForOtherUser) {
            throw new RuntimeException("Sorry! This resource has been approved for another user at this date and time slot.");
        }
        
        // Create new booking
        Booking booking = new Booking();
        booking.setUserId(request.getUserId());
        booking.setUserRole(request.getUserRole());
        booking.setResourceId(request.getResourceId());
        booking.setBookingDate(request.getBookingDate());
        booking.setTimeSlot(request.getTimeSlot());
        booking.setPurpose(request.getPurpose());
        booking.setStatus(Booking.BookingStatus.APPLIED);
        booking.onCreate();
        
        Booking savedBooking = bookingRepository.save(booking);
        
        // After successful booking creation, check if this is the 2nd booking of the day for a STUDENT
        // If so, mark the student account as INACTIVE (part of the booking limit cycle)
        if ("STUDENT".equalsIgnoreCase(request.getUserRole())) {
            long updatedBookingCount = bookingRepository.countByUserIdAndBookingDate(
                request.getUserId(), 
                request.getBookingDate()
            );
            
            if (updatedBookingCount >= 2) {
                // Try students collection first
                Optional<Student> studentOpt = studentRepository.findById(request.getUserId());
                if (studentOpt.isPresent()) {
                    Student student = studentOpt.get();
                    student.setStatus(Student.UserStatus.INACTIVE);
                    studentRepository.save(student);
                } else {
                    // Try old users collection
                    Optional<User> userOpt = userRepository.findById(request.getUserId());
                    if (userOpt.isPresent()) {
                        User user = userOpt.get();
                        user.setStatus(User.UserStatus.INACTIVE);
                        userRepository.save(user);
                    }
                }
            }
        }
        
        return mapToBookingResponse(savedBooking);
    }
    
    // Staff approves booking: APPLIED → STAFF_APPROVED
    @Transactional
    public BookingResponse staffApproveBooking(String id) {
        Booking booking = bookingRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Booking not found"));
        
        if (booking.getStatus() != Booking.BookingStatus.APPLIED) {
            throw new RuntimeException("Only APPLIED bookings can be approved by staff");
        }
        
        booking.setStatus(Booking.BookingStatus.STAFF_APPROVED);
        booking.setStaffApprovedAt(LocalDateTime.now());
        
        Booking updatedBooking = bookingRepository.save(booking);
        return mapToBookingResponse(updatedBooking);
    }
    
    // Admin approves booking: APPLIED → ADMIN_APPROVED or STAFF_APPROVED → ADMIN_APPROVED
    @Transactional
    public BookingResponse adminApproveBooking(String id) {
        Booking booking = bookingRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Booking not found"));
        
        if (booking.getStatus() != Booking.BookingStatus.STAFF_APPROVED && 
            booking.getStatus() != Booking.BookingStatus.APPLIED) {
            throw new RuntimeException("Only APPLIED or STAFF_APPROVED bookings can be approved by admin");
        }
        
        // Check for double booking before final approval
        List<Booking> existingBookings = bookingRepository.findByResourceIdAndBookingDateAndTimeSlot(
            booking.getResourceId(), booking.getBookingDate(), booking.getTimeSlot());
        
        boolean isDoubleBooked = existingBookings.stream()
            .anyMatch(b -> b.getStatus() == Booking.BookingStatus.ADMIN_APPROVED && 
                          !b.getId().equals(id));
        
        if (isDoubleBooked) {
            throw new RuntimeException("Cannot approve: Resource is already booked for this date and time slot");
        }
        
        booking.setStatus(Booking.BookingStatus.ADMIN_APPROVED);
        booking.setAdminApprovedAt(LocalDateTime.now());
        
        Booking updatedBooking = bookingRepository.save(booking);
        return mapToBookingResponse(updatedBooking);
    }
    
    @Transactional
    public BookingResponse rejectBooking(String id, String rejectionReason) {
        Booking booking = bookingRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Booking not found"));
        
        booking.setStatus(Booking.BookingStatus.REJECTED);
        booking.setRejectionReason(rejectionReason);
        
        Booking updatedBooking = bookingRepository.save(booking);
        return mapToBookingResponse(updatedBooking);
    }
    
    private BookingResponse mapToBookingResponse(Booking booking) {
        BookingResponse response = new BookingResponse();
        response.setId(booking.getId());
        response.setUserId(booking.getUserId());
        response.setResourceId(booking.getResourceId());
        
        // Fetch user name from appropriate collection
        String userName = getUserName(booking.getUserId(), booking.getUserRole());
        response.setUserName(userName != null ? userName : "Unknown User");
        
        // Fetch resource name
        resourceRepository.findById(booking.getResourceId())
            .ifPresent(resource -> response.setResourceName(resource.getName()));
        
        response.setBookingDate(booking.getBookingDate());
        response.setTimeSlot(booking.getTimeSlot());
        response.setPurpose(booking.getPurpose());
        response.setStatus(booking.getStatus().name());
        response.setCreatedAt(booking.getCreatedAt());
        response.setStaffApprovedAt(booking.getStaffApprovedAt());
        response.setAdminApprovedAt(booking.getAdminApprovedAt());
        response.setRejectionReason(booking.getRejectionReason());
        return response;
    }
    
    private String getUserName(String userId, String userRole) {
        if (userId == null) {
            return null;
        }
        
        // First, always check the old users collection for backward compatibility
        Optional<User> user = userRepository.findById(userId);
        if (user.isPresent()) {
            return user.get().getName();
        }
        
        // If userRole is provided, check the specific collection
        if (userRole != null) {
            switch (userRole.toUpperCase()) {
                case "STUDENT":
                    Optional<Student> student = studentRepository.findById(userId);
                    if (student.isPresent()) {
                        return student.get().getName();
                    }
                    break;
                case "STAFF":
                    Optional<Staff> staff = staffRepository.findById(userId);
                    if (staff.isPresent()) {
                        return staff.get().getName();
                    }
                    break;
                case "ADMIN":
                    Optional<Admin> admin = adminRepository.findById(userId);
                    if (admin.isPresent()) {
                        return admin.get().getName();
                    }
                    break;
            }
        }
        
        // If userRole is not provided or user not found yet, search all new collections
        Optional<Student> student = studentRepository.findById(userId);
        if (student.isPresent()) {
            return student.get().getName();
        }
        
        Optional<Staff> staff = staffRepository.findById(userId);
        if (staff.isPresent()) {
            return staff.get().getName();
        }
        
        Optional<Admin> admin = adminRepository.findById(userId);
        if (admin.isPresent()) {
            return admin.get().getName();
        }
        
        return null;
    }
    
    @Transactional
    public void deleteBooking(String id) {
        Booking booking = bookingRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Booking not found"));
        
        bookingRepository.delete(booking);
    }
    
    @Transactional
    public BookingResponse updateBooking(String id, BookingRequest request) {
        Booking booking = bookingRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Booking not found"));
        
        // Only allow updates for APPLIED bookings (before staff/admin approval)
        if (booking.getStatus() != Booking.BookingStatus.APPLIED) {
            throw new RuntimeException("Cannot edit a booking after it has been approved or rejected");
        }
        
        // Verify resource exists
        Resource resource = resourceRepository.findById(request.getResourceId())
            .orElseThrow(() -> new RuntimeException("Resource not found"));
        
        // Check if another user has an approved booking for the new time slot (if changed)
        if (!booking.getResourceId().equals(request.getResourceId()) ||
            !booking.getBookingDate().equals(request.getBookingDate()) ||
            !booking.getTimeSlot().equals(request.getTimeSlot())) {
            
            List<Booking> existingBookings = bookingRepository.findByResourceIdAndBookingDateAndTimeSlot(
                request.getResourceId(), request.getBookingDate(), request.getTimeSlot());
            
            boolean isApprovedForOtherUser = existingBookings.stream()
                .anyMatch(b -> !b.getId().equals(id) && 
                              (b.getStatus() == Booking.BookingStatus.ADMIN_APPROVED || 
                               b.getStatus() == Booking.BookingStatus.STAFF_APPROVED));
            
            if (isApprovedForOtherUser) {
                throw new RuntimeException("Sorry! This resource has been approved for another user at this date and time slot.");
            }
        }
        
        // Update booking details
        booking.setResourceId(request.getResourceId());
        booking.setBookingDate(request.getBookingDate());
        booking.setTimeSlot(request.getTimeSlot());
        booking.setPurpose(request.getPurpose());
        
        Booking updatedBooking = bookingRepository.save(booking);
        return mapToBookingResponse(updatedBooking);
    }
}

package com.campus.resourcemanagement.repository;

import com.campus.resourcemanagement.entity.Booking;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface BookingRepository extends MongoRepository<Booking, String> {
    List<Booking> findByUserId(String userId);
    List<Booking> findByStatus(Booking.BookingStatus status);
    List<Booking> findByResourceIdAndBookingDate(String resourceId, LocalDate bookingDate);
    List<Booking> findByResourceIdAndBookingDateAndTimeSlot(
        String resourceId, LocalDate bookingDate, String timeSlot);
    Optional<Booking> findByResourceIdAndBookingDateAndTimeSlotAndStatus(
        String resourceId, LocalDate bookingDate, String timeSlot, Booking.BookingStatus status);
    
    // Count bookings for a user on a specific date
    long countByUserIdAndBookingDate(String userId, LocalDate bookingDate);
}

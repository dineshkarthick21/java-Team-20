package com.campus.resourcemanagement.entity;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Document(collection = "bookings")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Booking {
    
    @Id
    private String id;
    
    private String userId;
    
    private String userRole;
    
    private String resourceId;
    
    private LocalDate bookingDate;
    
    private String timeSlot;
    
    private String purpose;
    
    private BookingStatus status;
    
    private LocalDateTime createdAt;
    
    private LocalDateTime staffApprovedAt;
    
    private LocalDateTime adminApprovedAt;
    
    private String rejectionReason;
    
    public void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
        if (status == null) {
            status = BookingStatus.APPLIED;
        }
    }
    
    public enum BookingStatus {
        APPLIED, APPROVED, STAFF_APPROVED, ADMIN_APPROVED, REJECTED
    }
}

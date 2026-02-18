package com.campus.resourcemanagement.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class BookingResponse {
    private String id;
    private String userId;
    private String userName;
    private String resourceId;
    private String resourceName;
    private LocalDate bookingDate;
    private String timeSlot;
    private String purpose;
    private String status;
    private LocalDateTime createdAt;
    private LocalDateTime staffApprovedAt;
    private LocalDateTime adminApprovedAt;
    private String rejectionReason;
}

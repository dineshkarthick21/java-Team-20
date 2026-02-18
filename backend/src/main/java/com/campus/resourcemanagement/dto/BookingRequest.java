package com.campus.resourcemanagement.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class BookingRequest {
    
    @NotNull(message = "User ID is required")
    private String userId;
    
    @NotNull(message = "Resource ID is required")
    private String resourceId;
    
    @NotNull(message = "Booking date is required")
    private LocalDate bookingDate;
    
    @NotBlank(message = "Time slot is required")
    private String timeSlot;
    
    @NotBlank(message = "Purpose is required")
    private String purpose;
    
    private String userRole;
}

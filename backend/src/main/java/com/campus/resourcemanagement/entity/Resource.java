package com.campus.resourcemanagement.entity;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Document(collection = "resources")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Resource {
    
    @Id
    private String id;
    
    private String name;
    
    private ResourceType type;
    
    private Integer capacity;
    
    private ResourceStatus status;
    
    public void onCreate() {
        if (status == null) {
            status = ResourceStatus.AVAILABLE;
        }
    }
    
    public enum ResourceType {
        LAB, CLASSROOM, EVENT_HALL, COMPUTER
    }
    
    public enum ResourceStatus {
        AVAILABLE, OCCUPIED, MAINTENANCE
    }
}

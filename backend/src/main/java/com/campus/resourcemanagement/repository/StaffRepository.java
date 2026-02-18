package com.campus.resourcemanagement.repository;

import com.campus.resourcemanagement.entity.Staff;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface StaffRepository extends MongoRepository<Staff, String> {
    Optional<Staff> findByEmail(String email);
    boolean existsByEmail(String email);
}

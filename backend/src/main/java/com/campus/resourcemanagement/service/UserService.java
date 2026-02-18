package com.campus.resourcemanagement.service;

import com.campus.resourcemanagement.dto.*;
import com.campus.resourcemanagement.entity.User;
import com.campus.resourcemanagement.entity.Student;
import com.campus.resourcemanagement.entity.Staff;
import com.campus.resourcemanagement.entity.Admin;
import com.campus.resourcemanagement.repository.UserRepository;
import com.campus.resourcemanagement.repository.StudentRepository;
import com.campus.resourcemanagement.repository.StaffRepository;
import com.campus.resourcemanagement.repository.AdminRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Service
@RequiredArgsConstructor
public class UserService {
    
    private final UserRepository userRepository;
    private final StudentRepository studentRepository;
    private final StaffRepository staffRepository;
    private final AdminRepository adminRepository;
    
    @Transactional
    public UserResponse signup(SignupRequest request) {
        String email = request.getEmail();
        String role = request.getRole().toUpperCase();
        
        // Check if email already exists in any collection
        if (userRepository.existsByEmail(email) || 
            studentRepository.existsByEmail(email) ||
            staffRepository.existsByEmail(email) ||
            adminRepository.existsByEmail(email)) {
            throw new RuntimeException("Email already exists");
        }
        
        // Create role-specific entity
        switch (role) {
            case "STUDENT":
                Student student = new Student();
                student.setName(request.getName());
                student.setEmail(request.getEmail());
                student.setPassword(request.getPassword()); // In production, hash the password
                student.setPhone(request.getPhone());
                student.setStudentId(request.getStudentId());
                student.setDepartment(request.getDepartment());
                student.onCreate();
                
                Student savedStudent = studentRepository.save(student);
                
                UserResponse studentResponse = new UserResponse();
                studentResponse.setId(savedStudent.getId());
                studentResponse.setName(savedStudent.getName());
                studentResponse.setEmail(savedStudent.getEmail());
                studentResponse.setPhone(savedStudent.getPhone());
                studentResponse.setRole("STUDENT");
                studentResponse.setStatus(savedStudent.getStatus().name());
                studentResponse.setCreatedAt(savedStudent.getCreatedAt());
                studentResponse.setDepartment(savedStudent.getDepartment());
                studentResponse.setStudentId(savedStudent.getStudentId());
                return studentResponse;
                
            case "STAFF":
                Staff staff = new Staff();
                staff.setName(request.getName());
                staff.setEmail(request.getEmail());
                staff.setPassword(request.getPassword()); // In production, hash the password
                staff.setPhone(request.getPhone());
                staff.setStaffId(request.getStudentId()); // Using studentId field as employeeId
                staff.setDepartment(request.getDepartment());
                staff.onCreate();
                
                Staff savedStaff = staffRepository.save(staff);
                
                UserResponse staffResponse = new UserResponse();
                staffResponse.setId(savedStaff.getId());
                staffResponse.setName(savedStaff.getName());
                staffResponse.setEmail(savedStaff.getEmail());
                staffResponse.setPhone(savedStaff.getPhone());
                staffResponse.setRole("STAFF");
                staffResponse.setStatus(savedStaff.getStatus().name());
                staffResponse.setCreatedAt(savedStaff.getCreatedAt());
                staffResponse.setDepartment(savedStaff.getDepartment());
                staffResponse.setStudentId(savedStaff.getStaffId());
                return staffResponse;
                
            case "ADMIN":
                Admin admin = new Admin();
                admin.setName(request.getName());
                admin.setEmail(request.getEmail());
                admin.setPassword(request.getPassword()); // In production, hash the password
                admin.setPhone(request.getPhone());
                admin.setAdminId(request.getStudentId()); // Using studentId field as employeeId
                admin.setDepartment(request.getDepartment());
                admin.onCreate();
                
                Admin savedAdmin = adminRepository.save(admin);
                
                UserResponse adminResponse = new UserResponse();
                adminResponse.setId(savedAdmin.getId());
                adminResponse.setName(savedAdmin.getName());
                adminResponse.setEmail(savedAdmin.getEmail());
                adminResponse.setPhone(savedAdmin.getPhone());
                adminResponse.setRole("ADMIN");
                adminResponse.setStatus(savedAdmin.getStatus().name());
                adminResponse.setCreatedAt(savedAdmin.getCreatedAt());
                adminResponse.setDepartment(savedAdmin.getDepartment());
                adminResponse.setStudentId(savedAdmin.getAdminId());
                return adminResponse;
                
            default:
                throw new RuntimeException("Invalid role: " + role);
        }
    }
    
    public UserResponse login(LoginRequest request) {
        // Check students collection
        Optional<Student> studentOpt = studentRepository.findByEmail(request.getEmail());
        
        if (studentOpt.isPresent()) {
            Student student = studentOpt.get();
            
            // Check if account is blocked
            if (student.isBlocked()) {
                throw new RuntimeException("Your account is locked due to multiple failed login attempts. Please contact admin to unlock your account.");
            }
            
            // Verify password
            if (!student.getPassword().equals(request.getPassword())) {
                // Increment login attempts
                student.setLoginAttempts(student.getLoginAttempts() + 1);
                
                // Block if reached 3 attempts
                if (student.getLoginAttempts() >= 3) {
                    student.setBlocked(true);
                    studentRepository.save(student);
                    throw new RuntimeException("Your account has been locked due to 3 failed login attempts. Please contact admin to unlock your account.");
                }
                
                studentRepository.save(student);
                int remainingAttempts = 3 - student.getLoginAttempts();
                throw new RuntimeException("Invalid password. " + remainingAttempts + " attempt(s) remaining before account is locked.");
            }
            
            // Successful login - reset attempts
            student.setLoginAttempts(0);
            studentRepository.save(student);
            
            // Map to UserResponse
            UserResponse response = new UserResponse();
            response.setId(student.getId());
            response.setName(student.getName());
            response.setEmail(student.getEmail());
            response.setPhone(student.getPhone());
            response.setRole("STUDENT");
            response.setStatus(student.getStatus().name());
            response.setCreatedAt(student.getCreatedAt());
            response.setDepartment(student.getDepartment());
            response.setStudentId(student.getStudentId());
            return response;
        }
        
        // Check staff collection
        Optional<Staff> staffOpt = staffRepository.findByEmail(request.getEmail());
        
        if (staffOpt.isPresent()) {
            Staff staff = staffOpt.get();
            
            // Verify password (no blocking for staff)
            if (!staff.getPassword().equals(request.getPassword())) {
                throw new RuntimeException("Invalid email or password");
            }
            
            // Map to UserResponse
            UserResponse response = new UserResponse();
            response.setId(staff.getId());
            response.setName(staff.getName());
            response.setEmail(staff.getEmail());
            response.setPhone(staff.getPhone());
            response.setRole("STAFF");
            response.setStatus(staff.getStatus().name());
            response.setCreatedAt(staff.getCreatedAt());
            response.setDepartment(staff.getDepartment());
            response.setStudentId(staff.getStaffId());
            return response;
        }
        
        // Check admin collection
        Optional<Admin> adminOpt = adminRepository.findByEmail(request.getEmail());
        
        if (adminOpt.isPresent()) {
            Admin admin = adminOpt.get();
            
            // Verify password (no blocking for admin)
            if (!admin.getPassword().equals(request.getPassword())) {
                throw new RuntimeException("Invalid email or password");
            }
            
            // Map to UserResponse
            UserResponse response = new UserResponse();
            response.setId(admin.getId());
            response.setName(admin.getName());
            response.setEmail(admin.getEmail());
            response.setPhone(admin.getPhone());
            response.setRole("ADMIN");
            response.setStatus(admin.getStatus().name());
            response.setCreatedAt(admin.getCreatedAt());
            response.setDepartment(admin.getDepartment());
            response.setStudentId(admin.getAdminId());
            return response;
        }
        
        // Fall back to users collection (for backward compatibility with old data)
        Optional<User> userOpt = userRepository.findByEmail(request.getEmail());
        
        if (userOpt.isEmpty()) {
            throw new RuntimeException("Invalid email or password");
        }
        
        User user = userOpt.get();
        
        // If this is a STUDENT in the users collection, apply blocking logic
        if (user.getRole() == User.Role.STUDENT) {
            // Check if account is blocked
            if (user.isBlocked()) {
                throw new RuntimeException("Your account is locked due to multiple failed login attempts. Please contact admin to unlock your account.");
            }
            
            // Verify password
            if (!user.getPassword().equals(request.getPassword())) {
                // Increment login attempts
                user.setLoginAttempts(user.getLoginAttempts() + 1);
                
                // Block if reached 3 attempts
                if (user.getLoginAttempts() >= 3) {
                    user.setBlocked(true);
                    userRepository.save(user);
                    throw new RuntimeException("Your account has been locked due to 3 failed login attempts. Please contact admin to unlock your account.");
                }
                
                userRepository.save(user);
                int remainingAttempts = 3 - user.getLoginAttempts();
                throw new RuntimeException("Invalid password. " + remainingAttempts + " attempt(s) remaining before account is locked.");
            }
            
            // Successful login - reset attempts
            user.setLoginAttempts(0);
            userRepository.save(user);
            
            return mapToUserResponse(user);
        }
        
        // For STAFF and ADMIN in old users collection - no blocking, just simple password check
        if (!user.getPassword().equals(request.getPassword())) {
            throw new RuntimeException("Invalid email or password");
        }
        
        return mapToUserResponse(user);
    }
    
    public UserResponse getUserById(String id) {
        User user = userRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("User not found"));
        return mapToUserResponse(user);
    }
    
    private UserResponse mapToUserResponse(User user) {
        UserResponse response = new UserResponse();
        response.setId(user.getId());
        response.setName(user.getName());
        response.setEmail(user.getEmail());
        response.setPhone(user.getPhone());
        response.setRole(user.getRole().name());
        response.setStatus(user.getStatus().name());
        response.setCreatedAt(user.getCreatedAt());
        return response;
    }
}

package com.campus.resourcemanagement.controller;

import com.campus.resourcemanagement.dto.UserResponse;
import com.campus.resourcemanagement.entity.Student;
import com.campus.resourcemanagement.entity.User;
import com.campus.resourcemanagement.repository.StudentRepository;
import com.campus.resourcemanagement.repository.UserRepository;
import com.campus.resourcemanagement.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:3000")
public class UserController {
    
    private final UserService userService;
    private final StudentRepository studentRepository;
    private final UserRepository userRepository;
    
    @GetMapping("/{id}")
    public ResponseEntity<UserResponse> getUserById(@PathVariable String id) {
        try {
            UserResponse user = userService.getUserById(id);
            return ResponseEntity.ok(user);
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }
    
    // Get all students with their status (from both collections)
    @GetMapping("/students")
    public ResponseEntity<?> getAllStudents() {
        try {
            List<Map<String, Object>> allStudents = new ArrayList<>();
            
            // Get from students collection
            List<Student> students = studentRepository.findAll();
            for (Student student : students) {
                Map<String, Object> studentMap = new HashMap<>();
                studentMap.put("id", student.getId());
                studentMap.put("name", student.getName());
                studentMap.put("email", student.getEmail());
                studentMap.put("phone", student.getPhone());
                studentMap.put("studentId", student.getStudentId());
                studentMap.put("department", student.getDepartment());
                studentMap.put("status", student.getStatus().toString());
                studentMap.put("isBlocked", student.isBlocked());
                studentMap.put("loginAttempts", student.getLoginAttempts());
                studentMap.put("source", "students");
                allStudents.add(studentMap);
            }
            
            // Get from users collection (role = STUDENT)
            List<User> userStudents = userRepository.findByRole(User.Role.STUDENT);
            for (User user : userStudents) {
                Map<String, Object> studentMap = new HashMap<>();
                studentMap.put("id", user.getId());
                studentMap.put("name", user.getName());
                studentMap.put("email", user.getEmail());
                studentMap.put("phone", user.getPhone());
                studentMap.put("studentId", "N/A");
                studentMap.put("department", "N/A");
                studentMap.put("status", user.getStatus().toString());
                studentMap.put("isBlocked", user.isBlocked());
                studentMap.put("loginAttempts", user.getLoginAttempts());
                studentMap.put("source", "users");
                allStudents.add(studentMap);
            }
            
            return ResponseEntity.ok(allStudents);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    // Update student status (activate/deactivate) - works for both collections
    @PatchMapping("/students/{id}/status")
    public ResponseEntity<?> updateStudentStatus(
            @PathVariable String id,
            @RequestBody Map<String, String> requestBody) {
        try {
            String statusStr = requestBody.get("status");
            if (statusStr == null) {
                Map<String, Object> error = new HashMap<>();
                error.put("success", false);
                error.put("message", "Status is required");
                return ResponseEntity.badRequest().body(error);
            }
            
            // Try students collection first
            Optional<Student> studentOpt = studentRepository.findById(id);
            if (studentOpt.isPresent()) {
                Student student = studentOpt.get();
                student.setStatus(Student.UserStatus.valueOf(statusStr.toUpperCase()));
                studentRepository.save(student);
                
                Map<String, Object> response = new HashMap<>();
                response.put("success", true);
                response.put("message", "Student status updated successfully");
                response.put("student", student);
                return ResponseEntity.ok(response);
            }
            
            // Try users collection
            Optional<User> userOpt = userRepository.findById(id);
            if (userOpt.isPresent()) {
                User user = userOpt.get();
                user.setStatus(User.UserStatus.valueOf(statusStr.toUpperCase()));
                userRepository.save(user);
                
                Map<String, Object> response = new HashMap<>();
                response.put("success", true);
                response.put("message", "Student status updated successfully");
                response.put("student", user);
                return ResponseEntity.ok(response);
            }
            
            // Not found in either collection
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", "Student not found");
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);
            
        } catch (IllegalArgumentException e) {
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", "Invalid status value");
            return ResponseEntity.badRequest().body(error);
        } catch (Exception e) {
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }
    
    // Get single student by ID (from both collections)
    @GetMapping("/students/{id}")
    public ResponseEntity<?> getStudentById(@PathVariable String id) {
        try {
            // Try students collection first
            Optional<Student> studentOpt = studentRepository.findById(id);
            if (studentOpt.isPresent()) {
                Student student = studentOpt.get();
                Map<String, Object> studentData = new HashMap<>();
                studentData.put("id", student.getId());
                studentData.put("name", student.getName());
                studentData.put("email", student.getEmail());
                studentData.put("phone", student.getPhone());
                studentData.put("status", student.getStatus().toString());
                studentData.put("department", student.getDepartment());
                studentData.put("studentId", student.getStudentId());
                studentData.put("source", "students");
                return ResponseEntity.ok(studentData);
            }
            
            // Try users collection
            Optional<User> userOpt = userRepository.findById(id);
            if (userOpt.isPresent()) {
                User user = userOpt.get();
                Map<String, Object> studentData = new HashMap<>();
                studentData.put("id", user.getId());
                studentData.put("name", user.getName());
                studentData.put("email", user.getEmail());
                studentData.put("phone", user.getPhone());
                studentData.put("status", user.getStatus().toString());
                studentData.put("department", null); // Old users don't have department
                studentData.put("studentId", null); // Old users don't have studentId
                studentData.put("source", "users");
                return ResponseEntity.ok(studentData);
            }
            
            // Not found
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", "Student not found");
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);
            
        } catch (Exception e) {
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }
    
    // Unblock student account and reset login attempts
    @PatchMapping("/students/{id}/unblock")
    public ResponseEntity<?> unblockStudent(@PathVariable String id) {
        try {
            // Try students collection first
            Optional<Student> studentOpt = studentRepository.findById(id);
            if (studentOpt.isPresent()) {
                Student student = studentOpt.get();
                student.setBlocked(false);
                student.setLoginAttempts(0);
                studentRepository.save(student);
                
                Map<String, Object> response = new HashMap<>();
                response.put("success", true);
                response.put("message", "Student account unblocked successfully");
                response.put("student", student);
                return ResponseEntity.ok(response);
            }
            
            // Try users collection
            Optional<User> userOpt = userRepository.findById(id);
            if (userOpt.isPresent()) {
                User user = userOpt.get();
                user.setBlocked(false);
                user.setLoginAttempts(0);
                userRepository.save(user);
                
                Map<String, Object> response = new HashMap<>();
                response.put("success", true);
                response.put("message", "Student account unblocked successfully");
                response.put("student", user);
                return ResponseEntity.ok(response);
            }
            
            // Not found in either collection
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", "Student not found");
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);
            
        } catch (Exception e) {
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }}
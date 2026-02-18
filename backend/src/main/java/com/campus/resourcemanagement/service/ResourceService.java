package com.campus.resourcemanagement.service;

import com.campus.resourcemanagement.dto.ResourceRequest;
import com.campus.resourcemanagement.entity.Resource;
import com.campus.resourcemanagement.repository.ResourceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ResourceService {
    
    private final ResourceRepository resourceRepository;
    
    public List<Resource> getAllResources() {
        return resourceRepository.findAll();
    }
    
    public Resource getResourceById(String id) {
        return resourceRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Resource not found"));
    }
    
    public List<Resource> getResourcesByType(Resource.ResourceType type) {
        return resourceRepository.findByType(type);
    }
    
    public List<Resource> getResourcesByStatus(Resource.ResourceStatus status) {
        return resourceRepository.findByStatus(status);
    }
    
    @Transactional
    public Resource createResource(ResourceRequest request) {
        Resource resource = new Resource();
        resource.setName(request.getName());
        resource.setType(Resource.ResourceType.valueOf(request.getType().toUpperCase().replace(" ", "_")));
        resource.setCapacity(request.getCapacity());
        resource.setStatus(Resource.ResourceStatus.valueOf(request.getStatus().toUpperCase()));
        resource.onCreate();
        
        return resourceRepository.save(resource);
    }
    
    @Transactional
    public Resource updateResource(String id, ResourceRequest request) {
        Resource resource = getResourceById(id);
        
        resource.setName(request.getName());
        resource.setType(Resource.ResourceType.valueOf(request.getType().toUpperCase().replace(" ", "_")));
        resource.setCapacity(request.getCapacity());
        resource.setStatus(Resource.ResourceStatus.valueOf(request.getStatus().toUpperCase()));
        
        return resourceRepository.save(resource);
    }
    
    @Transactional
    public Resource updateResourceStatus(String id, Resource.ResourceStatus status) {
        Resource resource = getResourceById(id);
        resource.setStatus(status);
        return resourceRepository.save(resource);
    }
    
    @Transactional
    public void deleteResource(String id) {
        if (!resourceRepository.existsById(id)) {
            throw new RuntimeException("Resource not found");
        }
        resourceRepository.deleteById(id);
    }
}

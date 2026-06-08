package com.example.demo.service;

import com.example.demo.dto.service.ServRequest;
import com.example.demo.dto.service.ServResponse;
import com.example.demo.entity.Service;
import com.example.demo.exception.ResourceNotFoundException;
import com.example.demo.repository.ServiceRepository;
import lombok.RequiredArgsConstructor;

import java.util.List;
import java.util.stream.Collectors;

@org.springframework.stereotype.Service
@RequiredArgsConstructor
public class ServService {

    private final ServiceRepository serviceRepository;

    public ServResponse create(ServRequest request) {
        Service service = Service.builder()
                .name(request.getName())
                .type(request.getType())
                .build();

        service = serviceRepository.save(service);
        return toResponse(service);
    }

    public List<ServResponse> findAll() {
        return serviceRepository.findAll().stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public ServResponse findById(Long id) {
        Service service = serviceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Service", "id", id));
        return toResponse(service);
    }

    public ServResponse update(Long id, ServRequest request) {
        Service service = serviceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Service", "id", id));

        service.setName(request.getName());
        service.setType(request.getType());

        service = serviceRepository.save(service);
        return toResponse(service);
    }

    public void delete(Long id) {
        if (!serviceRepository.existsById(id)) {
            throw new ResourceNotFoundException("Service", "id", id);
        }
        serviceRepository.deleteById(id);
    }

    private ServResponse toResponse(Service s) {
        return ServResponse.builder()
                .id(s.getId())
                .name(s.getName())
                .type(s.getType())
                .build();
    }
}

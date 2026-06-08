package com.example.demo.service;

import com.example.demo.dto.audience.AudienceRequest;
import com.example.demo.dto.audience.AudienceResponse;
import com.example.demo.entity.Audience;
import com.example.demo.exception.ResourceNotFoundException;
import com.example.demo.repository.AudienceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AudienceService {

    private final AudienceRepository audienceRepository;

    @Transactional
    public AudienceResponse create(AudienceRequest request) {
        Audience audience = Audience.builder()
                .name(request.getName())
                .description(request.getDescription())
                .build();

        audience = audienceRepository.save(audience);
        return toResponse(audience);
    }

    @Transactional(readOnly = true)
    public List<AudienceResponse> findAll() {
        return audienceRepository.findAll().stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public AudienceResponse findById(Long id) {
        Audience audience = audienceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Audience", "id", id));
        return toResponse(audience);
    }

    @Transactional
    public AudienceResponse update(Long id, AudienceRequest request) {
        Audience audience = audienceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Audience", "id", id));

        audience.setName(request.getName());
        audience.setDescription(request.getDescription());

        audience = audienceRepository.save(audience);
        return toResponse(audience);
    }

    @Transactional
    public void delete(Long id) {
        if (!audienceRepository.existsById(id)) {
            throw new ResourceNotFoundException("Audience", "id", id);
        }
        audienceRepository.deleteById(id);
    }

    private AudienceResponse toResponse(Audience a) {
        return AudienceResponse.builder()
                .id(a.getId())
                .name(a.getName())
                .description(a.getDescription())
                .build();
    }
}

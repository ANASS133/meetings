package com.example.demo.service;

import com.example.demo.dto.participant.ParticipantRequest;
import com.example.demo.dto.participant.ParticipantResponse;
import com.example.demo.entity.Participant;
import com.example.demo.exception.BadRequestException;
import com.example.demo.exception.ResourceNotFoundException;
import com.example.demo.repository.ParticipantRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ParticipantService {

    private final ParticipantRepository participantRepository;

    @Transactional
    public ParticipantResponse create(ParticipantRequest request) {
        if (participantRepository.existsByEmail(request.getEmail())) {
            throw new BadRequestException("Participant already exists with email: " + request.getEmail());
        }

        Participant participant = Participant.builder()
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .email(request.getEmail())
                .phone(request.getPhone())
                .build();

        participant = participantRepository.save(participant);
        return toResponse(participant);
    }

    @Transactional(readOnly = true)
    public List<ParticipantResponse> findAll() {
        return participantRepository.findAll().stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public ParticipantResponse findById(Long id) {
        Participant participant = participantRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Participant", "id", id));
        return toResponse(participant);
    }

    @Transactional
    public ParticipantResponse update(Long id, ParticipantRequest request) {
        Participant participant = participantRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Participant", "id", id));

        participant.setFirstName(request.getFirstName());
        participant.setLastName(request.getLastName());
        participant.setEmail(request.getEmail());
        participant.setPhone(request.getPhone());

        participant = participantRepository.save(participant);
        return toResponse(participant);
    }

    @Transactional
    public void delete(Long id) {
        if (!participantRepository.existsById(id)) {
            throw new ResourceNotFoundException("Participant", "id", id);
        }
        participantRepository.deleteById(id);
    }

    private ParticipantResponse toResponse(Participant p) {
        return ParticipantResponse.builder()
                .id(p.getId())
                .firstName(p.getFirstName())
                .lastName(p.getLastName())
                .email(p.getEmail())
                .phone(p.getPhone())
                .build();
    }
}

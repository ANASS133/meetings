package com.example.demo.controller;

import com.example.demo.dto.participant.ParticipantRequest;
import com.example.demo.dto.participant.ParticipantResponse;
import com.example.demo.service.ParticipantService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/participants")
@RequiredArgsConstructor
public class ParticipantController {

    private final ParticipantService participantService;

    @PostMapping
    public ResponseEntity<ParticipantResponse> create(@Valid @RequestBody ParticipantRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(participantService.create(request));
    }

    @GetMapping
    public ResponseEntity<List<ParticipantResponse>> findAll() {
        return ResponseEntity.ok(participantService.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<ParticipantResponse> findById(@PathVariable Long id) {
        return ResponseEntity.ok(participantService.findById(id));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ParticipantResponse> update(@PathVariable Long id,
                                                       @Valid @RequestBody ParticipantRequest request) {
        return ResponseEntity.ok(participantService.update(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        participantService.delete(id);
        return ResponseEntity.noContent().build();
    }
}

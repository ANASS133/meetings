package com.example.demo.controller;

import com.example.demo.dto.audience.AudienceRequest;
import com.example.demo.dto.audience.AudienceResponse;
import com.example.demo.service.AudienceService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/audiences")
@RequiredArgsConstructor
public class AudienceController {

    private final AudienceService audienceService;

    @PostMapping
    public ResponseEntity<AudienceResponse> create(@Valid @RequestBody AudienceRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(audienceService.create(request));
    }

    @GetMapping
    public ResponseEntity<List<AudienceResponse>> findAll() {
        return ResponseEntity.ok(audienceService.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<AudienceResponse> findById(@PathVariable Long id) {
        return ResponseEntity.ok(audienceService.findById(id));
    }

    @PutMapping("/{id}")
    public ResponseEntity<AudienceResponse> update(@PathVariable Long id,
                                                    @Valid @RequestBody AudienceRequest request) {
        return ResponseEntity.ok(audienceService.update(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        audienceService.delete(id);
        return ResponseEntity.noContent().build();
    }
}

package com.example.demo.controller;

import com.example.demo.dto.service.ServRequest;
import com.example.demo.dto.service.ServResponse;
import com.example.demo.service.ServService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/services")
@RequiredArgsConstructor
public class ServiceController {

    private final ServService servService;

    @PostMapping
    public ResponseEntity<ServResponse> create(@Valid @RequestBody ServRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(servService.create(request));
    }

    @GetMapping
    public ResponseEntity<List<ServResponse>> findAll() {
        return ResponseEntity.ok(servService.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<ServResponse> findById(@PathVariable Long id) {
        return ResponseEntity.ok(servService.findById(id));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ServResponse> update(@PathVariable Long id,
                                                @Valid @RequestBody ServRequest request) {
        return ResponseEntity.ok(servService.update(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        servService.delete(id);
        return ResponseEntity.noContent().build();
    }
}

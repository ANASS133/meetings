package com.example.demo.controller;

import com.example.demo.dto.document.DocumentResponse;
import com.example.demo.service.DocumentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class DocumentController {

    private final DocumentService documentService;

    @PostMapping("/meetings/{meetingId}/documents")
    public ResponseEntity<DocumentResponse> upload(@PathVariable Long meetingId,
                                                    @RequestParam("file") MultipartFile file) {
        return ResponseEntity.status(HttpStatus.CREATED).body(documentService.upload(meetingId, file));
    }

    @GetMapping("/meetings/{meetingId}/documents")
    public ResponseEntity<List<DocumentResponse>> findByMeeting(@PathVariable Long meetingId) {
        return ResponseEntity.ok(documentService.findByMeetingId(meetingId));
    }

    @GetMapping("/documents/{id}")
    public ResponseEntity<DocumentResponse> findById(@PathVariable Long id) {
        return ResponseEntity.ok(documentService.findById(id));
    }

    @DeleteMapping("/documents/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        documentService.delete(id);
        return ResponseEntity.noContent().build();
    }
}

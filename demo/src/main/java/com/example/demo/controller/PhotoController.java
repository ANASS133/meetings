package com.example.demo.controller;

import com.example.demo.dto.photo.PhotoResponse;
import com.example.demo.service.PhotoService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class PhotoController {

    private final PhotoService photoService;

    @PostMapping("/meetings/{meetingId}/photos")
    public ResponseEntity<PhotoResponse> upload(@PathVariable Long meetingId,
                                                 @RequestParam("file") MultipartFile file) {
        return ResponseEntity.status(HttpStatus.CREATED).body(photoService.upload(meetingId, file));
    }

    @GetMapping("/meetings/{meetingId}/photos")
    public ResponseEntity<List<PhotoResponse>> findByMeeting(@PathVariable Long meetingId) {
        return ResponseEntity.ok(photoService.findByMeetingId(meetingId));
    }

    @GetMapping("/photos/{id}")
    public ResponseEntity<PhotoResponse> findById(@PathVariable Long id) {
        return ResponseEntity.ok(photoService.findById(id));
    }

    @DeleteMapping("/photos/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        photoService.delete(id);
        return ResponseEntity.noContent().build();
    }
}

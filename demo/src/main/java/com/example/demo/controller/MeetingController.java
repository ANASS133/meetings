package com.example.demo.controller;

import com.example.demo.dto.meeting.MeetingRequest;
import com.example.demo.dto.meeting.MeetingResponse;
import com.example.demo.dto.meeting.LiveDataUpdateRequest;
import com.example.demo.service.MeetingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/meetings")
@RequiredArgsConstructor
public class MeetingController {

    private final MeetingService meetingService;

    @PostMapping
    public ResponseEntity<MeetingResponse> create(@Valid @RequestBody MeetingRequest request) {
        System.out.println("===== CREATE MEETING REQUEST =====");
        System.out.println("Objective: " + request.getObjective());
        System.out.println("Communes received: " + request.getCommunes());
        System.out.println("==================================");
        return ResponseEntity.status(HttpStatus.CREATED).body(meetingService.create(request));
    }

    @GetMapping
    public ResponseEntity<List<MeetingResponse>> findAll(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String type,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String dateFrom,
            @RequestParam(required = false) String dateTo) {
        return ResponseEntity.ok(meetingService.findAllFiltered(search, type, status, dateFrom, dateTo));
    }

    @GetMapping("/{id}")
    public ResponseEntity<MeetingResponse> findById(@PathVariable Long id) {
        return ResponseEntity.ok(meetingService.findById(id));
    }

    @PutMapping("/{id}")
    public ResponseEntity<MeetingResponse> update(@PathVariable Long id,
                                                   @Valid @RequestBody MeetingRequest request) {
        return ResponseEntity.ok(meetingService.update(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        meetingService.delete(id);
        return ResponseEntity.noContent().build();
    }

    // ── Time-management endpoints ──

    @PostMapping("/{id}/start")
    public ResponseEntity<MeetingResponse> startMeeting(@PathVariable Long id) {
        return ResponseEntity.ok(meetingService.startMeeting(id));
    }

    @PostMapping("/{id}/end")
    public ResponseEntity<MeetingResponse> endMeeting(@PathVariable Long id) {
        return ResponseEntity.ok(meetingService.endMeeting(id));
    }

    @PostMapping("/{id}/pause")
    public ResponseEntity<MeetingResponse> pauseMeeting(@PathVariable Long id) {
        return ResponseEntity.ok(meetingService.pauseMeeting(id));
    }

    @PostMapping("/{id}/resume")
    public ResponseEntity<MeetingResponse> resumeMeeting(@PathVariable Long id) {
        return ResponseEntity.ok(meetingService.resumeMeeting(id));
    }

    // ── Live participant management ──

    @PostMapping("/{id}/participants/{participantId}")
    public ResponseEntity<MeetingResponse> addParticipant(
            @PathVariable Long id,
            @PathVariable Long participantId) {
        return ResponseEntity.ok(meetingService.addParticipant(id, participantId));
    }

    @DeleteMapping("/{id}/participants/{participantId}")
    public ResponseEntity<MeetingResponse> removeParticipant(
            @PathVariable Long id,
            @PathVariable Long participantId) {
        return ResponseEntity.ok(meetingService.removeParticipant(id, participantId));
    }

    // ── Live data endpoint ──

    @PutMapping("/{id}/live-data")
    public ResponseEntity<MeetingResponse> updateLiveData(
            @PathVariable Long id,
            @RequestBody LiveDataUpdateRequest request) {
        return ResponseEntity.ok(meetingService.updateLiveData(id, request.getDiscussion(), request.getRecommendation()));
    }
}
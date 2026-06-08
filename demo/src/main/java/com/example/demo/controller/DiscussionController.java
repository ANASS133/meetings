package com.example.demo.controller;

import com.example.demo.dto.discussion.DiscussionRequest;
import com.example.demo.dto.discussion.DiscussionResponse;
import com.example.demo.service.DiscussionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/meetings/{meetingId}/discussions")
@RequiredArgsConstructor
public class DiscussionController {

    private final DiscussionService discussionService;

    @PostMapping
    public ResponseEntity<DiscussionResponse> create(@PathVariable Long meetingId,
                                                      @Valid @RequestBody DiscussionRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(discussionService.create(meetingId, request));
    }

    @GetMapping
    public ResponseEntity<List<DiscussionResponse>> findByMeeting(@PathVariable Long meetingId) {
        return ResponseEntity.ok(discussionService.findByMeetingId(meetingId));
    }

    @DeleteMapping("/{discussionId}")
    public ResponseEntity<Void> delete(@PathVariable Long meetingId,
                                        @PathVariable Long discussionId) {
        discussionService.delete(discussionId);
        return ResponseEntity.noContent().build();
    }
}

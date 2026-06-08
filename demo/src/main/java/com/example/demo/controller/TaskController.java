package com.example.demo.controller;

import com.example.demo.dto.task.TaskRequest;
import com.example.demo.dto.task.TaskResponse;
import com.example.demo.service.TaskService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/meetings/{meetingId}/tasks")
@RequiredArgsConstructor
public class TaskController {

    private final TaskService taskService;

    @PostMapping
    public ResponseEntity<TaskResponse> create(@PathVariable Long meetingId,
                                                @Valid @RequestBody TaskRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(taskService.create(meetingId, request));
    }

    @GetMapping
    public ResponseEntity<List<TaskResponse>> findByMeeting(@PathVariable Long meetingId) {
        return ResponseEntity.ok(taskService.findByMeetingId(meetingId));
    }

    @PutMapping("/{taskId}")
    public ResponseEntity<TaskResponse> update(@PathVariable Long meetingId,
                                                @PathVariable Long taskId,
                                                @Valid @RequestBody TaskRequest request) {
        return ResponseEntity.ok(taskService.update(taskId, request));
    }

    @DeleteMapping("/{taskId}")
    public ResponseEntity<Void> delete(@PathVariable Long meetingId,
                                        @PathVariable Long taskId) {
        taskService.delete(taskId);
        return ResponseEntity.noContent().build();
    }
}

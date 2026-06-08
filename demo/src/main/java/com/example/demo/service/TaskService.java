package com.example.demo.service;

import com.example.demo.dto.task.TaskRequest;
import com.example.demo.dto.task.TaskResponse;
import com.example.demo.entity.Meeting;
import com.example.demo.entity.Task;
import com.example.demo.exception.ResourceNotFoundException;
import com.example.demo.repository.MeetingRepository;
import com.example.demo.repository.ParticipantRepository;
import com.example.demo.repository.TaskRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TaskService {

    private final TaskRepository taskRepository;
    private final MeetingRepository meetingRepository;
    private final ParticipantRepository participantRepository;

    @Transactional
    public TaskResponse create(Long meetingId, TaskRequest request) {
        Meeting meeting = meetingRepository.findById(meetingId)
                .orElseThrow(() -> new ResourceNotFoundException("Meeting", "id", meetingId));

        Task task = Task.builder()
                .title(request.getTitle())
                .status(request.getStatus() != null ? request.getStatus().toUpperCase() : "PENDING")
                .priority(request.getPriority() != null ? request.getPriority().toUpperCase() : "MEDIUM")
                .dueDate(request.getDueDate())
                .meeting(meeting)
                .build();

        if (request.getAssignedToId() != null) {
            participantRepository.findById(request.getAssignedToId())
                    .ifPresent(task::setAssignedTo);
        }

        task = taskRepository.save(task);
        return toResponse(task);
    }

    @Transactional(readOnly = true)
    public List<TaskResponse> findByMeetingId(Long meetingId) {
        return taskRepository.findByMeetingId(meetingId).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public TaskResponse update(Long taskId, TaskRequest request) {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new ResourceNotFoundException("Task", "id", taskId));

        if (request.getTitle() != null) {
            task.setTitle(request.getTitle());
        }
        if (request.getStatus() != null) {
            task.setStatus(request.getStatus());
        }
        if (request.getPriority() != null) {
            task.setPriority(request.getPriority().toUpperCase());
        }
        // Always update dueDate (null = clear deadline)
        task.setDueDate(request.getDueDate());

        // Always update assignee (null = unassign)
        if (request.getAssignedToId() != null) {
            participantRepository.findById(request.getAssignedToId())
                    .ifPresent(task::setAssignedTo);
        } else {
            task.setAssignedTo(null);
        }

        task = taskRepository.save(task);
        return toResponse(task);
    }

    @Transactional
    public void delete(Long taskId) {
        if (!taskRepository.existsById(taskId)) {
            throw new ResourceNotFoundException("Task", "id", taskId);
        }
        taskRepository.deleteById(taskId);
    }

    private TaskResponse toResponse(Task t) {
        return TaskResponse.builder()
                .id(t.getId())
                .title(t.getTitle())
                .status(t.getStatus())
                .priority(t.getPriority())
                .dueDate(t.getDueDate())
                .meetingId(t.getMeeting() != null ? t.getMeeting().getId() : null)
                .assignedToId(t.getAssignedTo() != null ? t.getAssignedTo().getId() : null)
                .assignedToName(t.getAssignedTo() != null ? t.getAssignedTo().getFirstName() + " " + t.getAssignedTo().getLastName() : null)
                .build();
    }
}
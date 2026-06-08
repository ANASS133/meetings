package com.example.demo.dto.task;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TaskResponse {

    private Long id;

    private String title;

    private String status;

    private String priority;

    private LocalDate dueDate;

    private Long meetingId;

    private Long assignedToId;

    private String assignedToName;
}

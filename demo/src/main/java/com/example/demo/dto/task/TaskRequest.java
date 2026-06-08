package com.example.demo.dto.task;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TaskRequest {

    @NotBlank(message = "Title is required")
    private String title;

    private String status;

    /**
     * Priority: HIGH, MEDIUM, or LOW. Defaults to MEDIUM if absent.
     */
    private String priority;

    /**
     * Optional deadline for the task.
     */
    private LocalDate dueDate;

    /**
     * ID of the participant assigned to this task (optional).
     */
    private Long assignedToId;
}

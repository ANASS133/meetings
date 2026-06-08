package com.example.demo.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;

@Entity
@Table(name = "tasks")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Task {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false)
    @Builder.Default
    private String status = "PENDING";

    /**
     * Priority level: HIGH, MEDIUM, LOW.
     */
    @Column(nullable = false, columnDefinition = "VARCHAR(10) DEFAULT 'MEDIUM'")
    @Builder.Default
    private String priority = "MEDIUM";

    /**
     * Optional deadline for the task.
     */
    private LocalDate dueDate;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "meeting_id")
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    @JsonIgnoreProperties({"tasks", "participants", "audiences", "photos", "documents"})
    private Meeting meeting;

    /**
     * Participant assigned to this task (optional).
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assigned_to_id")
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    @JsonIgnoreProperties({"meetings", "discussions"})
    private Participant assignedTo;
}

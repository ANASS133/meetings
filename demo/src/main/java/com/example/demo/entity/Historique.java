package com.example.demo.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

@Entity
@Table(name = "historique")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Historique {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long meetingId;

    private String objective;

    private String type;

    @Column(columnDefinition = "TEXT")
    private String description;

    private LocalDate date;

    private LocalTime startTime;

    private LocalTime endTime;

    private Long durationMinutes;

    private String room;

    private String objet;

    private String dependences;

    private String rapporteur;

    private String presidente;

    @Column(columnDefinition = "TEXT")
    private String communes;

    @Column(columnDefinition = "TEXT")
    private String discussion;

    @Column(columnDefinition = "TEXT")
    private String recommendation;

    @Column(columnDefinition = "TEXT")
    private String tasks;

    private LocalDateTime deletedAt;
}

package com.example.demo.dto.meeting;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class MeetingRequest {

    @NotBlank(message = "Objective is required")
    private String objective;

    @NotBlank(message = "Type is required")
    private String type;

    private String description;

    @NotNull(message = "Date is required")
    private LocalDate date;

    @NotNull(message = "Start time is required")
    private LocalTime startTime;

    @NotNull(message = "End time is required")
    private LocalTime endTime;

    private String room;

    private String discussion;

    private String recommendation;

    private String objet;

    private String dependences;

    private String rapporteur;

    private String presidente;

    private java.util.Set<String> communes;

    private List<Long> participantIds;
    private List<Long> audienceIds;
}

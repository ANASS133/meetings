package com.example.demo.dto.meeting;

import com.example.demo.dto.audience.AudienceResponse;
import com.example.demo.dto.document.DocumentResponse;
import com.example.demo.dto.participant.ParticipantResponse;
import com.example.demo.dto.photo.PhotoResponse;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MeetingResponse {

    private Long id;

    private String objective;

    private String type;

    private String description;

    private LocalDate date;

    private LocalTime startTime;

    private LocalTime endTime;

    // Planned duration (minutes) — UI reference only
    private long plannedDurationMinutes;

    // Real duration (minutes) — set when meeting ends
    private Long finalDurationMinutes;

    private String room;

    private String discussion;

    private String recommendation;

    private String objet;

    private String dependences;

    private String rapporteur;

    private String presidente;

    private java.util.Set<String> communes;

    private List<ParticipantResponse> participants;

    private List<AudienceResponse> audiences;

    private List<PhotoResponse> photos;

    private List<DocumentResponse> documents;

    // Persisted status: PLANNED | IN_PROGRESS | COMPLETED
    private String status;

    // ── Live state fields (populated only for IN_PROGRESS meetings) ──
    private LocalDateTime actualStartTime;
    private LocalDateTime actualEndTime;
    private Long pausedDurationSeconds;
    private Long elapsedSeconds;   // server-calculated live elapsed
    private Boolean isPaused;

    /**
     * Convenience — kept for backward compatibility with older
     * frontend code that may reference .duration.
     * Returns plannedDurationMinutes.
     */
    @Deprecated
    public long getDuration() {
        return plannedDurationMinutes;
    }
}

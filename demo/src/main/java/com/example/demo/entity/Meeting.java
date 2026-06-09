package com.example.demo.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;

@Entity
@Table(name = "meetings")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Meeting {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String objective;

    @Column(nullable = false)
    private String type;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false)
    private LocalDate date;

    @Column(nullable = false)
    private LocalTime startTime;

    @Column(nullable = false)
    private LocalTime endTime;

    private String room;

    @Column(columnDefinition = "TEXT")
    private String discussion;

    @Column(columnDefinition = "TEXT")
    private String recommendation;

    private String objet;

    private String dependences;

    private String rapporteur;

    private String presidente;

    // ---------------------------------------------------------------
    // Element Collection: Meeting -> Communes
    // ---------------------------------------------------------------
    @ElementCollection
    @CollectionTable(
        name = "meeting_communes",
        joinColumns = @JoinColumn(name = "meeting_id")
    )
    @Column(name = "commune_name", length = 150)
    @Builder.Default
    private Set<String> communes = new java.util.HashSet<>();

    // ---------------------------------------------------------------
    // Time tracking fields (server-authoritative)
    // ---------------------------------------------------------------

    /**
     * Server timestamp recorded when "Start Meeting" is clicked.
     * Null until the meeting is started.
     */
    private LocalDateTime actualStartTime;

    /**
     * Server timestamp recorded when "End Meeting" is clicked.
     * Null until the meeting is ended.
     */
    private LocalDateTime actualEndTime;

    /**
     * Meeting status persisted in database.
     * planned / in_progress / completed
     */
    @Column(nullable = false, columnDefinition = "VARCHAR(20) DEFAULT 'planned'")
    @Builder.Default
    private String status = "planned";

    /**
     * Planned duration in minutes, calculated from startTime → endTime.
     * Set on meeting creation/update. Used as UI reference only.
     */
    private Long plannedDurationMinutes;

    /**
     * Total authorized extra time in seconds (sum of manual extensions: +5, +10, +15 mins).
     */
    @Builder.Default
    private Long extraTimeAllowedSeconds = 0L;

    /**
     * Real duration in minutes, calculated at meeting end:
     * floor((actualEndTime - actualStartTime - pausedDurationSeconds) / 60)
     * Stored without any adjustment, rounding, or extension.
     */
    private Long finalDurationMinutes;

    /**
     * Cumulative pause time in seconds.
     * Updated on each resume: += Duration.between(pauseStartTime, now).getSeconds()
     */
    @Builder.Default
    private Long pausedDurationSeconds = 0L;

    /**
     * Timestamp when the current pause started. Null when not paused.
     * Persisted so pause survives server restarts.
     */
    private LocalDateTime pauseStartTime;

    // ---------------------------------------------------------------
    // Convenience helpers (transient — not stored)
    // ---------------------------------------------------------------

    /**
     * Returns true when the meeting is currently paused.
     */
    @Transient
    public boolean isPaused() {
        return pauseStartTime != null;
    }

    // ---------------------------------------------------------------
    // Many-to-Many: Meeting <-> Participant
    // ---------------------------------------------------------------
    @ManyToMany
    @JoinTable(
        name = "meeting_participants",
        joinColumns = @JoinColumn(name = "meeting_id"),
        inverseJoinColumns = @JoinColumn(name = "participant_id")
    )
    @Builder.Default
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    @JsonIgnoreProperties("meetings")
    private List<Participant> participants = new ArrayList<>();

    // ---------------------------------------------------------------
    // Many-to-Many: Meeting <-> Audience
    // ---------------------------------------------------------------
    @ManyToMany
    @JoinTable(
        name = "meeting_audiences",
        joinColumns = @JoinColumn(name = "meeting_id"),
        inverseJoinColumns = @JoinColumn(name = "audience_id")
    )
    @Builder.Default
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    @JsonIgnoreProperties("meetings")
    private List<Audience> audiences = new ArrayList<>();

    // ---------------------------------------------------------------
    // One-to-Many: Meeting -> Photo
    // ---------------------------------------------------------------
    @OneToMany(mappedBy = "meeting", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    @JsonIgnoreProperties("meeting")
    private List<Photo> photos = new ArrayList<>();

    // ---------------------------------------------------------------
    // One-to-Many: Meeting -> Discussion
    // ---------------------------------------------------------------
    @OneToMany(mappedBy = "meeting", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    @JsonIgnoreProperties("meeting")
    private List<Discussion> discussions = new ArrayList<>();

    // ---------------------------------------------------------------
    // One-to-Many: Meeting -> Task
    // ---------------------------------------------------------------
    @OneToMany(mappedBy = "meeting", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    @JsonIgnoreProperties("meeting")
    private List<Task> tasks = new ArrayList<>();

    // ---------------------------------------------------------------
    // One-to-Many: Meeting -> Document
    // ---------------------------------------------------------------
    @OneToMany(mappedBy = "meeting", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    @JsonIgnoreProperties("meeting")
    private List<Document> documents = new ArrayList<>();
}

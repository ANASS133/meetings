package com.example.demo.service;

import com.example.demo.dto.audience.AudienceResponse;
import com.example.demo.dto.document.DocumentResponse;
import com.example.demo.dto.meeting.MeetingRequest;
import com.example.demo.dto.meeting.MeetingResponse;
import com.example.demo.dto.participant.ParticipantResponse;
import com.example.demo.dto.photo.PhotoResponse;
import com.example.demo.entity.*;
import com.example.demo.exception.ResourceNotFoundException;
import com.example.demo.repository.*;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class MeetingService {

    private final MeetingRepository meetingRepository;
    private final ParticipantRepository participantRepository;
    private final AudienceRepository audienceRepository;
    private final HistoriqueRepository historiqueRepository;
    private final com.fasterxml.jackson.databind.ObjectMapper objectMapper;

    // -----------------------------------------------------------------
    // Create
    // -----------------------------------------------------------------
    @Transactional
    public MeetingResponse create(MeetingRequest request) {
        long planned = 0;
        if (request.getStartTime() != null && request.getEndTime() != null) {
            planned = Duration.between(request.getStartTime(), request.getEndTime()).toMinutes();
        }

        Meeting meeting = Meeting.builder()
                .objective(request.getObjective())
                .type(request.getType())
                .description(request.getDescription())
                .date(request.getDate())
                .startTime(request.getStartTime())
                .endTime(request.getEndTime())
                .room(request.getRoom())
                .discussion(request.getDiscussion())
                .recommendation(request.getRecommendation())
                .objet(request.getObjet())
                .dependences(request.getDependences())
                .rapporteur(request.getRapporteur())
                .presidente(request.getPresidente())
                .communes(request.getCommunes() != null ? request.getCommunes() : new java.util.HashSet<>())
                .status("planned")
                .plannedDurationMinutes(planned)
                .pausedDurationSeconds(0L)
                .build();

        setRelations(meeting, request.getParticipantIds(), request.getAudienceIds());

        meeting = meetingRepository.save(meeting);
        return toResponse(meeting);
    }

    // -----------------------------------------------------------------
    // Read
    // -----------------------------------------------------------------
    @Transactional(readOnly = true)
    public List<MeetingResponse> findAll() {
        return meetingRepository.findAll().stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public MeetingResponse findById(Long id) {
        Meeting meeting = meetingRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Meeting", "id", id));
        return toResponse(meeting);
    }

    // -----------------------------------------------------------------
    // Update
    // -----------------------------------------------------------------
    @Transactional
    public MeetingResponse update(Long id, MeetingRequest request) {
        Meeting meeting = meetingRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Meeting", "id", id));

        meeting.setObjective(request.getObjective());
        meeting.setType(request.getType());
        meeting.setDescription(request.getDescription());
        meeting.setDate(request.getDate());
        meeting.setStartTime(request.getStartTime());
        meeting.setEndTime(request.getEndTime());
        meeting.setRoom(request.getRoom());
        meeting.setDiscussion(request.getDiscussion());
        meeting.setRecommendation(request.getRecommendation());
        meeting.setObjet(request.getObjet());
        meeting.setDependences(request.getDependences());
        meeting.setRapporteur(request.getRapporteur());
        meeting.setPresidente(request.getPresidente());
        meeting.setCommunes(request.getCommunes() != null ? request.getCommunes() : new java.util.HashSet<>());

        // Recalculate planned duration
        if (request.getStartTime() != null && request.getEndTime() != null) {
            meeting.setPlannedDurationMinutes(
                    Duration.between(request.getStartTime(), request.getEndTime()).toMinutes());
        }

        // Clear and re-set relations
        meeting.getParticipants().clear();
        meeting.getAudiences().clear();
        setRelations(meeting, request.getParticipantIds(), request.getAudienceIds());

        meeting = meetingRepository.save(meeting);
        return toResponse(meeting);
    }

    // -----------------------------------------------------------------
    // Delete (archive to historique, then delete)
    // -----------------------------------------------------------------
    @Transactional
    public void delete(Long id) {
        Meeting meeting = meetingRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Meeting", "id", id));

        historiqueRepository.save(toHistorique(meeting));

        // Clear all associations to avoid FK constraint violations
        meeting.getParticipants().clear();
        meeting.getAudiences().clear();
        meeting.getDiscussions().clear();
        meeting.getTasks().clear();
        meeting.getPhotos().clear();
        meeting.getDocuments().clear();
        meeting.getCommunes().clear();

        meetingRepository.save(meeting); // flush join-table deletions
        meetingRepository.delete(meeting);
    }

    // -----------------------------------------------------------------
    // Start meeting
    // -----------------------------------------------------------------
    @Transactional
    public MeetingResponse startMeeting(Long id) {
        Meeting meeting = meetingRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Meeting", "id", id));

        if (!"planned".equals(meeting.getStatus())) {
            throw new IllegalStateException(
                    "Meeting cannot be started — current status: " + meeting.getStatus());
        }

        meeting.setActualStartTime(LocalDateTime.now());
        meeting.setStatus("in_progress");
        meeting.setPausedDurationSeconds(0L);
        meeting.setPauseStartTime(null);

        meeting = meetingRepository.save(meeting);
        return toResponse(meeting);
    }

    // -----------------------------------------------------------------
    // End meeting
    // -----------------------------------------------------------------
    @Transactional
    public MeetingResponse endMeeting(Long id) {
        Meeting meeting = meetingRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Meeting", "id", id));

        if (!"in_progress".equals(meeting.getStatus())) {
            throw new IllegalStateException(
                    "Meeting cannot be ended — current status: " + meeting.getStatus());
        }

        LocalDateTime now = LocalDateTime.now();

        // If currently paused, close the pause interval first
        if (meeting.getPauseStartTime() != null) {
            long additionalPause = Duration.between(meeting.getPauseStartTime(), now).getSeconds();
            meeting.setPausedDurationSeconds(
                    (meeting.getPausedDurationSeconds() != null ? meeting.getPausedDurationSeconds() : 0L)
                            + additionalPause);
            meeting.setPauseStartTime(null);
        }

        meeting.setActualEndTime(now);
        meeting.setStatus("completed");

        // Calculate final duration: (actualEndTime - actualStartTime - pausedDuration) in minutes
        long totalElapsedSeconds = Duration.between(meeting.getActualStartTime(), now).getSeconds();
        long paused = meeting.getPausedDurationSeconds() != null ? meeting.getPausedDurationSeconds() : 0L;
        long effectiveSeconds = Math.max(0, totalElapsedSeconds - paused);
        long finalMinutes = effectiveSeconds / 60;  // truncation → Math.floor

        meeting.setFinalDurationMinutes(finalMinutes);

        // Archive and delete
        historiqueRepository.save(toHistorique(meeting));
        MeetingResponse response = toResponse(meeting);

        // Clear all associations to avoid FK constraint violations
        meeting.getParticipants().clear();
        meeting.getAudiences().clear();
        meeting.getDiscussions().clear();
        meeting.getTasks().clear();
        meeting.getPhotos().clear();
        meeting.getDocuments().clear();
        meeting.getCommunes().clear();

        meetingRepository.save(meeting); // flush join-table deletions
        meetingRepository.delete(meeting);

        return response;
    }

    // -----------------------------------------------------------------
    // Pause meeting
    // -----------------------------------------------------------------
    @Transactional
    public MeetingResponse pauseMeeting(Long id) {
        Meeting meeting = meetingRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Meeting", "id", id));

        if (!"in_progress".equals(meeting.getStatus())) {
            throw new IllegalStateException(
                    "Meeting cannot be paused — current status: " + meeting.getStatus());
        }

        if (meeting.getPauseStartTime() != null) {
            throw new IllegalStateException("Meeting is already paused.");
        }

        meeting.setPauseStartTime(LocalDateTime.now());
        meeting = meetingRepository.save(meeting);
        return toResponse(meeting);
    }

    // -----------------------------------------------------------------
    // Resume meeting
    // -----------------------------------------------------------------
    @Transactional
    public MeetingResponse resumeMeeting(Long id) {
        Meeting meeting = meetingRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Meeting", "id", id));

        if (!"in_progress".equals(meeting.getStatus())) {
            throw new IllegalStateException(
                    "Meeting cannot be resumed — current status: " + meeting.getStatus());
        }

        if (meeting.getPauseStartTime() == null) {
            throw new IllegalStateException("Meeting is not paused.");
        }

        long additionalPause = Duration.between(meeting.getPauseStartTime(), LocalDateTime.now()).getSeconds();
        meeting.setPausedDurationSeconds(
                (meeting.getPausedDurationSeconds() != null ? meeting.getPausedDurationSeconds() : 0L)
                        + additionalPause);
        meeting.setPauseStartTime(null);

        meeting = meetingRepository.save(meeting);
        return toResponse(meeting);
    }

    // -----------------------------------------------------------------
    // Update live data (discussion / recommendation)
    // -----------------------------------------------------------------
    @Transactional
    public MeetingResponse updateLiveData(Long id, String discussion, String recommendation) {
        Meeting meeting = meetingRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Meeting", "id", id));
        meeting.setDiscussion(discussion);
        meeting.setRecommendation(recommendation);
        meeting = meetingRepository.save(meeting);
        return toResponse(meeting);
    }

    // -----------------------------------------------------------------
    // Live participant management (add / remove from an active meeting)
    // -----------------------------------------------------------------

    @Transactional
    public MeetingResponse addParticipant(Long meetingId, Long participantId) {
        Meeting meeting = meetingRepository.findById(meetingId)
                .orElseThrow(() -> new ResourceNotFoundException("Meeting", "id", meetingId));
        Participant participant = participantRepository.findById(participantId)
                .orElseThrow(() -> new ResourceNotFoundException("Participant", "id", participantId));

        if (!meeting.getParticipants().contains(participant)) {
            meeting.getParticipants().add(participant);
            meeting = meetingRepository.save(meeting);
        }
        return toResponse(meeting);
    }

    @Transactional
    public MeetingResponse removeParticipant(Long meetingId, Long participantId) {
        Meeting meeting = meetingRepository.findById(meetingId)
                .orElseThrow(() -> new ResourceNotFoundException("Meeting", "id", meetingId));
        Participant participant = participantRepository.findById(participantId)
                .orElseThrow(() -> new ResourceNotFoundException("Participant", "id", participantId));

        if (meeting.getParticipants().contains(participant)) {
            meeting.getParticipants().remove(participant);
            meeting = meetingRepository.save(meeting);
        }
        return toResponse(meeting);
    }

    // -----------------------------------------------------------------
    // Filtered listing
    // -----------------------------------------------------------------
    @Transactional(readOnly = true)
    public List<MeetingResponse> findAllFiltered(String search, String type, String status, String dateFrom, String dateTo) {
        List<MeetingResponse> all = findAll();

        return all.stream()
                .filter(m -> {
                    if (search != null && !search.trim().isEmpty()) {
                        String s = search.toLowerCase();
                        boolean match = false;
                        if (m.getObjective() != null && m.getObjective().toLowerCase().contains(s)) match = true;
                        if (m.getType() != null && m.getType().toLowerCase().contains(s)) match = true;
                        if (m.getRoom() != null && m.getRoom().toLowerCase().contains(s)) match = true;
                        if (m.getObjet() != null && m.getObjet().toLowerCase().contains(s)) match = true;
                        if (!match) return false;
                    }
                    if (type != null && !type.isEmpty()) {
                        if (m.getType() == null || !m.getType().equalsIgnoreCase(type)) {
                            return false;
                        }
                    }
                    if (status != null && !status.isEmpty()) {
                        if (m.getStatus() == null || !m.getStatus().equalsIgnoreCase(status)) {
                            return false;
                        }
                    }
                    if (dateFrom != null && !dateFrom.isEmpty()) {
                        LocalDate from = LocalDate.parse(dateFrom);
                        if (m.getDate() == null || m.getDate().isBefore(from)) {
                            return false;
                        }
                    }
                    if (dateTo != null && !dateTo.isEmpty()) {
                        LocalDate to = LocalDate.parse(dateTo);
                        if (m.getDate() == null || m.getDate().isAfter(to)) {
                            return false;
                        }
                    }
                    return true;
                })
                .collect(Collectors.toList());
    }

    // -----------------------------------------------------------------
    // Helpers
    // -----------------------------------------------------------------

    private void setRelations(Meeting meeting, List<Long> participantIds, List<Long> audienceIds) {
        if (participantIds != null) {
            List<Participant> participants = participantRepository.findAllById(participantIds);
            meeting.getParticipants().addAll(participants);
        }
        if (audienceIds != null) {
            List<Audience> audiences = audienceRepository.findAllById(audienceIds);
            meeting.getAudiences().addAll(audiences);
        }
    }

    private Historique toHistorique(Meeting meeting) {
        String discussionsJson = "[]";
        String tasksJson = "[]";
        String communesJson = "[]";
        try {
            if (meeting.getDiscussions() != null) {
                discussionsJson = objectMapper.writeValueAsString(meeting.getDiscussions().stream().map(d -> 
                    com.example.demo.dto.discussion.DiscussionResponse.builder()
                        .id(d.getId())
                        .content(d.getContent())
                        .speaker(d.getSpeaker())
                        .type(d.getType())
                        .build()
                ).collect(Collectors.toList()));
            }
            if (meeting.getTasks() != null) {
                tasksJson = objectMapper.writeValueAsString(meeting.getTasks().stream().map(t -> 
                    java.util.Map.of(
                        "id", t.getId(),
                        "title", t.getTitle(),
                        "status", t.getStatus(),
                        "priority", t.getPriority()
                    )
                ).collect(Collectors.toList()));
            }
            if (meeting.getCommunes() != null) {
                communesJson = objectMapper.writeValueAsString(meeting.getCommunes());
            }
        } catch (Exception e) {}

        return Historique.builder()
                .meetingId(meeting.getId())
                .objective(meeting.getObjective())
                .type(meeting.getType())
                .description(meeting.getDescription())
                .date(meeting.getDate())
                .startTime(meeting.getStartTime())
                .endTime(meeting.getEndTime())
                // Store the real final duration, not the planned one
                .durationMinutes(meeting.getFinalDurationMinutes() != null ? meeting.getFinalDurationMinutes() : 0L)
                .room(meeting.getRoom())
                .objet(meeting.getObjet())
                .dependences(meeting.getDependences())
                .rapporteur(meeting.getRapporteur())
                .presidente(meeting.getPresidente())
                .communes(communesJson)
                .discussion(discussionsJson)
                .recommendation(meeting.getRecommendation())
                .tasks(tasksJson)
                .deletedAt(LocalDateTime.now())
                .build();
    }

    private MeetingResponse toResponse(Meeting m) {
        // Compute live elapsed on read — no stored counter
        Long elapsed = null;
        Boolean paused = null;

        if ("in_progress".equals(m.getStatus()) && m.getActualStartTime() != null) {
            LocalDateTime referencePoint = m.getPauseStartTime() != null
                    ? m.getPauseStartTime()
                    : LocalDateTime.now();

            // Elapsed from actualStartTime to referencePoint, minus cumulative pauses
            long rawElapsed = Duration.between(m.getActualStartTime(), referencePoint).getSeconds();
            long pausedSecs = m.getPausedDurationSeconds() != null ? m.getPausedDurationSeconds() : 0L;
            elapsed = Math.max(0, rawElapsed - pausedSecs);
            paused = m.getPauseStartTime() != null;
        }

        return MeetingResponse.builder()
                .id(m.getId())
                .objective(m.getObjective())
                .type(m.getType())
                .description(m.getDescription())
                .date(m.getDate())
                .startTime(m.getStartTime())
                .endTime(m.getEndTime())
                .plannedDurationMinutes(m.getPlannedDurationMinutes() != null
                        ? m.getPlannedDurationMinutes()
                        : 0L)
                .finalDurationMinutes(m.getFinalDurationMinutes())
                .room(m.getRoom())
                .discussion(m.getDiscussion())
                .recommendation(m.getRecommendation())
                .objet(m.getObjet())
                .dependences(m.getDependences())
                .rapporteur(m.getRapporteur())
                .presidente(m.getPresidente())
                .communes(m.getCommunes())
                .participants(toParticipantList(m.getParticipants()))
                .audiences(toAudienceList(m.getAudiences()))
                .photos(toPhotoList(m.getPhotos()))
                .documents(toDocumentList(m.getDocuments()))
                .status(m.getStatus())
                .actualStartTime(m.getActualStartTime())
                .actualEndTime(m.getActualEndTime())
                .pausedDurationSeconds(m.getPausedDurationSeconds())
                .elapsedSeconds(elapsed)
                .isPaused(paused)
                .build();
    }

    // Mapping helpers — handling null-safe
    private List<ParticipantResponse> toParticipantList(List<Participant> list) {
        if (list == null) return Collections.emptyList();
        return list.stream()
                .filter(p -> p != null)
                .map(p -> ParticipantResponse.builder()
                        .id(p.getId())
                        .firstName(p.getFirstName())
                        .lastName(p.getLastName())
                        .email(p.getEmail())
                        .phone(p.getPhone())
                        .build())
                .collect(Collectors.toList());
    }

    private List<AudienceResponse> toAudienceList(List<Audience> list) {
        if (list == null) return Collections.emptyList();
        return list.stream()
                .filter(a -> a != null)
                .map(a -> AudienceResponse.builder()
                        .id(a.getId())
                        .name(a.getName())
                        .description(a.getDescription())
                        .build())
                .collect(Collectors.toList());
    }

    private List<PhotoResponse> toPhotoList(List<Photo> list) {
        if (list == null) return Collections.emptyList();
        return list.stream()
                .filter(p -> p != null)
                .map(p -> PhotoResponse.builder()
                        .id(p.getId())
                        .url(p.getUrl())
                        .uploadDate(p.getUploadDate())
                        .meetingId(p.getMeeting() != null ? p.getMeeting().getId() : null)
                        .uploadedById(p.getUploadedBy() != null ? p.getUploadedBy().getId() : null)
                        .build())
                .collect(Collectors.toList());
    }

    private List<DocumentResponse> toDocumentList(List<Document> list) {
        if (list == null) return Collections.emptyList();
        return list.stream()
                .filter(d -> d != null)
                .map(d -> DocumentResponse.builder()
                        .id(d.getId())
                        .name(d.getName())
                        .url(d.getUrl())
                        .meetingId(d.getMeeting() != null ? d.getMeeting().getId() : null)
                        .build())
                .collect(Collectors.toList());
    }
}
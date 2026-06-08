package com.example.demo.service;

import com.example.demo.dto.discussion.DiscussionRequest;
import com.example.demo.dto.discussion.DiscussionResponse;
import com.example.demo.entity.Discussion;
import com.example.demo.entity.Meeting;
import com.example.demo.entity.Participant;
import com.example.demo.exception.BadRequestException;
import com.example.demo.exception.ResourceNotFoundException;
import com.example.demo.repository.DiscussionRepository;
import com.example.demo.repository.MeetingRepository;
import com.example.demo.repository.ParticipantRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DiscussionService {

    private final DiscussionRepository discussionRepository;
    private final MeetingRepository meetingRepository;
    private final ParticipantRepository participantRepository;

    @Transactional
    public DiscussionResponse create(Long meetingId, DiscussionRequest request) {
        Meeting meeting = meetingRepository.findById(meetingId)
                .orElseThrow(() -> new ResourceNotFoundException("Meeting", "id", meetingId));

        Participant participant = null;
        if (request.getParticipantId() != null) {
            participant = participantRepository.findById(request.getParticipantId())
                    .orElseThrow(() -> new ResourceNotFoundException("Participant", "id", request.getParticipantId()));
        }

        String speaker = normalize(request.getSpeaker());
        if ((speaker == null || speaker.isBlank()) && participant != null) {
            speaker = formatParticipantName(participant);
        }
        if (speaker == null || speaker.isBlank()) {
            throw new BadRequestException("Speaker is required");
        }

        Discussion.DiscussionBuilder builder = Discussion.builder()
                .content(request.getContent())
                .speaker(speaker)
                .type(request.getType())
                .meeting(meeting);

        if (participant != null) {
            builder.participant(participant);
        }

        Discussion discussion = discussionRepository.save(builder.build());
        return toResponse(discussion);
    }

    @Transactional(readOnly = true)
    public List<DiscussionResponse> findByMeetingId(Long meetingId) {
        return discussionRepository.findByMeetingId(meetingId).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public void delete(Long discussionId) {
        if (!discussionRepository.existsById(discussionId)) {
            throw new ResourceNotFoundException("Discussion", "id", discussionId);
        }
        discussionRepository.deleteById(discussionId);
    }

    private DiscussionResponse toResponse(Discussion d) {
        return DiscussionResponse.builder()
                .id(d.getId())
                .content(d.getContent())
                .speaker(d.getSpeaker())
                .participantId(d.getParticipant() != null ? d.getParticipant().getId() : null)
                .participantName(d.getParticipant() != null
                        ? formatParticipantName(d.getParticipant())
                        : null)
                .meetingId(d.getMeeting() != null ? d.getMeeting().getId() : null)
                .type(d.getType())
                .build();
    }

    private String normalize(String value) {
        return value == null ? null : value.trim();
    }

    private String formatParticipantName(Participant participant) {
        String firstName = normalize(participant.getFirstName());
        String lastName = normalize(participant.getLastName());
        String fullName = ((firstName == null ? "" : firstName) + " " + (lastName == null ? "" : lastName)).trim();
        return fullName.isBlank() ? participant.getEmail() : fullName;
    }
}

package com.example.demo.dto.discussion;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DiscussionResponse {

    private Long id;

    private String content;

    private String speaker;

    private Long participantId;

    private String participantName;

    private Long meetingId;

    private String type;
}

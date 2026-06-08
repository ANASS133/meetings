package com.example.demo.dto.discussion;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class DiscussionRequest {

    @NotBlank(message = "Content is required")
    private String content;

    private String speaker;

    private Long participantId;

    private String type;
}

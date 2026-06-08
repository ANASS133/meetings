package com.example.demo.dto.photo;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PhotoResponse {

    private Long id;

    private String url;

    private LocalDateTime uploadDate;

    private Long meetingId;

    private Long uploadedById;
}

package com.example.demo.dto.stats;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RecentActivityResponse {
    private String action; // CREATED, UPDATED, DELETED, UPLOAD
    private String user;
    private String target;
    private LocalDateTime timestamp;
}

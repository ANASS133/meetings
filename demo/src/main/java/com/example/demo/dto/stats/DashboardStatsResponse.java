package com.example.demo.dto.stats;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DashboardStatsResponse {
    private long totalMeetings;
    private long upcomingMeetings;
    private long inProgressMeetings;
    private long completedMeetings;
    private Map<String, Long> byType;
    private List<RecentActivityResponse> recentActivity;
}

package com.example.demo.service;

import com.example.demo.dto.meeting.MeetingResponse;
import com.example.demo.dto.stats.DashboardStatsResponse;
import com.example.demo.dto.stats.RecentActivityResponse;
import com.example.demo.entity.Historique;
import com.example.demo.repository.HistoriqueRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class StatsService {

    private final MeetingService meetingService;
    private final HistoriqueRepository historiqueRepository;

    @Transactional(readOnly = true)
    public DashboardStatsResponse getDashboardStats() {
        List<MeetingResponse> activeMeetings = meetingService.findAll();

        long totalMeetings = activeMeetings.size();
        long upcomingMeetings = activeMeetings.stream()
                .filter(m -> "planned".equalsIgnoreCase(m.getStatus()))
                .count();
        long inProgressMeetings = activeMeetings.stream()
                .filter(m -> "in_progress".equalsIgnoreCase(m.getStatus()))
                .count();
        long completedMeetings = activeMeetings.stream()
                .filter(m -> "completed".equalsIgnoreCase(m.getStatus()))
                .count();

        // Calculate counts by type
        Map<String, Long> byType = new HashMap<>();
        for (MeetingResponse m : activeMeetings) {
            if (m.getType() != null) {
                byType.put(m.getType(), byType.getOrDefault(m.getType(), 0L) + 1);
            }
        }

        // Build recent activity list
        List<RecentActivityResponse> activities = new ArrayList<>();

        // Add deleted meetings from Historique as DELETED
        List<Historique> deletedMeetings = historiqueRepository.findAll();
        deletedMeetings.stream()
                .sorted((a, b) -> {
                    LocalDateTime at = a.getDeletedAt() != null ? a.getDeletedAt() : LocalDateTime.now();
                    LocalDateTime bt = b.getDeletedAt() != null ? b.getDeletedAt() : LocalDateTime.now();
                    return bt.compareTo(at);
                })
                .limit(10)
                .forEach(h -> {
                    activities.add(RecentActivityResponse.builder()
                            .action("DELETED")
                            .user("Admin")
                            .target(h.getObjective())
                            .timestamp(h.getDeletedAt() != null ? h.getDeletedAt() : LocalDateTime.now())
                            .build());
                });

        // Add active meetings as CREATED/SCHEDULED
        activeMeetings.stream()
                .sorted((a, b) -> b.getId().compareTo(a.getId()))
                .limit(10)
                .forEach(m -> {
                    activities.add(RecentActivityResponse.builder()
                            .action("CREATED")
                            .user("Admin")
                            .target(m.getObjective())
                            .timestamp(m.getDate() != null ? m.getDate().atStartOfDay() : LocalDateTime.now())
                            .build());
                });

        // Sort all activity by timestamp descending and limit to 10
        List<RecentActivityResponse> recentActivity = activities.stream()
                .sorted((a, b) -> b.getTimestamp().compareTo(a.getTimestamp()))
                .limit(10)
                .collect(Collectors.toList());

        return DashboardStatsResponse.builder()
                .totalMeetings(totalMeetings)
                .upcomingMeetings(upcomingMeetings)
                .inProgressMeetings(inProgressMeetings)
                .completedMeetings(completedMeetings)
                .byType(byType)
                .recentActivity(recentActivity)
                .build();
    }
}

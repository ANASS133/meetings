package com.example.demo.service;

import com.example.demo.repository.HistoriqueRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Slf4j
public class HistoriqueCleanupScheduler {

    private final HistoriqueRepository historiqueRepository;

    @Value("${app.historique.retention-days:180}")
    private int retentionDays;

    @Scheduled(cron = "${app.historique.cleanup-cron:0 0 2 * * ?}")
    @Transactional
    public void purgeOldHistory() {
        LocalDateTime limit = LocalDateTime.now().minusDays(retentionDays);
        log.info("Starting database purge of history records deleted before {}", limit);
        historiqueRepository.deleteByDeletedAtBefore(limit);
        log.info("Database purge completed.");
    }
}

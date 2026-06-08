package com.example.demo.repository;

import com.example.demo.entity.Historique;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.time.LocalDateTime;
import java.util.List;

public interface HistoriqueRepository extends JpaRepository<Historique, Long> {

    @Query("SELECT DISTINCT h.objective FROM Historique h WHERE h.objective IS NOT NULL AND h.objective <> '' ORDER BY h.objective")
    List<String> findDistinctObjectives();

    void deleteByDeletedAtBefore(LocalDateTime dateTime);

    List<Historique> findAllByOrderByDeletedAtDesc();

    List<Historique> findByMeetingId(Long meetingId);

    List<Historique> findByObjective(String objective);
}
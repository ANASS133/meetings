package com.example.demo.repository;

import com.example.demo.entity.Meeting;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;

public interface MeetingRepository extends JpaRepository<Meeting, Long> {

    List<Meeting> findByDate(LocalDate date);

    List<Meeting> findByDateBetween(LocalDate start, LocalDate end);

    @Query("SELECT m FROM Meeting m WHERE m.room = :room AND m.date = :date " +
           "AND m.startTime < :endTime AND m.endTime > :startTime " +
           "AND (:excludeId IS NULL OR m.id <> :excludeId)")
    List<Meeting> findOverlappingMeetings(
            @Param("room") String room,
            @Param("date") LocalDate date,
            @Param("startTime") java.time.LocalTime startTime,
            @Param("endTime") java.time.LocalTime endTime,
            @Param("excludeId") Long excludeId);
}

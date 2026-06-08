package com.example.demo.repository;

import com.example.demo.entity.Meeting;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;

public interface MeetingRepository extends JpaRepository<Meeting, Long> {

    List<Meeting> findByDate(LocalDate date);

    List<Meeting> findByDateBetween(LocalDate start, LocalDate end);
}

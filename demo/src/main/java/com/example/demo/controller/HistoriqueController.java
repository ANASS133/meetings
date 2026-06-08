package com.example.demo.controller;

import com.example.demo.entity.Historique;
import com.example.demo.repository.HistoriqueRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/historique")
@RequiredArgsConstructor
public class HistoriqueController {

    private final HistoriqueRepository historiqueRepository;

    @GetMapping
    public ResponseEntity<List<Historique>> getAll() {
        return ResponseEntity.ok(historiqueRepository.findAllByOrderByDeletedAtDesc());
    }

    @GetMapping("/objectives")
    public ResponseEntity<List<String>> getObjectives() {
        return ResponseEntity.ok(historiqueRepository.findDistinctObjectives());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Historique> getById(@PathVariable Long id) {
        return historiqueRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/by-objective")
    public ResponseEntity<List<Historique>> getByObjective(@RequestParam String objective) {
        List<Historique> results = historiqueRepository.findByObjective(objective);
        if (results.isEmpty()) return ResponseEntity.notFound().build();
        return ResponseEntity.ok(results);
    }

    @GetMapping("/meeting/{meetingId}")
    public ResponseEntity<Historique> getByMeetingId(@PathVariable Long meetingId) {
        return historiqueRepository.findByMeetingId(meetingId).stream()
                .findFirst()
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}")
    public ResponseEntity<Historique> update(@PathVariable Long id, @RequestBody Historique details) {
        return historiqueRepository.findById(id)
                .map(existing -> {
                    if (details.getObjective() != null) existing.setObjective(details.getObjective());
                    if (details.getType() != null) existing.setType(details.getType());
                    if (details.getDescription() != null) existing.setDescription(details.getDescription());
                    if (details.getDate() != null) existing.setDate(details.getDate());
                    if (details.getStartTime() != null) existing.setStartTime(details.getStartTime());
                    if (details.getEndTime() != null) existing.setEndTime(details.getEndTime());
                    if (details.getRoom() != null) existing.setRoom(details.getRoom());
                    if (details.getObjet() != null) existing.setObjet(details.getObjet());
                    if (details.getDependences() != null) existing.setDependences(details.getDependences());
                    if (details.getRapporteur() != null) existing.setRapporteur(details.getRapporteur());
                    if (details.getPresidente() != null) existing.setPresidente(details.getPresidente());
                    if (details.getCommunes() != null) existing.setCommunes(details.getCommunes());
                    if (details.getDiscussion() != null) existing.setDiscussion(details.getDiscussion());
                    if (details.getRecommendation() != null) existing.setRecommendation(details.getRecommendation());
                    if (details.getTasks() != null) existing.setTasks(details.getTasks());
                    return ResponseEntity.ok(historiqueRepository.save(existing));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/purge")
    public ResponseEntity<Void> purgeAll() {
        historiqueRepository.deleteAll();
        return ResponseEntity.ok().build();
    }
}
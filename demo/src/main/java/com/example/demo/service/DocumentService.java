package com.example.demo.service;

import com.example.demo.dto.document.DocumentResponse;
import com.example.demo.entity.Document;
import com.example.demo.entity.Meeting;
import com.example.demo.exception.ResourceNotFoundException;
import com.example.demo.repository.DocumentRepository;
import com.example.demo.repository.MeetingRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DocumentService {

    private final DocumentRepository documentRepository;
    private final MeetingRepository meetingRepository;
    private final FileStorageService fileStorageService;

    @Transactional
    public DocumentResponse upload(Long meetingId, MultipartFile file) {
        Meeting meeting = meetingRepository.findById(meetingId)
                .orElseThrow(() -> new ResourceNotFoundException("Meeting", "id", meetingId));

        String originalFilename = file.getOriginalFilename();
        String filePath = fileStorageService.storeFile(file, "documents");

        Document document = Document.builder()
                .name(originalFilename != null ? originalFilename : filePath)
                .url(filePath)
                .meeting(meeting)
                .build();

        document = documentRepository.save(document);
        return toResponse(document);
    }

    @Transactional(readOnly = true)
    public List<DocumentResponse> findByMeetingId(Long meetingId) {
        return documentRepository.findByMeetingId(meetingId).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public DocumentResponse findById(Long id) {
        Document document = documentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Document", "id", id));
        return toResponse(document);
    }

    @Transactional
    public void delete(Long id) {
        Document document = documentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Document", "id", id));

        fileStorageService.deleteFile(document.getUrl());
        documentRepository.delete(document);
    }

    private DocumentResponse toResponse(Document d) {
        return DocumentResponse.builder()
                .id(d.getId())
                .name(d.getName())
                .url(d.getUrl())
                .meetingId(d.getMeeting() != null ? d.getMeeting().getId() : null)
                .build();
    }
}
